
export interface AuditEntry {
  event: string;
  timestamp: string;
  details: string;
}

export interface RedFlag {
  id: string;
  issue: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  suggestion: {
    whyItMatters: string;
    strategy: string;
    counterOffer: string;
    rephrasedClause: string;
    renegotiationKeywords: string[];
    tacticalTips: string[];
    psychologicalInsight: string;
  };
  originalText: string;
}

export interface ContractAnalysis {
  summary: string;
  signerScore: number;
  redFlags: RedFlag[];
  projectAudit?: any;
  jurisdictionAudit?: any;
  dataShield?: any;
  asymmetricClauses?: any[];
  liabilityModel?: any;
  industryComparison?: any[];
  worstCaseScenario?: string;
  silentOmissions?: string[];
}

export type LLMProvider = 'GEMINI' | 'ANTHROPIC' | 'MISTRAL' | 'DEEPSEEK' | 'OPENAI';

export type LLMModel = 
  | 'gemini-3-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash'
  | 'claude-3-5-sonnet' | 'claude-3-opus'
  | 'mistral-large' | 'pixtral-12b'
  | 'deepseek-v3' | 'deepseek-r1'
  | 'gpt-4o' | 'o1-preview';

export interface UserPreferences {
  strictMode: boolean;
  provider: LLMProvider;
  preferredModel: LLMModel;
  customModelId?: string;
  highQualitySeals: boolean;
  enableSearch: boolean;
  enableMaps: boolean;
  defaultJurisdiction: string;
  voiceSentinelEnabled: boolean;
  externalKeys: Record<LLMProvider, string>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  citations?: string[];
}

export interface ClassificationResult {
  intent: 'REVIEW' | 'CREATE' | 'COMPARE';
  reasoning: string;
}

export interface ContractHistoryItem {
  id: string;
  name: string;
  date: string;
  type: string;
  status: 'Signed' | 'Declined' | 'Draft' | 'Archived';
  summary: string;
  analysis?: ContractAnalysis;
  sealUrl?: string;
  auditTrail: AuditEntry[];
}

export enum AppStep {
  Upload,
  Analyzing,
  Dashboard,
  Creator,
  Signing,
  Verification,
  Finalized,
  Vault,
  Analytics,
  Settings
}

export type VerificationMethod = 'Biometric' | 'Behavioral' | 'Standard';

export interface DocumentRecord {
  docId: string;
  filename: string;
  fileType: string;
  storagePath: string;
  downloadURL: string;
  uploadedAt: string;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  analysisResult: ContractAnalysis | null;
}
