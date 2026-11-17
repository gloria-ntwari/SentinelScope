import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Asset, Finding } from "./types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../data");
const dataFile = path.join(dataDir, "db.json");

const seed = {
  assets: [
    { id: "asset-1", name: "Demo E-commerce Web", host: "192.168.56.10", type: "Web application", environment: "Isolated lab" },
    { id: "asset-2", name: "Demo Linux Server", host: "192.168.56.20", type: "Linux server", environment: "Isolated lab" },
    { id: "asset-3", name: "Demo Database", host: "192.168.56.30", type: "Database", environment: "Isolated lab" }
  ],
  findings: [
    { id: "finding-1", title: "Missing rate limiting on login endpoint", assetId: "asset-1", severity: "Medium", exploitability: "Medium", status: "Open", description: "The lab application does not sufficiently limit repeated login attempts.", recommendation: "Introduce progressive rate limiting, monitoring, and account protection controls.", source: "Manual review", createdAt: new Date().toISOString(), riskScore: 3.5 },
    { id: "finding-2", title: "Outdated service exposed in lab", assetId: "asset-2", severity: "High", exploitability: "Medium", status: "In Progress", description: "A deliberately outdated service is present in the training environment.", recommendation: "Upgrade to a supported version and restrict access with firewall rules.", source: "Nmap import (sample)", createdAt: new Date().toISOString(), riskScore: 5.6 },
    { id: "finding-3", title: "Database backup permissions need review", assetId: "asset-3", severity: "Low", exploitability: "Low", status: "Resolved", description: "Backup access permissions should follow least privilege.", recommendation: "Restrict backup access to the service account and verify file permissions.", source: "Manual review", createdAt: new Date().toISOString(), riskScore: 0.8 }
  ]
};

export type Database = { assets: Asset[]; findings: Finding[] };

export function readDb(): Database {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(seed, null, 2));
  return JSON.parse(fs.readFileSync(dataFile, "utf8")) as Database;
}
export function writeDb(db: Database): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}
