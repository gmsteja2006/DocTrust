# DocTrust — Document Intelligence System

An AI-powered Retrieval-Augmented Generation (RAG) system that lets you upload documents and ask natural-language questions about their content. Combines semantic search, keyword search, and LLM generation to deliver grounded, accurate answers.

## Demo

> 🎥 **Demo video** — A walkthrough of the full upload → query → answer workflow.

https://github.com/gmsteja2006/DocTrust/raw/master/assets/demo.mp4

## Features

- **Document Upload** — PDF, TXT, and DOCX files (up to 10 MB) with drag-and-drop support
- **Hybrid Retrieval** — Vector similarity search (pgvector) + full-text keyword search (PostgreSQL tsvector)
- **Multi-Query Expansion** — LLM generates query variations to improve recall
- **Context-Aware Chunking** — Overlapping sentence-boundary chunks with NLTK tokenization
- **Negation Awareness** — Detects negation patterns and adjusts retrieval and prompting
- **Cross-Document Comparison** — Labels passages by source for multi-document queries
- **Streaming Responses** — Real-time token streaming via Server-Sent Events
- **Markdown Rendering** — Rich formatting with tables, code blocks, and GitHub-flavored markdown

## Tech Stack

### Backend

| Component             | Technology                                               |
| --------------------- | -------------------------------------------------------- |
| Framework             | FastAPI                                                  |
| Vector Database       | PostgreSQL 16 + pgvector (HNSW index, cosine similarity) |
| Full-Text Search      | PostgreSQL tsvector + GIN index                          |
| Embeddings            | sentence-transformers `all-mpnet-base-v2` (768-dim)      |
| PDF Extraction        | pypdf (layout mode)                                      |
| Sentence Tokenization | NLTK Punkt                                               |
| LLM                   | Ollama (100% Offline / Local) OR Groq API (Cloud)        |

### Frontend

| Component    | Technology                  |
| ------------ | --------------------------- |
| UI Framework | React 19 + TypeScript       |
| Build Tool   | Vite                        |
| Styling      | Tailwind CSS                |
| Markdown     | React Markdown + remark-gfm |
| Icons        | Lucide React                |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, lifespan, routers
│   │   ├── routes/
│   │   │   ├── upload.py              # POST /upload, GET /chunks, POST /debug/upload
│   │   │   └── query.py              # POST /query, POST /query/stream
│   │   └── services/
│   │       ├── embeddings.py          # SentenceTransformer wrapper (768-dim)
│   │       ├── retrieval.py           # PostgreSQL + pgvector + full-text search
│   │       └── rag_pipeline.py        # RAG pipeline (chunk → retrieve → generate)
│   ├── tests/
│   │   └── test_pipeline_failures.py  # 59 tests covering edge cases
│   ├── requirements.txt
│   └── docs/
│       └── API.md
│
└── frontend/
    ├── src/
    │   ├── api/client.ts              # Axios HTTP client
    │   ├── components/
    │   │   ├── Chat.tsx               # Conversation interface
    │   │   ├── Sidebar.tsx            # File upload with drag-and-drop
    │   │   ├── MarkdownMessage.tsx    # Styled markdown renderer
    │   │   └── WelcomeContent.tsx     # Onboarding screen
    │   ├── hooks/
    │   │   ├── useChat.ts             # Chat state management
    │   │   └── useUpload.ts           # Upload state management
    │   └── pages/
    │       └── Home.tsx               # Main page layout
    ├── package.json
    └── vite.config.ts
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js / Bun
- PostgreSQL 16 with pgvector extension
- **LLM Option**:
  - **100% Offline & Private (Zero Data Leaves Machine)**: [Ollama](https://ollama.com/) (`ollama run llama3.1:8b`)
  - **Cloud**: Groq API key ([console.groq.com](https://console.groq.com))

### Database Setup

```bash
# Run PostgreSQL with pgvector via Docker
docker run -d \
  --name pgvector \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  pgvector/pgvector:pg16

# Create the database
docker exec -it pgvector psql -U postgres -c "CREATE DATABASE doc_intelligence;"
```

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
.\venv\Scripts\Activate.ps1     # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API runs at **http://localhost:8000** with interactive docs at **http://localhost:8000/docs**.

### Frontend

```bash
cd frontend

# Install dependencies
bun install   # or npm install

# Start dev server
bun run dev   # or npm run dev
```

The frontend runs at **http://localhost:5173**.

## Environment Variables

### Backend

| Variable          | Required | Default                                                          | Description                                            |
| ----------------- | -------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`    | Yes      | `postgresql://postgres:postgres@localhost:5432/doc_intelligence` | PostgreSQL connection string                           |
| `LLM_PROVIDER`    | No       | `groq`                                                           | `ollama` (100% local/offline) or `groq` (cloud)        |
| `OLLAMA_BASE_URL` | No       | `http://localhost:11434`                                         | Local Ollama base URL                                  |
| `OLLAMA_MODEL`    | No       | `llama3.1:8b`                                                    | Local Ollama model (`llama3.1:8b`, `mistral:7b`, etc.) |
| `GROQ_API_KEY`    | If Groq  | —                                                                | Groq API key                                           |
| `GROQ_MODEL`      | No       | `qwen/qwen3.8-27b`                                               | Groq model name                                        |

### Frontend

| Variable       | Default                 | Description          |
| -------------- | ----------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

## API Endpoints

| Method | Endpoint        | Description                         |
| ------ | --------------- | ----------------------------------- |
| `GET`  | `/`             | Health check                        |
| `GET`  | `/health`       | Health status                       |
| `POST` | `/upload`       | Upload a document (PDF/TXT)         |
| `GET`  | `/chunks`       | List stored chunks (debug)          |
| `POST` | `/query`        | Query documents                     |
| `POST` | `/query/stream` | Query with streaming response (SSE) |

See [backend/docs/API.md](backend/docs/API.md) for full API documentation.

## How It Works

### Ingestion Pipeline

1. **Extract** — Text extracted from PDF (layout mode) or plain text
2. **Clean** — Normalize whitespace, remove null bytes, preserve paragraph structure
3. **Chunk** — Split into ~200-word overlapping chunks using NLTK sentence tokenization
4. **Embed** — Generate 768-dimensional vectors via `all-mpnet-base-v2`
5. **Store** — Insert into PostgreSQL with pgvector HNSW index

### Query Pipeline

1. **Multi-Query Generation** — LLM generates 3 query variations to improve recall
2. **Hybrid Retrieval** — Vector similarity search + full-text keyword search
3. **Context Expansion** — Fetch neighboring chunks (±1) for surrounding context
4. **Metadata Filtering** — Optional filtering by source document or document ID
5. **Generation** — Groq Llama 3.1 synthesizes a grounded answer from retrieved passages

## Testing

```bash
cd backend

# Run all tests
python -m pytest tests/ -v --tb=short

# Skip integration tests (no DB required)
python -m pytest tests/ -v --tb=short -m "not integration"
```

The test suite includes 59 tests covering text cleaning, sentence splitting, chunking edge cases, and pipeline failure modes.

## License

This project is for educational and personal use.
