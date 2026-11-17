import type { Exploitability, Severity } from "./types.js";
const severityWeight: Record<Severity, number> = { Critical: 10, High: 8, Medium: 5, Low: 2, Info: 0 };
const exploitMultiplier: Record<Exploitability, number> = { High: 1, Medium: 0.7, Low: 0.4, Unknown: 0.5 };
export function calculateRisk(severity: Severity, exploitability: Exploitability): number {
  return Math.round(severityWeight[severity] * exploitMultiplier[exploitability] * 10) / 10;
}
