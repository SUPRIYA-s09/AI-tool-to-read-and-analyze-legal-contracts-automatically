# LegalLens AI: Automated Legal Contract Analyzer & RAG Assistant

**Production Tech Stack:** `Python 3.10+` • `Streamlit` • `LangChain` • `Pinecone Vector DB` • `Generative AI (Gemini / OpenAI)` • `spaCy NLP`

---

## 🚀 Quickstart (Run Streamlit Locally)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Set in `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="contracts-rag-index"
```

### 3. Launch Streamlit Application
```bash
streamlit run app.py
```
App opens at `http://localhost:8501`.

---

## 🐳 Docker Deployment (Publish anywhere)
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```
Build and run:
```bash
docker build -t legallens-ai .
docker run -p 8501:8501 --env-file .env legallens-ai
```

---

## 🎯 Architecture
1. **Clause-Aware Recursive Character Splitting:** Splits documents along Section and Article boundaries to maintain legal integrity.
2. **Dense Vector Embeddings:** Generated via Google `text-embedding-004` (768-d).
3. **Pinecone Namespaces:** Multi-tenant isolation per contract (`namespace=contract_id`).
4. **LangChain LCEL Pipeline:** Zero-hallucination prompt template with verifiable citations.
5. **Streamlit UI:** Interactive legal workbench with risk scoring and redlines.
