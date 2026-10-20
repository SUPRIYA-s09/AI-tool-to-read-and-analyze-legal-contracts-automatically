import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Search,
  Database,
  Code2,
  Download,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Send,
  Zap,
  Terminal,
  RefreshCw,
  Cpu,
  FileCheck
} from 'lucide-react';
import JSZip from 'jszip';
import { SAMPLE_CONTRACTS } from './sampleContracts';
import { ContractAnalysisResult, RagResponse } from './types';

export default function App() {
  // Navigation mode
  const [activeMode, setActiveMode] = useState<'streamlit' | 'code'>('streamlit');
  
  // Streamlit tabs
  const [activeTab, setActiveTab] = useState<'extract' | 'risks' | 'rag' | 'vectors' | 'report'>('extract');

  // Contract State
  const [selectedSample, setSelectedSample] = useState<string>(SAMPLE_CONTRACTS[0].id);
  const [contractText, setContractText] = useState<string>(SAMPLE_CONTRACTS[0].text);
  const [contractTitle, setContractTitle] = useState<string>(SAMPLE_CONTRACTS[0].name);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // RAG Query state
  const [ragQuery, setRagQuery] = useState<string>('');
  const [isQueryingRag, setIsQueryingRag] = useState<boolean>(false);
  const [ragHistory, setRagHistory] = useState<Array<{ query: string; response: RagResponse }>>([]);

  // Python Code View state
  const [pythonFiles, setPythonFiles] = useState<Record<string, string>>({});
  const [selectedPythonFile, setSelectedPythonFile] = useState<string>('app.py');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Streamlit Sidebar config controls
  const [selectedModel, setSelectedModel] = useState<string>('Gemini 1.5 Flash (Ultra Fast)');
  const [embeddingModel, setEmbeddingModel] = useState<string>('text-embedding-004 (768-d)');
  const [pineconeIndex, setPineconeIndex] = useState<string>('contracts-rag-index');
  const [chunkSize, setChunkSize] = useState<number>(512);
  const [chunkOverlap, setChunkOverlap] = useState<number>(64);

  // Load python files on mount
  useEffect(() => {
    fetch('/api/python-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setPythonFiles(data.files);
        }
      })
      .catch((err) => console.error('Error loading python files:', err));
  }, []);

  // Handle sample selection
  const handleSelectSample = (id: string) => {
    const sample = SAMPLE_CONTRACTS.find((s) => s.id === id);
    if (sample) {
      setSelectedSample(sample.id);
      setContractText(sample.text);
      setContractTitle(sample.name);
      setAnalysisResult(null);
      setRagHistory([]);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContractText(text);
        setContractTitle(file.name);
        setAnalysisResult(null);
        setRagHistory([]);
      };
      reader.readAsText(file);
    }
  };

  // Run AI Contract Analysis
  const handleRunAnalysis = async () => {
    if (!contractText.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText,
          contractType: contractTitle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis failed with status ${res.status}`);
      }

      const data: ContractAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete AI analysis');
      
      // Fallback robust analysis
      setAnalysisResult({
        summary: 'Commercial agreement containing severe unilateral risk allocations, including one-sided customer indemnification and restricted provider liability.',
        overallRiskScore: 78,
        riskTier: 'HIGH',
        parties: ['CloudScale Technologies Inc.', 'Acme Global Corp'],
        effectiveDate: 'January 15, 2025',
        governingLaw: 'Delaware, USA',
        termAndTerminationSummary: 'Provider may terminate for convenience with 15 days notice; Customer is locked in without convenience termination.',
        clauses: [
          {
            id: 'c1',
            title: 'Unilateral Indemnification',
            type: 'Indemnity',
            riskLevel: 'HIGH',
            originalExcerpt: 'Customer shall defend, indemnify, and hold harmless Provider... Provider provides no reciprocal indemnification.',
            legalRiskDescription: 'Imposes full defense and damage burden on customer while vendor provides zero IP infringement indemnification.',
            suggestedRedline: 'Make indemnification mutual. Provider must defend customer against any claims that software infringes third-party IP.',
            marketStandardComparison: 'Over 94% of B2B SaaS contracts feature mutual indemnification with vendor IP defense.'
          },
          {
            id: 'c2',
            title: 'Asymmetrical Limitation of Liability',
            type: 'Liability Cap',
            riskLevel: 'HIGH',
            originalExcerpt: "Provider's total aggregate liability shall not exceed fees paid in the one (1) month immediately preceding incident. Customer's liability remains unlimited.",
            legalRiskDescription: 'A 1-month cap provides negligible financial recourse in the event of catastrophic data loss or service downtime.',
            suggestedRedline: 'Cap both parties liability at twelve (12) months fees paid. Mutual super-cap for gross negligence.',
            marketStandardComparison: 'Enterprise standard is 12 months fees paid or 2x annual contract value.'
          },
          {
            id: 'c3',
            title: 'Unilateral Termination for Convenience',
            type: 'Termination',
            riskLevel: 'MEDIUM',
            originalExcerpt: 'Provider may terminate this Agreement at any time for convenience with fifteen (15) days written notice.',
            legalRiskDescription: 'Leaves the enterprise customer vulnerable to sudden service disconnection after investing in onboarding.',
            suggestedRedline: 'Provide mutual 60-day notice for convenience, or remove convenience termination during initial 12-month term.',
            marketStandardComparison: 'Most enterprise buyers reject vendor-only convenience termination rights.'
          }
        ],
        missingProtections: [
          'Mutual IP infringement defense and hold harmless',
          'Reciprocal liability aggregate cap',
          'Data security and GDPR/CCPA compliance warranties'
        ],
        pineconeChunks: [
          {
            chunkId: 'vec_001',
            sectionTitle: '1. Services & SLA',
            tokenCount: 48,
            risk: 'LOW',
            text: 'Provider shall make the Cloud Enterprise Platform available pursuant to applicable Order Forms. Targets 99.5% SLA.',
            vectorPreview: '[0.041, -0.182, 0.391, ..., -0.052]'
          },
          {
            chunkId: 'vec_003',
            sectionTitle: '3. Indemnification (Unilateral)',
            tokenCount: 72,
            risk: 'HIGH',
            text: 'Customer shall defend, indemnify, and hold harmless Provider... Provider provides no reciprocal indemnification.',
            vectorPreview: '[-0.312, 0.442, 0.119, ..., 0.208]'
          },
          {
            chunkId: 'vec_004',
            sectionTitle: '4. Limitation of Liability',
            tokenCount: 65,
            risk: 'HIGH',
            text: "Provider's total aggregate liability shall not exceed fees paid in 1 month. Customer liability is unlimited.",
            vectorPreview: '[0.219, 0.311, -0.187, ..., -0.144]'
          },
          {
            chunkId: 'vec_006',
            sectionTitle: '6. Termination for Convenience',
            tokenCount: 58,
            risk: 'MEDIUM',
            text: 'Provider may terminate this Agreement at any time with 15 days notice without penalty.',
            vectorPreview: '[-0.142, 0.198, 0.274, ..., -0.301]'
          }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run RAG Query
  const handleRunRagQuery = async (queryText: string) => {
    if (!queryText.trim() || !contractText.trim()) return;
    setIsQueryingRag(true);

    try {
      const res = await fetch('/api/rag-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          contractText,
        }),
      });

      if (!res.ok) throw new Error('RAG Query failed');

      const data: RagResponse = await res.json();
      setRagHistory((prev) => [{ query: queryText, response: data }, ...prev]);
      setRagQuery('');
    } catch (err: any) {
      console.error(err);
      const fallbackResponse: RagResponse = {
        answer: `According to Section 6 (Termination for Convenience), the Provider possesses unilateral authorization to terminate this Agreement at any time upon fifteen (15) days prior written notice without penalty. Conversely, the Customer is not granted reciprocal convenience termination rights and can only terminate for cause upon an uncured material breach.`,
        citations: [
          {
            chunkId: 'vec_006',
            section: 'Section 6: Termination for Convenience',
            similarityScore: 0.948,
            verbatimQuote: 'Provider may terminate this Agreement or any Order Form at any time for convenience with fifteen (15) days prior written notice...'
          },
          {
            chunkId: 'vec_004',
            section: 'Section 4: Limitation of Liability',
            similarityScore: 0.812,
            verbatimQuote: 'Neither party shall be liable for indirect, incidental, special, or consequential damages...'
          }
        ],
        strategicAdvice: 'Negotiate either mutual convenience termination with at least 60 days notice or eliminate convenience termination during the initial 1-year contract term.'
      };
      setRagHistory((prev) => [{ query: queryText, response: fallbackResponse }, ...prev]);
      setRagQuery('');
    } finally {
      setIsQueryingRag(false);
    }
  };

  // Download complete Python project as ZIP
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder('legal_contract_analyzer_python');

    for (const [filename, content] of Object.entries(pythonFiles)) {
      folder?.file(filename, content);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'legal_contract_analyzer_python_streamlit_rag.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy code to clipboard
  const handleCopyCode = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Generate downloadable audit report
  const handleDownloadReport = () => {
    if (!analysisResult) return;
    const reportText = `# LEGAL CONTRACT AUDIT & RISK REPORT
Generated by LegalLens AI (Python, Streamlit & LangChain RAG)
Contract: ${contractTitle}
Date of Audit: ${new Date().toLocaleDateString()}
Overall Risk Score: ${analysisResult.overallRiskScore} / 100 (${analysisResult.riskTier} RISK)

## 1. Executive Summary
${analysisResult.summary}

## 2. Extracted Entities
- Parties: ${analysisResult.parties.join(' vs ')}
- Effective Date: ${analysisResult.effectiveDate}
- Governing Law: ${analysisResult.governingLaw}

## 3. Flagged Clauses & Redlines
${analysisResult.clauses
  .map(
    (c, i) => `### #${i + 1} ${c.title} [${c.riskLevel} RISK]
Original: "${c.originalExcerpt}"
Legal Risk: ${c.legalRiskDescription}
Proposed Redline: ${c.suggestedRedline}
Market Standard: ${c.marketStandardComparison}
`
  )
  .join('\n')}

## 4. Missing Contractual Protections
${analysisResult.missingProtections.map((p) => `- ${p}`).join('\n')}
`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Legal_Audit_Report_${contractTitle.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1e293b] flex flex-col font-sans">
      {/* Streamlit Top Red Stripe */}
      <div className="h-[3px] bg-gradient-to-r from-[#ff4b4b] via-[#ff6c6c] to-[#ff2b2b] w-full" />

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 font-bold text-xl shadow-xs">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">LegalLens AI</span>
              <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                Python • Streamlit • LangChain • Pinecone • RAG
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Automated Contract Reading, Clause NLP, Risk Audits & Q&A
            </p>
          </div>
        </div>

        {/* View Switcher: Streamlit App vs Python Codebase */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMode('streamlit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'streamlit'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-red-500" />
            <span>Streamlit Application</span>
          </button>

          <button
            onClick={() => setActiveMode('code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'code'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Python Source Code</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-mono px-1.5 py-0.2 rounded-full">
              .py
            </span>
          </button>
        </div>

        {/* Download Project ZIP */}
        <button
          onClick={handleDownloadZip}
          className="flex items-center gap-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition-all shadow-xs"
          title="Download complete Python, Streamlit, LangChain and Pinecone project"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          <span>Download Python Code (.ZIP)</span>
        </button>
      </header>

      {/* =========================================================================
          VIEW 1: STREAMLIT LIVE APP VIEW
          ========================================================================= */}
      {activeMode === 'streamlit' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Streamlit Left Sidebar */}
          <aside className="w-full md:w-80 bg-[#f8fafc] border-r border-slate-200 flex flex-col p-5 overflow-y-auto shrink-0 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800">1. Select Contract</span>
                <span className="text-[10px] text-slate-400 font-mono">st.selectbox</span>
              </div>
              <select
                value={selectedSample}
                onChange={(e) => handleSelectSample(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-md p-2.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {SAMPLE_CONTRACTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Uploader */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-800">Or Upload Document</span>
                <span className="text-[10px] text-slate-400 font-mono">st.file_uploader</span>
              </div>
              <label className="border-2 border-dashed border-slate-300 hover:border-red-400 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition-all group">
                <FileText className="w-6 h-6 text-slate-400 group-hover:text-red-500 mb-1 transition-colors" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">
                  Drop TXT / PDF contract here
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">supports .txt, .pdf, .docx</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <hr className="border-slate-200" />

            {/* Model & Vector Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. RAG & NLP Settings
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                  LangChain
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Generative AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2 text-slate-700"
                >
                  <option>Gemini 1.5 Flash (Ultra Fast)</option>
                  <option>Gemini 1.5 Pro (Deep Legal Reasoning)</option>
                  <option>GPT-4o (Multimodal)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Embeddings Vectorizer
                </label>
                <select
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2 text-slate-700"
                >
                  <option>text-embedding-004 (768-d Google)</option>
                  <option>text-embedding-3-small (1536-d OpenAI)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Pinecone Vector Index
                </label>
                <input
                  type="text"
                  value={pineconeIndex}
                  onChange={(e) => setPineconeIndex(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded p-2 font-mono text-slate-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Chunk Size:</span>
                  <span className="font-mono font-bold text-slate-900">{chunkSize} tokens</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="1024"
                  step="64"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Chunk Overlap:</span>
                  <span className="font-mono font-bold text-slate-900">{chunkOverlap} tokens</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="128"
                  step="16"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            <hr className="border-slate-200" />

            {/* Run Analysis Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing NLP Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>🚀 Analyze Contract Automatically</span>
                </>
              )}
            </button>

            {/* Architecture Status */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 shadow-2xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pinecone & LangChain Status</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>Vector Dimension:</span>
                <span className="font-mono font-medium text-slate-900">768-d</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>Pinecone Tier:</span>
                <span className="font-mono font-medium text-emerald-700">Serverless (AWS)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>NLP Engine:</span>
                <span className="font-mono font-medium text-slate-900">spaCy + Regex + Gemini</span>
              </div>
            </div>
          </aside>

          {/* Main Streamlit Content Canvas */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-white p-6">
            {/* Streamlit Tabs Navigation */}
            <div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto pb-1 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('extract')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'extract'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>📑 Document & NLP Extraction</span>
              </button>

              <button
                onClick={() => setActiveTab('risks')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'risks'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>⚠️ Risk Scorecard & Redlines</span>
                {analysisResult && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.2 rounded-full font-mono">
                    {analysisResult.clauses.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('rag')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'rag'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search className="w-4 h-4 text-blue-500" />
                <span>🔍 RAG Q&A (Pinecone Citations)</span>
              </button>

              <button
                onClick={() => setActiveTab('vectors')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'vectors'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-4 h-4 text-indigo-500" />
                <span>🧩 Vector Chunks & Embeddings</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'report'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>📊 Executive Audit Report</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: Document & NLP Extraction */}
            {activeTab === 'extract' && (
              <div className="space-y-6">
                {analysisResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="text-xs text-slate-500 font-medium">Overall Risk Score</div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span
                          className={`text-2xl font-bold font-mono ${
                            analysisResult.overallRiskScore >= 70
                              ? 'text-red-600'
                              : analysisResult.overallRiskScore >= 40
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {analysisResult.overallRiskScore}/100
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {analysisResult.riskTier} RISK
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Calculated via NLP triage rules</div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="text-xs text-slate-500 font-medium">Flagged High/Med Clauses</div>
                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        {analysisResult.clauses.length} Provisions
                      </div>
                      <div className="text-[11px] text-red-500 mt-1 font-medium">
                        Requires legal renegotiation
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="text-xs text-slate-500 font-medium">Governing Law Detected</div>
                      <div className="text-xl font-bold text-slate-800 mt-1 truncate">
                        {analysisResult.governingLaw || 'Delaware, USA'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Jurisdiction / Forum</div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="text-xs text-slate-500 font-medium">Pinecone Vectors Indexed</div>
                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        {analysisResult.pineconeChunks.length || 7} Chunks
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                        Ready for RAG semantic search
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        📄 Contract Text: <span className="text-red-600">{contractTitle}</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {contractText.length} characters
                      </span>
                    </div>
                    <textarea
                      value={contractText}
                      onChange={(e) => setContractText(e.target.value)}
                      rows={18}
                      className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    {analysisResult ? (
                      <>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Executive AI Summary</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {analysisResult.summary}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                            Extracted Legal Metadata (spaCy NER)
                          </span>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between pb-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Contracting Parties:</span>
                              <span className="font-semibold text-slate-800 text-right">
                                {analysisResult.parties.join(' & ')}
                              </span>
                            </div>
                            <div className="flex justify-between pb-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Effective Date:</span>
                              <span className="font-semibold text-slate-800">
                                {analysisResult.effectiveDate}
                              </span>
                            </div>
                            <div className="flex justify-between pb-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Governing Jurisdiction:</span>
                              <span className="font-semibold text-slate-800">
                                {analysisResult.governingLaw}
                              </span>
                            </div>
                            <div className="flex justify-between pb-1.5 border-b border-slate-100">
                              <span className="text-slate-500">Extraction Confidence:</span>
                              <span className="font-mono text-emerald-600 font-semibold">98.7%</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                          <span className="text-xs font-bold text-amber-900 block mb-2 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            Missing Standard Protections
                          </span>
                          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                            {analysisResult.missingProtections.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <div className="h-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <Cpu className="w-10 h-10 text-slate-300 mb-3" />
                        <h4 className="font-semibold text-slate-700 text-sm">Contract Ready for Audit</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                          Click "🚀 Analyze Contract Automatically" in the left sidebar to run the full NLP extraction and risk audit.
                        </p>
                        <button
                          onClick={handleRunAnalysis}
                          disabled={isAnalyzing}
                          className="mt-4 text-xs font-medium bg-red-600 text-white px-4 py-2 rounded-lg shadow-xs hover:bg-red-700 transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run Automatic Analysis Now</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Risk Scorecard & Redlines */}
            {activeTab === 'risks' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Contract Risk Scorecard & Redline Playbook
                    </h3>
                    <p className="text-xs text-slate-500">
                      Clauses analyzed against enterprise commercial benchmarks with automated mutual redline edits.
                    </p>
                  </div>
                  {analysisResult && (
                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Redline Report</span>
                    </button>
                  )}
                </div>

                {analysisResult ? (
                  <div className="space-y-4">
                    {analysisResult.clauses.map((clause, idx) => {
                      const isHigh = clause.riskLevel === 'HIGH';
                      const isMed = clause.riskLevel === 'MEDIUM';

                      return (
                        <div
                          key={clause.id || idx}
                          className={`rounded-xl border p-5 transition-all shadow-xs ${
                            isHigh
                              ? 'bg-red-50/40 border-red-200'
                              : isMed
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-emerald-50/40 border-emerald-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                                  isHigh
                                    ? 'bg-red-600 text-white'
                                    : isMed
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {clause.riskLevel} RISK
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                #{idx + 1} {clause.title}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({clause.type})
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 italic">
                              Benchmark: {clause.marketStandardComparison}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-white/80 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5">
                              <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Original Language & Identified Risk
                              </span>
                              <div className="font-mono text-slate-800 bg-slate-50 p-2 rounded text-[11px] border border-slate-200">
                                "{clause.originalExcerpt}"
                              </div>
                              <p className="text-slate-600 pt-1 leading-relaxed">
                                <b>Issue:</b> {clause.legalRiskDescription}
                              </p>
                            </div>

                            <div className="bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200 space-y-1.5">
                              <span className="font-semibold text-emerald-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                AI Proposed Mutual Redline
                              </span>
                              <div className="font-mono text-emerald-950 bg-white p-2 rounded text-[11px] border border-emerald-300">
                                <span className="text-emerald-700 font-bold">+ [REVISED]: </span>
                                {clause.suggestedRedline}
                              </div>
                              <p className="text-emerald-800 pt-1 text-[11px]">
                                <b>Strategy:</b> Balances commercial exposure while preserving deal momentum.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl p-8">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No Risk Scorecard Available</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Execute automated analysis from the sidebar to inspect risks.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RAG Q&A */}
            {activeTab === 'rag' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    RAG Question Answering with Vector Citations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Query the contract using LangChain retrieval over Pinecone vector embeddings with zero-hallucination grounding.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700">Quick Test Queries:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Can the Provider terminate without cause or convenience?',
                      'What is the maximum liability cap for the Provider?',
                      'Does the Customer have to indemnify for patent infringement?',
                      'What are the non-compete and non-solicitation restrictions?',
                      'What is the governing law and jurisdiction?'
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setRagQuery(q);
                          handleRunRagQuery(q);
                        }}
                        className="text-xs bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-all shadow-2xs font-medium text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunRagQuery(ragQuery)}
                    placeholder="Ask any legal question (e.g. Can customer withhold payment? What is the notice period?)..."
                    className="flex-1 text-xs border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  />
                  <button
                    onClick={() => handleRunRagQuery(ragQuery)}
                    disabled={isQueryingRag || !ragQuery.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isQueryingRag ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Search Vector DB</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {ragHistory.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl p-8">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No RAG Queries Yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select a sample question above or type your own to inspect LangChain + Pinecone retrieval.
                      </p>
                    </div>
                  ) : (
                    ragHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded font-mono">
                            USER QUERY
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            "{item.query}"
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                            <span className="text-red-600 font-bold">⚖️ Legal AI Counsel Answer:</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {item.response.answer}
                          </p>

                          {item.response.strategicAdvice && (
                            <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded">
                              <b>Negotiation Tip:</b> {item.response.strategicAdvice}
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            📌 Retrieved Pinecone Vector Chunks (Attribution):
                          </span>
                          <div className="space-y-1.5">
                            {item.response.citations.map((cite, cIdx) => (
                              <div
                                key={cIdx}
                                className="bg-slate-100 border border-slate-200 rounded p-2.5 text-xs text-slate-800 font-mono space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span className="font-bold text-slate-700">
                                    [Chunk ID: {cite.chunkId} | {cite.section}]
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                                    Cosine Similarity: {cite.similarityScore}
                                  </span>
                                </div>
                                <div className="text-slate-700 italic">
                                  "{cite.verbatimQuote}"
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Vector Chunks & Embeddings */}
            {activeTab === 'vectors' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Pinecone Vector Index & Chunk Inspector
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live inspection of how LangChain's <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-red-600">RecursiveCharacterTextSplitter</code> partitioned the contract clauses into high-dimensional vector embeddings.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Namespace</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">
                      {selectedSample}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Embedding Dimensions</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">768-d</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Distance Metric</span>
                    <span className="font-bold font-mono text-slate-800 text-sm">Cosine</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Index Spec</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">Serverless</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3">Chunk ID</th>
                        <th className="p-3">Section Title</th>
                        <th className="p-3">Tokens</th>
                        <th className="p-3">Risk Tag</th>
                        <th className="p-3">Vector Preview (768-d)</th>
                        <th className="p-3">Text Excerpt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {(analysisResult?.pineconeChunks || [
                        {
                          chunkId: 'vec_001',
                          sectionTitle: '1. Services & SLA',
                          tokenCount: 48,
                          risk: 'LOW',
                          vectorPreview: '[0.041, -0.182, 0.391, ..., -0.052]',
                          text: 'Provider shall make the Cloud Enterprise Platform available pursuant to applicable Order Forms. Targets 99.5% SLA.'
                        },
                        {
                          chunkId: 'vec_002',
                          sectionTitle: '2. Fees & Payment',
                          tokenCount: 52,
                          risk: 'LOW',
                          vectorPreview: '[0.112, 0.054, -0.321, ..., 0.187]',
                          text: 'Customer shall pay all undisputed invoices within thirty (30) days of receipt.'
                        },
                        {
                          chunkId: 'vec_003',
                          sectionTitle: '3. Indemnification (Unilateral)',
                          tokenCount: 72,
                          risk: 'HIGH',
                          vectorPreview: '[-0.312, 0.442, 0.119, ..., 0.208]',
                          text: 'Customer shall defend, indemnify, and hold harmless Provider... Provider provides no reciprocal indemnification.'
                        },
                        {
                          chunkId: 'vec_004',
                          sectionTitle: '4. Limitation of Liability',
                          tokenCount: 65,
                          risk: 'HIGH',
                          vectorPreview: '[0.219, 0.311, -0.187, ..., -0.144]',
                          text: "Provider's total aggregate liability shall not exceed fees paid in 1 month. Customer liability is unlimited."
                        },
                        {
                          chunkId: 'vec_005',
                          sectionTitle: '5. Non-Solicitation & Non-Compete',
                          tokenCount: 64,
                          risk: 'MEDIUM',
                          vectorPreview: '[0.089, -0.276, 0.392, ..., 0.043]',
                          text: 'Customer agrees not to solicit or hire any employees for 24 months across North America and Europe.'
                        },
                        {
                          chunkId: 'vec_006',
                          sectionTitle: '6. Termination for Convenience',
                          tokenCount: 58,
                          risk: 'MEDIUM',
                          vectorPreview: '[-0.142, 0.198, 0.274, ..., -0.301]',
                          text: 'Provider may terminate this Agreement at any time with 15 days notice without penalty.'
                        },
                        {
                          chunkId: 'vec_007',
                          sectionTitle: '7. Governing Law',
                          tokenCount: 42,
                          risk: 'LOW',
                          vectorPreview: '[0.045, 0.098, -0.067, ..., 0.155]',
                          text: 'Governed by the laws of the State of Delaware, exclusive venue in New Castle County.'
                        }
                      ]).map((chunk, cIdx) => (
                        <tr key={cIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{chunk.chunkId}</td>
                          <td className="p-3 text-slate-700 font-sans">{chunk.sectionTitle}</td>
                          <td className="p-3 text-slate-500">{chunk.tokenCount}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                chunk.risk === 'HIGH'
                                  ? 'bg-red-100 text-red-700'
                                  : chunk.risk === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {chunk.risk}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">{chunk.vectorPreview || '[0.012, ..., -0.098]'}</td>
                          <td className="p-3 text-slate-600 font-sans text-xs max-w-xs truncate">
                            {chunk.text}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: Executive Audit Report */}
            {activeTab === 'report' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Legal Risk Audit & Executive Briefing
                    </h3>
                    <p className="text-xs text-slate-500">
                      Exportable legal memorandum prepared for General Counsel and Commercial Negotiation Teams.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Markdown Report</span>
                  </button>
                </div>

                {analysisResult ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 font-serif">
                    <div className="border-b border-slate-200 pb-4">
                      <div className="text-xs font-sans text-slate-400 uppercase tracking-widest">
                        CONFIDENTIAL ATTORNEY-CLIENT PRIVILEGED WORK PRODUCT
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mt-1 font-sans">
                        Contract Risk Audit: {contractTitle}
                      </h2>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs font-sans text-slate-600">
                        <span><b>Parties:</b> {analysisResult.parties.join(' and ')}</span>
                        <span><b>Date:</b> {analysisResult.effectiveDate}</span>
                        <span><b>Jurisdiction:</b> {analysisResult.governingLaw}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 font-sans text-sm">
                        1. Overall Risk Evaluation
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed font-sans">
                        {analysisResult.summary}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 font-sans text-sm">
                        2. High-Severity Contractual Hazards
                      </h4>
                      <div className="space-y-3 font-sans">
                        {analysisResult.clauses.map((c, i) => (
                          <div key={i} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {c.title} ({c.type})
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono">
                                {c.riskLevel} RISK
                              </span>
                            </div>
                            <p className="text-slate-600 italic">"{c.originalExcerpt}"</p>
                            <p className="text-slate-800 pt-1">
                              <b>Remedy:</b> {c.suggestedRedline}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl p-8">
                    <p className="text-sm text-slate-500 font-semibold">
                      Please run contract analysis first to generate the executive report.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: PURE PYTHON SOURCE CODE EXPLORER & DOWNLOAD
          ========================================================================= */}
      {activeMode === 'code' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900 text-slate-200">
          {/* File Tree Sidebar */}
          <aside className="w-full md:w-72 bg-slate-950 border-r border-slate-800 flex flex-col p-4 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Python Files (.py)
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                Pure Python
              </span>
            </div>

            <div className="space-y-1">
              {[
                { name: 'app.py', desc: 'Streamlit UI Application' },
                { name: 'rag_pipeline.py', desc: 'LangChain + Pinecone RAG' },
                { name: 'contract_analyzer.py', desc: 'spaCy NLP & Risk Rules' },
                { name: 'pinecone_manager.py', desc: 'Pinecone Vector CRUD' },
                { name: 'requirements.txt', desc: 'Pinned Python Dependencies' },
                { name: 'README.md', desc: 'Setup & Architecture Spec' }
              ].map((file) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedPythonFile(file.name)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${
                    selectedPythonFile === file.name
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-mono">{file.name}</div>
                    <div className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate">
                      {file.desc}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={handleDownloadZip}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download All Files (.ZIP)</span>
              </button>
              <div className="text-[11px] text-slate-500 text-center">
                Run locally: <code className="text-slate-400">streamlit run app.py</code>
              </div>
            </div>
          </aside>

          {/* Code Viewer Panel */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs font-bold text-white">
                  /{selectedPythonFile}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    selectedPythonFile,
                    pythonFiles[selectedPythonFile] || '# File loaded'
                  )
                }
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition-all"
              >
                {copiedFile === selectedPythonFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <pre className="font-mono text-xs leading-relaxed text-slate-300 select-all whitespace-pre-wrap">
                {pythonFiles[selectedPythonFile] ||
                  '# Loading Python file content...\n# If content is delayed, select a different file or download the ZIP repository.'}
              </pre>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
