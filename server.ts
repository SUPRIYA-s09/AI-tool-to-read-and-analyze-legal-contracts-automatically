import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to read python project files for code viewer and download
const PYTHON_ROOT_FILES = [
  'app.py',
  'rag_pipeline.py',
  'contract_analyzer.py',
  'pinecone_manager.py',
  'requirements.txt',
  'README.md',
];

app.get('/api/python-files', (_req: Request, res: Response) => {
  try {
    const files: Record<string, string> = {};
    for (const filename of PYTHON_ROOT_FILES) {
      const fullPath = path.resolve(process.cwd(), filename);
      if (fs.existsSync(fullPath)) {
        files[filename] = fs.readFileSync(fullPath, 'utf-8');
      }
    }
    res.json({ files });
  } catch (error) {
    console.error('Error reading python files:', error);
    res.status(500).json({ error: 'Failed to read Python files' });
  }
});

// Analyze Legal Contract using Gemini
app.post('/api/analyze-contract', async (req: Request, res: Response) => {
  try {
    const { contractText, contractType } = req.body;
    if (!contractText || typeof contractText !== 'string') {
      res.status(400).json({ error: 'Contract text is required' });
      return;
    }

    const systemPrompt = `You are a Senior Corporate Legal Counsel and Legal Technology expert specializing in automated contract analysis and risk scoring.
Analyze the following legal contract thoroughly. Extract key metadata, detect crucial clauses, score overall risk from 0 to 100, identify unilateral/imbalanced clauses, and propose fair redline amendments.

Respond in strict JSON with the following structure:
{
  "summary": "2-3 sentence executive summary of the contract and its commercial balance",
  "overallRiskScore": 75, // 0-100 integer
  "riskTier": "HIGH", // HIGH, MEDIUM, LOW
  "parties": ["Party A", "Party B"],
  "effectiveDate": "Extracted date or 'Not specified'",
  "governingLaw": "Jurisdiction or 'Not specified'",
  "termAndTerminationSummary": "Summary of term, renewal, and termination rights",
  "clauses": [
    {
      "id": "clause-1",
      "title": "Clause Title (e.g. Unilateral Indemnification)",
      "type": "Indemnity | Liability Cap | Termination | Non-Compete | IP Ownership | Confidentiality | Payment",
      "riskLevel": "HIGH | MEDIUM | LOW",
      "originalExcerpt": "Verbatim short quote from the text",
      "legalRiskDescription": "Why this clause is unfavorable, asymmetrical, or non-standard",
      "suggestedRedline": "Proposed fair, mutual redline text",
      "marketStandardComparison": "How this compares to standard commercial playbook"
    }
  ],
  "missingProtections": [
    "e.g. Mutual IP indemnification carveout",
    "e.g. Limitation on consequential damages mutual exception"
  ],
  "pineconeChunks": [
    {
      "chunkId": "vec_001",
      "sectionTitle": "Section name",
      "tokenCount": 55,
      "text": "Extracted text segment",
      "risk": "HIGH | MEDIUM | LOW",
      "vectorPreview": "[0.024, -0.194, 0.481, ..., -0.091]"
    }
  ]
}`;

    const prompt = `CONTRACT TYPE HINT: ${contractType || 'Commercial Agreement'}
--- FULL CONTRACT TEXT START ---
${contractText.slice(0, 20000)}
--- FULL CONTRACT TEXT END ---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing contract:', error);
    res.status(500).json({
      error: error.message || 'Contract analysis failed',
      fallback: true,
    });
  }
});

// Interactive RAG Query with Citations
app.post('/api/rag-query', async (req: Request, res: Response) => {
  try {
    const { query, contractText } = req.body;
    if (!query || !contractText) {
      res.status(400).json({ error: 'Query and contractText are required' });
      return;
    }

    const systemPrompt = `You are a Senior Corporate Legal Counsel acting as a RAG (Retrieval-Augmented Generation) engine backed by a Pinecone vector database.
Answer the legal query strictly based on the provided contract context.

RULES:
1. Ground your answer strictly in the text.
2. If the contract does not mention the term or is silent, explicitly state: "The contract is silent on this matter."
3. Highlight risks, notice periods, monetary figures, and party obligations.
4. Provide structured citations citing Section numbers and verbatim text.

Respond in strict JSON:
{
  "answer": "Clear, professional legal answer with precise clause citations",
  "citations": [
    {
      "chunkId": "doc_chunk_06",
      "section": "Section title or clause number",
      "similarityScore": 0.942,
      "verbatimQuote": "Exact short sentence from contract"
    }
  ],
  "strategicAdvice": "1-2 sentences of actionable advice for the negotiating party"
}`;

    const prompt = `LEGAL QUESTION: ${query}

--- CONTRACT CONTEXT ---
${contractText.slice(0, 15000)}
--- END CONTEXT ---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in RAG query:', error);
    res.status(500).json({ error: error.message || 'RAG query failed' });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
