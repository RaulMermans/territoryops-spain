# Security Policy

TerritoryOps Spain is a local-first, client-side application.

## Data Handling

- No backend, database, or authentication — the app runs entirely in the browser.
- All location data is stored in the browser's `localStorage` under `territoryops-spain.locations.v1`.
- View preferences are stored under `territoryops-spain.viewMode.v1`.
- No data is transmitted to any server. JSON/CSV export and import are manual, user-initiated actions.
- No secrets, API keys, or environment variables are required to run the app.

## Sample Data

The bundled sample dataset (`data/mockLocations.ts`) contains only fictional locations and fictional contact details. Do not import real private business data, contacts, or financial details into a public deployment or demo of this project.

## Reporting Issues

If you find a security issue (for example, an XSS vector in rendered data), please open a GitHub issue describing the problem and steps to reproduce.
