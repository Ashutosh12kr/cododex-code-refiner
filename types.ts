
export enum IssueSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum IssueCategory {
  BUG = 'Bug',
  SECURITY = 'Security',
  PERFORMANCE = 'Performance',
  STYLE = 'Style',
  BEST_PRACTICE = 'Best Practice'
}

export interface CodeIssue {
  line: number;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  suggestion: string;
}

export interface ReviewMetrics {
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  overallHealth: number;
}

export interface CodeReviewResult {
  summary: string;
  issues: CodeIssue[];
  metrics: ReviewMetrics;
  optimizedCode: string;
  languageDetected: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  language: string;
  originalCode: string;
  result: CodeReviewResult;
}
