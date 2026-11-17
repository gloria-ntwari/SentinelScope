# Test Plan

## Manual acceptance tests

1. Start the API and dashboard using README instructions.
2. Confirm the dashboard displays seeded assets and findings.
3. Create an asset and confirm it appears in the asset list.
4. Create a finding and confirm the dashboard metrics update.
5. Change a finding status to In Progress and then Resolved.
6. Import a small Nmap XML export from an authorized lab host.
7. Import a Burp Suite CSV export from a deliberately vulnerable local test app.
8. Export the assessment JSON and verify it contains assets and findings.

## Security checks to add in the next iteration

- Input validation and file-size limits
- Authentication and role-based access
- Audit logging
- CSRF protections if cookie-based auth is introduced
- Rate limiting
- Secure headers
- Secrets management
- Automated unit and integration tests
