export interface ClauseAnalysis {
  id: string;
  title: string;
  type: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  originalExcerpt: string;
  legalRiskDescription: string;
  suggestedRedline: string;
  marketStandardComparison: string;
}

export interface PineconeChunk {
  chunkId: string;
  sectionTitle: string;
  tokenCount: number;
  text: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  vectorPreview?: string;
  similarityScore?: number;
}

export interface ContractAnalysisResult {
  summary: string;
  overallRiskScore: number;
  riskTier: 'HIGH' | 'MEDIUM' | 'LOW';
  parties: string[];
  effectiveDate: string;
  governingLaw: string;
  termAndTerminationSummary: string;
  clauses: ClauseAnalysis[];
  missingProtections: string[];
  pineconeChunks: PineconeChunk[];
}

export interface RagCitation {
  chunkId: string;
  section: string;
  similarityScore: number;
  verbatimQuote: string;
}

export interface RagResponse {
  answer: string;
  citations: RagCitation[];
  strategicAdvice?: string;
}
