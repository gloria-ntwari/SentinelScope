# SentinelScope — Enterprise Security Assessment Platform

SentinelScope is a portfolio project for documenting and managing **authorized security assessments** in a controlled lab. It brings assets, imported scan evidence, findings, risk scoring, remediation tracking, and reporting into one dashboard.

## Current MVP

- React + TypeScript + Vite dashboard
- Node.js + Express + TypeScript REST API
- Local JSON persistence for a simple first run
- Asset inventory and finding management
- Risk scoring based on severity and exploitability
- Import **Nmap XML** and **Burp Suite CSV** reports as evidence (no live scanning or exploitation)
- Sample lab data so the dashboard is populated on first launch

> Safety boundary: SentinelScope does not scan or exploit networks. Only assess systems you own or have explicit written permission to test. Run your scanners separately in an isolated lab, then import their reports.

## Requirements

- Node.js 20+
- npm 10+

## Run locally

Open two terminals.

### 1. Start the API

```bash
cd server
npm install
npm run dev
```

API: http://localhost:4000  
Health check: http://localhost:4000/api/health

### 2. Start the dashboard

```bash
cd client
npm install
npm run dev
```

Dashboard: http://localhost:5173

## Example lab workflow

1. Review the sample assets and findings.
2. Add an asset representing a machine in your isolated lab.
3. Run Nmap or Burp Suite separately against that authorized lab target.
4. Export the scan output.
5. Import Nmap XML or Burp CSV from the Evidence page.
6. Review generated findings, assign remediation status, and export a JSON assessment snapshot.

## Project structure

```text
sentinelscope/
  client/       React dashboard
  server/       Express API and parsers
  docs/         Scope, architecture, test plan
```

## Current import support

- Nmap XML: imports host addresses and open ports as informational observations.
- Burp CSV: imports issue name, severity, host, and evidence where available.
- Imports are evidence ingestion only. Findings should be manually reviewed before being treated as confirmed vulnerabilities.

## Next milestones

1. Add authentication and role-based access control.
2. Add PostgreSQL persistence and audit logging.
3. Add PDF penetration-testing reports.
4. Add remediation verification and retesting history.
5. Add a lab-only workflow guide and richer evidence attachments.
