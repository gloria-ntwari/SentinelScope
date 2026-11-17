# Project Scope

## Problem
Security assessment evidence is often spread across scanner exports, notes, and spreadsheets. This makes it difficult to prioritize findings, track remediation, and communicate risk.

## Goal
Provide a single dashboard for recording authorized assessment assets, importing scanner evidence, reviewing findings, assigning remediation, and preparing a clear report.

## In scope
- Asset inventory
- Finding lifecycle: open, in progress, resolved
- Severity and exploitability-based risk score
- Nmap XML and Burp CSV evidence import
- Assessment overview and exportable JSON snapshot
- Audit-friendly timestamps

## Out of scope for this MVP
- Live network scanning
- Exploit execution
- Credential attacks
- Persistence, backdoors, or stealth functions
- Public-target discovery

## Ethical and legal controls
- Use only systems you own or have explicit written authorization to assess.
- Keep test targets inside an isolated lab whenever possible.
- Do not import evidence containing secrets or personal data.
- Review scanner output manually; automated tools can produce false positives.

## Success criteria
- A user can create and update an asset.
- A user can create, prioritize, and update a finding.
- Nmap XML and Burp CSV can be imported.
- Dashboard metrics update from stored records.
- Assessment data can be exported as JSON.
