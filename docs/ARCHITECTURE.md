# Architecture

```text
React + TypeScript (Vite)
        |
        | HTTP / JSON
        v
Express + TypeScript API
        |
        +-- Asset routes
        +-- Finding routes
        +-- Evidence import routes
        +-- Risk scoring utility
        |
        v
JSON file store (MVP only)
```

## API endpoints

- `GET /api/health`
- `GET /api/assets`
- `POST /api/assets`
- `GET /api/findings`
- `POST /api/findings`
- `PATCH /api/findings/:id`
- `POST /api/import/nmap` (multipart field: `file`)
- `POST /api/import/burp` (multipart field: `file`)
- `GET /api/export`

## Risk score
The MVP calculates a transparent prioritization score:

- Critical = 10, High = 8, Medium = 5, Low = 2, Info = 0
- Exploitability: High = 1.0, Medium = 0.7, Low = 0.4, Unknown = 0.5
- Score = severity weight × exploitability multiplier

This is a triage aid, not a formal CVSS score.
