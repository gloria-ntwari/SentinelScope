import express from "express";
import cors from "cors";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { parseStringPromise } from "xml2js";
import { readDb, writeDb } from "./store.js";
import { calculateRisk } from "./risk.js";
import type { Asset, Finding, Severity, Exploitability, FindingStatus } from "./types.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const severities: Severity[] = ["Critical", "High", "Medium", "Low", "Info"];
const exploitabilities: Exploitability[] = ["High", "Medium", "Low", "Unknown"];
const statuses: FindingStatus[] = ["Open", "In Progress", "Resolved"];

app.get("/api/health", (_req, res) => res.json({ status: "ok", name: "SentinelScope API" }));
app.get("/api/assets", (_req, res) => res.json(readDb().assets));
app.post("/api/assets", (req, res) => {
  const { name, host, type, environment } = req.body ?? {};
  if (![name, host, type, environment].every((v) => typeof v === "string" && v.trim())) return res.status(400).json({ error: "All asset fields are required." });
  const db = readDb();
  const asset: Asset = { id: randomUUID(), name: name.trim(), host: host.trim(), type: type.trim(), environment: environment.trim() };
  db.assets.push(asset); writeDb(db); res.status(201).json(asset);
});
app.get("/api/findings", (_req, res) => res.json(readDb().findings));
app.post("/api/findings", (req, res) => {
  const b = req.body ?? {};
  if (typeof b.title !== "string" || !b.title.trim() || typeof b.assetId !== "string" || !b.assetId) return res.status(400).json({ error: "Title and asset are required." });
  if (!severities.includes(b.severity) || !exploitabilities.includes(b.exploitability)) return res.status(400).json({ error: "Invalid severity or exploitability." });
  const db = readDb();
  if (!db.assets.some(a => a.id === b.assetId)) return res.status(400).json({ error: "Selected asset does not exist." });
  const finding: Finding = {
    id: randomUUID(), title: b.title.trim(), assetId: b.assetId, severity: b.severity,
    exploitability: b.exploitability, status: "Open", description: String(b.description ?? ""),
    recommendation: String(b.recommendation ?? ""), source: "Manual entry",
    createdAt: new Date().toISOString(), riskScore: calculateRisk(b.severity, b.exploitability)
  };
  db.findings.unshift(finding); writeDb(db); res.status(201).json(finding);
});
app.patch("/api/findings/:id", (req, res) => {
  const db = readDb(); const finding = db.findings.find(f => f.id === req.params.id);
  if (!finding) return res.status(404).json({ error: "Finding not found." });
  const { status } = req.body ?? {};
  if (!statuses.includes(status)) return res.status(400).json({ error: "Invalid status." });
  finding.status = status; writeDb(db); res.json(finding);
});
app.post("/api/import/nmap", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose an Nmap XML file." });
  try {
    const parsed = await parseStringPromise(req.file.buffer.toString("utf8"));
    const hosts = parsed?.nmaprun?.host ?? [];
    const db = readDb(); let imported = 0;
    for (const h of hosts) {
      const address = h.address?.find((a: any) => a.$?.addrtype === "ipv4")?.$?.addr;
      if (!address) continue;
      let asset = db.assets.find(a => a.host === address);
      if (!asset) { asset = { id: randomUUID(), name: `Imported host ${address}`, host: address, type: "Network host", environment: "Imported lab evidence" }; db.assets.push(asset); }
      const ports = h.ports?.[0]?.port ?? [];
      for (const p of ports) {
        if (p.state?.[0]?.$?.state !== "open") continue;
        const port = p.$?.portid; const proto = p.$?.protocol ?? "tcp";
        db.findings.unshift({
          id: randomUUID(), title: `Open ${proto.toUpperCase()} port ${port}`, assetId: asset.id,
          severity: "Info", exploitability: "Unknown", status: "Open",
          description: `Nmap reported port ${port}/${proto} as open on ${address}. This is an observation, not automatically a vulnerability.`,
          recommendation: "Confirm whether the service is required, identify its owner and version, and restrict exposure where appropriate.",
          source: "Nmap XML import", createdAt: new Date().toISOString(), riskScore: 0
        }); imported++;
      }
    }
    writeDb(db); res.json({ imported, hosts: hosts.length, message: "Imported observations. Review them before classifying any as vulnerabilities." });
  } catch { res.status(400).json({ error: "Could not parse this XML. Please provide a valid Nmap XML export." }); }
});
app.post("/api/import/burp", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a Burp CSV file." });
  const csv = req.file.buffer.toString("utf8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return res.status(400).json({ error: "CSV has no data rows." });
  const parse = (line: string) => line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map(v => v.replace(/^,/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
  const headers = parse(lines[0]).map(h => h.trim().toLowerCase());
  const col = (...names: string[]) => headers.findIndex(h => names.includes(h));
  const nameIdx = col("issue name", "name", "issue");
  const hostIdx = col("url", "host", "location");
  const sevIdx = col("severity");
  if (nameIdx < 0) return res.status(400).json({ error: "Could not find an Issue name column in the CSV." });
  const db = readDb(); let imported = 0;
  for (const line of lines.slice(1)) {
    const row = parse(line); const title = row[nameIdx]?.trim(); if (!title) continue;
    const hostValue = hostIdx >= 0 ? row[hostIdx] ?? "Unknown host" : "Unknown host";
    let host = hostValue;
    try { host = new URL(hostValue).host || hostValue; } catch {}
    let asset = db.assets.find(a => a.host === host);
    if (!asset) { asset = { id: randomUUID(), name: `Imported web target ${host}`, host, type: "Web application", environment: "Imported lab evidence" }; db.assets.push(asset); }
    const rawSev = sevIdx >= 0 ? (row[sevIdx] ?? "").toLowerCase() : "";
    const severity: Severity = rawSev.includes("high") ? "High" : rawSev.includes("medium") ? "Medium" : rawSev.includes("low") ? "Low" : "Info";
    const exploitability: Exploitability = "Unknown";
    db.findings.unshift({
      id: randomUUID(), title, assetId: asset.id, severity, exploitability, status: "Open",
      description: "Imported from Burp Suite CSV. Review the original request/response evidence and validate this issue.",
      recommendation: "Validate the finding, determine business impact, and document a remediation and retest plan.",
      source: "Burp Suite CSV import", createdAt: new Date().toISOString(), riskScore: calculateRisk(severity, exploitability)
    }); imported++;
  }
  writeDb(db); res.json({ imported, message: "Burp issues imported for review. Validate each issue before reporting it as confirmed." });
});
app.get("/api/export", (_req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=sentinelscope-assessment.json");
  res.json({ exportedAt: new Date().toISOString(), ...readDb() });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`SentinelScope API running at http://localhost:${port}`));
