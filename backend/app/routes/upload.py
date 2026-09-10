from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from psycopg2.extras import RealDictCursor
from pypdf import PdfReader

from app.services.rag_pipeline import get_rag_pipeline

router = APIRouter(prefix="", tags=["upload"])
SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".text"}


def _extract_text_from_file(file_name: str, file_content: bytes) -> str:
    lower_name = file_name.lower()

    if lower_name.endswith(".pdf"):
        reader = PdfReader(BytesIO(file_content))
        pages: list[str] = []
        for page in reader.pages:
            # Try layout mode first (preserves headings, columns, line breaks)
            text = page.extract_text(extraction_mode="layout") or ""
            if not text.strip():
                text = page.extract_text() or ""
            pages.append(text)
        return "\n\n".join(pages)

    return file_content.decode("utf-8", errors="ignore")


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    if not any(file.filename.lower().endswith(ext) for ext in SUPPORTED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only PDF and text files are supported")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        extracted_text = await run_in_threadpool(_extract_text_from_file, file.filename, file_bytes)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {exc}") from exc

    rag_pipeline = get_rag_pipeline()

    try:
        indexing_result = await run_in_threadpool(
            rag_pipeline.index_document,
            extracted_text,
            file.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to index document") from exc

    return {
        "message": "Document uploaded and indexed successfully",
        "filename": file.filename,
        "document_id": indexing_result["document_id"],
        "chunk_count": indexing_result["chunk_count"],
    }


@router.get("/chunks")
async def list_chunks():
    """Debug endpoint: list all stored chunks with truncated content."""
    rag = get_rag_pipeline()
    with rag.retrieval_service.conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, document_id, chunk_index, source, LEFT(content, 120) AS preview, LENGTH(content) AS content_length FROM document_chunks ORDER BY document_id, chunk_index")
        rows = cur.fetchall()
    return {"total_chunks": len(rows), "chunks": [dict(r) for r in rows]}


@router.get("/documents")
async def list_documents():
    """List distinct indexed documents with chunk count."""
    rag = get_rag_pipeline()
    with rag.retrieval_service.conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                document_id,
                source,
                COUNT(*) as chunk_count
            FROM document_chunks
            GROUP BY document_id, source
            ORDER BY source ASC
        """)
        rows = cur.fetchall()
    return {"documents": [dict(r) for r in rows]}


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its chunks by ID."""
    rag = get_rag_pipeline()
    with rag.retrieval_service.conn.cursor() as cur:
        cur.execute("DELETE FROM document_chunks WHERE document_id = %s;", (document_id,))
    return {"message": f"Document {document_id} deleted successfully"}


@router.delete("/documents")
async def clear_documents():
    """Delete all documents and chunks."""
    rag = get_rag_pipeline()
    with rag.retrieval_service.conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE document_chunks;")
    return {"message": "All documents cleared successfully"}


@router.post("/debug/upload")
async def debug_upload(file: UploadFile = File(...)) -> dict:
    """Debug: show extraction + chunking results WITHOUT storing anything."""
    file_bytes = await file.read()
    extracted_text = await run_in_threadpool(_extract_text_from_file, file.filename or "unknown", file_bytes)

    rag = get_rag_pipeline()
    cleaned = rag.load_and_clean_text(extracted_text)
    chunks = rag.split_text_into_chunks(cleaned)

    return {
        "filename": file.filename,
        "raw_text_length": len(extracted_text),
        "raw_text_word_count": len(extracted_text.split()),
        "raw_text_newline_count": extracted_text.count("\n"),
        "cleaned_text_length": len(cleaned),
        "cleaned_text_preview": cleaned[:500],
        "chunk_count": len(chunks),
        "chunks": [
            {"index": i, "word_count": len(c.split()), "preview": c[:150]}
            for i, c in enumerate(chunks)
        ],
    }
