export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";
export type Exploitability = "High" | "Medium" | "Low" | "Unknown";
export type FindingStatus = "Open" | "In Progress" | "Resolved";

export interface Asset {
  id: string; name: string; host: string; type: string; environment: string;
}
export interface Finding {
  id: string; title: string; assetId: string; severity: Severity;
  exploitability: Exploitability; status: FindingStatus; description: string;
  recommendation: string; source: string; createdAt: string; riskScore: number;
}
