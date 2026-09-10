from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from pgvector.psycopg2 import register_vector


# Database connection URL — set via DATABASE_URL env var or defaults to local PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/doc_intelligence",
)


class RetrievalService:
    """PostgreSQL + pgvector integration for document chunk storage and retrieval."""

    def __init__(self, database_url: str | None = None) -> None:
        # Establish persistent connection to PostgreSQL
        self.database_url = database_url or DATABASE_URL
        self.conn = psycopg2.connect(self.database_url)
        self.conn.autocommit = True

        # Check if pgvector extension is available in PostgreSQL
        self.has_pgvector = False
        try:
            with self.conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            register_vector(self.conn)
            self.has_pgvector = True
        except Exception:
            self.has_pgvector = False

        # Create table and indexes if they don't exist
        self._init_schema()

    def _init_schema(self) -> None:
        """Create the document_chunks table and indexes on first run."""
        with self.conn.cursor() as cur:
            if self.has_pgvector:
                # Table stores each chunk with its embedding vector(768) for cosine search
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id              TEXT PRIMARY KEY,
                        document_id     TEXT NOT NULL,
                        chunk_index     INTEGER NOT NULL,
                        content         TEXT NOT NULL,
                        source          TEXT NOT NULL DEFAULT 'unknown',
                        embedding       vector(768) NOT NULL
                    );
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_chunks_embedding
                    ON document_chunks
                    USING hnsw (embedding vector_cosine_ops);
                """)
            else:
                # Fallback table stores embeddings as float array
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id              TEXT PRIMARY KEY,
                        document_id     TEXT NOT NULL,
                        chunk_index     INTEGER NOT NULL,
                        content         TEXT NOT NULL,
                        source          TEXT NOT NULL DEFAULT 'unknown',
                        embedding       double precision[] NOT NULL
                    );
                """)

            # Index for filtering by document_id (used in metadata filtering)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_chunks_document_id
                ON document_chunks (document_id);
            """)

            # Index for filtering by source (document type / filename)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_chunks_source
                ON document_chunks (source);
            """)

            # ── Full-text search support (tsvector + GIN) ─────────────────
            # Add a generated tsvector column for keyword / BM25-style search
            cur.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'document_chunks' AND column_name = 'tsv'
                    ) THEN
                        ALTER TABLE document_chunks
                            ADD COLUMN tsv tsvector
                            GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
                    END IF;
                END $$;
            """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_chunks_tsv
                ON document_chunks USING gin (tsv);
            """)

    def add_documents(
        self,
        ids: List[str],
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
    ) -> None:
        """Insert document chunks with embeddings into PostgreSQL."""
        if not texts:
            return

        # Build rows: (id, document_id, chunk_index, content, source, embedding)
        rows = []
        for chunk_id, text, embedding, meta in zip(ids, texts, embeddings, metadatas):
            rows.append((
                chunk_id,
                meta.get("document_id", ""),
                meta.get("chunk_index", 0),
                text,
                meta.get("source", "unknown"),
                embedding,
            ))

        template = "(%s, %s, %s, %s, %s, %s::vector)" if self.has_pgvector else "(%s, %s, %s, %s, %s, %s)"
        with self.conn.cursor() as cur:
            execute_values(
                cur,
                f"""
                INSERT INTO document_chunks (id, document_id, chunk_index, content, source, embedding)
                VALUES %s
                ON CONFLICT (id) DO NOTHING
                """,
                rows,
                template=template,
            )

    def query(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        source_filter: Optional[str] = None,
        document_id_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve top-k chunks using cosine similarity.
        Uses pgvector HNSW index if available, or native cosine distance calculation.
        """
        conditions: List[str] = []
        if source_filter:
            conditions.append("source = %s")
        if document_id_filter:
            conditions.append("document_id = %s")

        where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        if self.has_pgvector:
            sql = f"""
                SELECT
                    id,
                    document_id,
                    chunk_index,
                    content,
                    source,
                    (embedding <=> %s::vector) AS distance
                FROM document_chunks
                {where_clause}
                ORDER BY distance ASC
                LIMIT %s
            """
            query_params: List[Any] = [query_embedding]
            if source_filter:
                query_params.append(source_filter)
            if document_id_filter:
                query_params.append(document_id_filter)
            query_params.append(top_k)

            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, query_params)
                rows = cur.fetchall()

            return [
                {
                    "content": row["content"],
                    "metadata": {
                        "document_id": row["document_id"],
                        "chunk_index": row["chunk_index"],
                        "source": row["source"],
                    },
                    "distance": float(row["distance"]),
                }
                for row in rows
            ]
        else:
            # Fallback when pgvector extension is not installed
            sql = f"""
                SELECT
                    id,
                    document_id,
                    chunk_index,
                    content,
                    source,
                    embedding
                FROM document_chunks
                {where_clause}
            """
            filter_params: List[Any] = []
            if source_filter:
                filter_params.append(source_filter)
            if document_id_filter:
                filter_params.append(document_id_filter)

            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, filter_params)
                rows = cur.fetchall()

            if not rows:
                return []

            import numpy as np

            q = np.array(query_embedding, dtype=np.float32)
            q_norm = np.linalg.norm(q)
            scored = []
            for row in rows:
                emb = np.array(row["embedding"], dtype=np.float32)
                e_norm = np.linalg.norm(emb)
                sim = float(np.dot(q, emb) / (q_norm * e_norm + 1e-9))
                dist = 1.0 - sim
                scored.append((dist, row))

            scored.sort(key=lambda item: item[0])
            top_matches = scored[:top_k]

            return [
                {
                    "content": row["content"],
                    "metadata": {
                        "document_id": row["document_id"],
                        "chunk_index": row["chunk_index"],
                        "source": row["source"],
                    },
                    "distance": float(dist),
                }
                for dist, row in top_matches
            ]

    # ── Keyword / Full-Text Search ─────────────────────────────────────────

    def keyword_search(
        self,
        query_text: str,
        top_k: int = 5,
        source_filter: Optional[str] = None,
        document_id_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Full-text search using PostgreSQL tsvector + ts_rank.

        Complements vector cosine search by catching exact keyword/number matches
        that embedding models often miss.
        """
        conditions: List[str] = ["tsv @@ websearch_to_tsquery('english', %s)"]
        params: List[Any] = [query_text]

        if source_filter:
            conditions.append("source = %s")
            params.append(source_filter)
        if document_id_filter:
            conditions.append("document_id = %s")
            params.append(document_id_filter)

        where_clause = "WHERE " + " AND ".join(conditions)
        params.append(top_k)

        sql = f"""
            SELECT
                id,
                document_id,
                chunk_index,
                content,
                source,
                ts_rank(tsv, websearch_to_tsquery('english', %s)) AS rank
            FROM document_chunks
            {where_clause}
            ORDER BY rank DESC
            LIMIT %s
        """

        # params order: rank query_text, WHERE query_text, [filters...], limit
        rank_params: List[Any] = [query_text] + params

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, rank_params)
            rows = cur.fetchall()

        return [
            {
                "content": row["content"],
                "metadata": {
                    "document_id": row["document_id"],
                    "chunk_index": row["chunk_index"],
                    "source": row["source"],
                },
                "distance": 1.0 - min(float(row["rank"]), 1.0),  # convert rank→distance
            }
            for row in rows
        ]

    def get_neighbor_chunks(
        self,
        document_id: str,
        chunk_indices: List[int],
        window: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        Fetch neighboring chunks (chunk_index ± window) for context expansion.
        Returns chunks not already in the provided chunk_indices.
        """
        if not chunk_indices:
            return []

        # Build set of all indices we want (original ± window)
        target_indices: set[int] = set()
        for idx in chunk_indices:
            for offset in range(-window, window + 1):
                if idx + offset >= 0:
                    target_indices.add(idx + offset)

        # Remove indices we already have
        new_indices = target_indices - set(chunk_indices)
        if not new_indices:
            return []

        placeholders = ",".join(["%s"] * len(new_indices))
        sql = f"""
            SELECT id, document_id, chunk_index, content, source
            FROM document_chunks
            WHERE document_id = %s AND chunk_index IN ({placeholders})
            ORDER BY chunk_index ASC
        """
        params: List[Any] = [document_id] + sorted(new_indices)

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()

        return [
            {
                "content": row["content"],
                "metadata": {
                    "document_id": row["document_id"],
                    "chunk_index": row["chunk_index"],
                    "source": row["source"],
                },
                "distance": 0.99,  # neighbor, not directly retrieved
            }
            for row in rows
        ]

    def close(self) -> None:
        """Close the database connection."""
        if self.conn and not self.conn.closed:
            self.conn.close()
