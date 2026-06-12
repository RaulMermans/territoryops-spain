# TerritoryOps Spain

TerritoryOps Spain is a local-first internal control console for real estate opportunity tracking across Spain.

Built as a lightweight internal operating console for real estate opportunity control — a private operational atlas for owned, negotiating, evaluating, interested, and watchlist locations. Add assets from coordinates or Google Maps links, classify their status, track deal and contact details, and review the portfolio across Map, Table, and Pipeline views.

## Key Views

- **Map** — Spain-centered Leaflet map with status-colored markers.
- **Table** — operational spreadsheet view with sortable columns.
- **Pipeline** — kanban-style board grouped by status.

All three views share the same search, status, and province filters, and switching views never resets your selection.

## Local-First & Private

All data lives in the browser's `localStorage` under `territoryops-spain.locations.v1`. Nothing is sent to a server — there is no backend, database, or authentication. JSON and CSV export/import cover backups and portability. `Clear all local data` resets the workspace.

## Quality

- 64 tests (`npm test`)
- Lint (`npm run lint`)
- Typecheck (`npm run typecheck`)
- Build (`npm run build`)
- GitHub Actions CI runs all of the above on every push and pull request — see [CI](#ci).

## Product Behavior

- Starts with zero locations on first load.
- Existing browser localStorage data is restored automatically.
- Legacy statuses from earlier builds are migrated automatically.
- Demo data is optional and must be loaded manually.
- Selected view (Map/Table/Pipeline) persists across reloads.

## Architecture

- Next.js App Router frontend.
- TypeScript `RealEstateLocation` data model.
- Tailwind CSS command-center interface.
- Leaflet map with OpenStreetMap tiles.
- Optional Spanish sample data in `data/mockLocations.ts`.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Leaflet
- Lucide React icons
- Vitest (tests)
- ESLint

## Views

A view switcher above the main panel lets you change how the filtered location list is displayed. Map, Table, and Pipeline views all share the same search, status filter, province filter, and archived-visibility rules — switching views never resets your selection, filters, or search.

- **Map** (default): Spain-centered Leaflet map with status-colored markers. Works exactly as before.
- **Table**: Operational spreadsheet-style view of every visible location with sortable columns.
- **Pipeline**: Kanban-style board grouped by status, for scanning the deal pipeline at a glance.

### Table View

Columns: Name, City, Province, Status, Priority, Interest, Control type, Next action, Next action date, Estimated value, Asking price, Target price, Contact, Updated date.

- Clicking a row opens the location drawer.
- Empty optional fields show as `—`.
- Overdue `nextActionDate` is marked in red with a warning glyph.
- Negotiating records without a `contactName` show a "No contact" warning.
- High-priority records carry a `HIGH` badge next to the name.
- Click a column header (Status, Priority, Due, Est. value, Updated) to sort; click again to reverse direction.
- A summary bar above the table shows total visible records, needs-attention count, negotiating count, and controlled count.
- An empty state with a hint to adjust filters appears when no records match.

### Pipeline View

Kanban columns: Watchlist, Interested, Evaluating, Negotiating, Controlled, Passed. Archived locations are excluded from the pipeline columns (the existing archived-visibility filter governs whether archived records appear in the underlying filtered list at all).

Each card shows name, city/province, priority, interest level, estimated value, next action, next action date, a contact warning when negotiating without a contact, and an overdue warning when the next action date has passed.

- Clicking a card opens the location drawer.
- Each column header shows a record count; empty columns show a subtle "No records" placeholder.
- A summary bar shows total visible records, active opportunities, negotiating count, controlled count, and needs-attention count.
- Status changes still happen through the existing edit flow in the drawer/form — no drag-and-drop.

## Features

- Spain-centered interactive map with status-colored markers.
- Add, edit, and archive real estate locations.
- Google Maps URL storage and coordinate extraction.
- Manual latitude and longitude entry.
- Search by name, city, province, address, and notes.
- Status filters with archived records hidden from `All statuses`.
- Dedicated province filter from province summaries.
- Detail drawer with asset type, deal info, contact, next action, notes, coordinates, and Google Maps link.
- localStorage persistence after add, edit, archive, import, sample load, or clear.
- JSON import/export.
- CSV import/export with proper escaping for commas, quotes, and newlines.
- Data tools panel for import, export, sample data, and clearing local data.
- Collapsible data health panel with drilldowns for missing Google Maps URL, missing estimated value, missing notes, invalid coordinates, and possible duplicates.
- Duplicate detection by same normalized name/city, same Google Maps URL, or near-identical coordinates.
- Province summaries ranked by active locations and estimated pipeline value.
- Needs-attention drilldown: active records with an overdue next action date, a missing next action, or a negotiating status without a contact name — surfaced as clickable items, not just a count.

## Status Model

Locations use a business-control workflow:

- `watchlist`: Watchlist — passively monitoring
- `interested`: Interested — active interest, no evaluation started
- `evaluating`: Evaluating — active diligence underway
- `negotiating`: Negotiating — deal terms in discussion
- `controlled`: Controlled — owned, leased, or under option
- `passed`: Passed — rejected, outbid, or no longer pursued
- `archived`: Archived — hidden from default view

Archived locations are hidden from `All statuses` but remain filterable through the `Archived` status.

## Needs Attention

A location needs attention when, while not archived, any of the following is true:

- `nextActionDate` is in the past (date-only comparison against today — a date due *today* does **not** count as overdue, and a date due *tomorrow* never counts as overdue).
- `nextAction` is empty.
- `status` is `negotiating` and `contactName` is empty.

The "Needs attention" panel in the sidebar lists the affected records (with the specific reasons) as clickable items that open the drawer directly — it is a drilldown, not a passive count.

## Legacy Status Migration

Imports with statuses from earlier builds are automatically migrated:

| Old status    | New status   |
|---------------|--------------|
| potential     | interested   |
| in_review     | evaluating   |
| owned         | controlled   |
| rejected      | passed       |
| scouted       | interested   |
| contacted     | evaluating   |
| under_review  | evaluating   |
| closed_lost   | passed       |

## Data Model Summary

Each location is a `RealEstateLocation` with:

- Identity and place: `id`, `name`, `address`, `city`, `province`, `autonomousCommunity`, `country`.
- Coordinates and links: `latitude`, `longitude`, `googleMapsUrl`.
- Operations: `status`, `assetType`, `priority`, `source`, `owner`, `notes`.
- Deal fields: `estimatedValue`, `surfaceAreaM2`.
- Business control: `interestLevel`, `controlType`, `askingPrice`, `targetPrice`, `monthlyRent`, `expectedCapex`, `probability`.
- Follow-up: `nextAction`, `nextActionDate`.
- Contact: `contactName`, `contactRole`, `contactPhone`, `contactEmail`, `lastContactedAt`.
- Decision: `decisionReason`.
- Audit: `createdAt`, `updatedAt`.

Required fields in the add/edit form are name, latitude, longitude, city, province, and status. All other fields are optional.

## Add Location Form

The form is split into a quick-capture section and three collapsible sections:

- **Quick capture**: name, Google Maps URL, lat/lng, city, province, status.
- **Deal details**: asset type, priority, interest level, control type, asking price, target price, monthly rent, expected capex, estimated value, m2, probability, address.
- **Contact / follow-up**: contact name, role, phone, email, last contacted, next action, next action date.
- **Notes**: notes, decision reason.

## Import And Export

JSON import accepts either an array of full `RealEstateLocation` records or an object with a `locations` array. Valid imports replace the current local dataset.

### Import Validation Rules

A record is rejected (and the whole import fails) if any of these business-control numbers are invalid:

- `estimatedValue`, `surfaceAreaM2`, `askingPrice`, `targetPrice`, `monthlyRent`, `expectedCapex` must be finite numbers that are **zero or positive** — negative values are rejected.
- `probability` must be a finite number **between 0 and 100 inclusive** — values below 0 or above 100 are rejected.
- Zero is a valid value for all of the above and is preserved (see zero-value display below).

These checks apply identically to JSON and CSV imports.

CSV import/export uses these columns:

```txt
id,name,address,city,province,autonomousCommunity,country,latitude,longitude,googleMapsUrl,
status,assetType,priority,estimatedValue,surfaceAreaM2,source,owner,notes,createdAt,updatedAt,
interestLevel,controlType,askingPrice,targetPrice,monthlyRent,expectedCapex,probability,
nextAction,nextActionDate,contactName,contactRole,contactPhone,contactEmail,lastContactedAt,decisionReason
```

Old CSV exports (without the extended columns) are still accepted — the new optional fields default to `undefined`. Empty optional fields in new exports are stored as `undefined` on import.

## Setup

Requires Node.js `20.9.0` or newer.

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Build, Lint, And Test

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `main` and on every pull request:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

A pull request that fails lint, typecheck, tests, or the build will show a failing check.

## Manual QA Checklist

- First load shows zero locations when localStorage is empty.
- Empty state prompts the user to add the first location.
- Existing localStorage data restores after refresh.
- Legacy statuses (potential, in_review, owned, rejected) migrate correctly on load.
- Load sample demo data works only when clicked.
- Clear all local data returns the app to an empty state.
- Map renders when locations exist.
- Status filters work for all seven statuses.
- Text search combines with status and province filters.
- Province summary appears only when locations exist.
- Province filter can be cleared.
- Clicking a marker, list item, or data health drilldown record opens the drawer.
- Add location works with quick capture (name, city, province, status, coordinates).
- Add location defaults to `interested`.
- Add location can extract coordinates from a supported Google Maps URL.
- Collapsible Deal details, Contact/follow-up, and Notes sections expand and save correctly.
- Negative values for prices, area, capex are rejected by the form.
- Probability outside 0–100 is rejected by the form.
- Edit location updates list, map, metrics, drawer, and localStorage.
- Archive sets status to `archived`.
- Drawer shows deal info (asking/target price, rent, capex, probability) only when populated.
- Drawer shows next action section only when a next action or date is set.
- Drawer shows contact section only when contact info is filled.
- Needs attention drilldown lists active records with an overdue date (date-only — due today is not overdue), missing action, or negotiating without contact, and clicking an item opens the drawer.
- A location with `nextActionDate` set to today is **not** flagged as overdue; yesterday is; tomorrow is not.
- `formatCurrency(0)` and `formatArea(0)` display real zero values, not "Not estimated"/"Not recorded".
- JSON export/import works.
- CSV export/import works and includes new columns.
- Old CSV (without new columns) still imports successfully.
- Invalid JSON/CSV import shows a safe error.
- Imported records with negative `askingPrice`, `monthlyRent`, or other business numbers are rejected.
- Imported records with `probability` below 0 or above 100 are rejected; 0 and 100 are accepted.
- View switcher toggles between Map, Table, and Pipeline without resetting search, filters, or selection.
- Selected view mode persists in localStorage (`territoryops-spain.viewMode.v1`) and is restored after a reload.
- Map View renders and behaves exactly as before.
- Table View: columns render correctly, sorting works on Status/Priority/Due/Est. value/Updated, overdue dates and missing-contact negotiating rows are visually marked, clicking a row opens the drawer.
- Table/Pipeline summary bars show correct visible/attention/negotiating/controlled counts.
- Pipeline View: cards render in the correct status column, excludes archived, shows warnings for overdue and missing contact, clicking a card opens the drawer, empty columns show "No records".
- Empty states: no records at all invites adding the first location; filtered-to-empty suggests clearing filters; empty pipeline columns show a subtle placeholder.

## Demo Walkthrough Script

1. Open the dashboard and show that the app starts as a clean personal workspace.
2. Add a first location manually with name, city, province, status, latitude, and longitude.
3. Paste a supported Google Maps URL and use coordinate extraction.
4. Expand Deal details and enter asking price, target price, and probability.
5. Expand Contact/follow-up and enter a contact name and next action date.
6. Load sample demo data to demonstrate a fuller portfolio view.
7. Filter by status and click a province summary row.
8. Open a location drawer from the map or list. Observe deal info and next action sections.
8b. Switch between Map, Table, and Pipeline views using the view switcher — note filters and selection persist. Sort the table by status or next action date, and scan the pipeline columns for overdue/contact warnings.
9. Open the data health panel and inspect a drilldown, then click a "Needs attention" item to jump straight to its drawer.
10. Export the dataset as CSV and JSON.
11. Clear all local data to return to the empty personal workspace.

## Screenshots

Screenshot placeholders live in `public/screenshots/`:

```txt
public/screenshots/dashboard.txt
public/screenshots/add-location.txt
public/screenshots/data-health.txt
public/screenshots/province-summary.txt
```

These are text placeholders. Before publishing this repo as a portfolio piece, replace them with real PNG/JPG screenshots of the Map, Table, Pipeline, and drawer views (keep files small, under `public/screenshots/`).

## Public Readiness Checklist

- [x] No secrets or API keys required or committed.
- [x] Sample data (`data/mockLocations.ts`) contains only fictional locations and fake contact details.
- [x] Local-first storage model documented (`territoryops-spain.locations.v1`, `territoryops-spain.viewMode.v1`).
- [x] CI enabled (`.github/workflows/ci.yml`) — lint, typecheck, test, build on push/PR.
- [x] Tests pass (`npm test`).
- [x] Typecheck passes (`npm run typecheck`).
- [x] Lint passes (`npm run lint`).
- [x] Build passes (`npm run build`).
- [x] No backend, database, or authentication claims.
- [x] Known limitations documented below.
- [ ] Screenshot placeholders replaced with real images (see [Screenshots](#screenshots)).

## Portfolio Notes

TerritoryOps Spain is positioned as a private operational atlas for real estate decisions — a focused internal tool rather than a multi-tenant SaaS product. Notable product/design decisions:

- **Local-first first**: localStorage keeps the tool usable with zero setup and zero data-sharing risk; a backend is deliberately postponed until the workflow is proven.
- **Manual status changes**: status moves happen through the edit form, keeping the data model explicit and auditable.
- **No drag-and-drop yet**: the Pipeline board is a read-only view of the same filtered dataset as Map and Table, avoiding state-sync complexity until there's a real need for it.
- **Backend postponed**: Supabase/auth/sync are intentionally out of scope until the local-first workflow earns its keep.

## Known Limitations And Dependency Notes

- Data is browser-local and not shared across devices.
- Imports replace the dataset instead of merging.
- Duplicate detection is advisory and does not block saving.
- CSV parsing is intentionally lightweight and expects the documented columns.
- Province summaries are table-based; no province GeoJSON or boundary map yet.
- No user accounts, permissions, audit log, or multi-user collaboration.
- **No backend yet** — everything runs client-side against localStorage.
- **No Supabase yet** — no remote database or sync layer.
- **No auth yet** — single-user, browser-local workspace.
- **No drag-and-drop yet** — Pipeline columns are read-only views; status changes go through the existing edit flow in the drawer/form.
- `npm audit` reports findings in dev dependencies: a critical advisory in `vitest <3.2.6` (arbitrary file read/execution when the Vitest UI server is running — this project never runs `vitest --ui`, only `vitest run`), plus moderate advisories in `esbuild`/`vite`/`vite-node` (via Vitest) and `postcss <8.5.10` (via Next.js). The only automated fix is `npm audit fix --force`, which would bump Vitest to `4.x` and downgrade Next to `9.3.3`; both are breaking changes and were intentionally not applied. None of these affect the production build, which has no exposed dev/UI server.

## Roadmap

- Replace screenshot placeholders with real portfolio screenshots.
- Merge-mode import with duplicate resolution.
- Data quality drilldown actions such as edit from drilldown.
- Province GeoJSON overlay and province-level map interaction.
- Local undo/history for archive and import.
- Saved views for common operator filters.
- Optional backend persistence only after the local workflow is proven.

## Project Structure

```txt
territoryops-spain/
+-- .github/
|   +-- workflows/
|       +-- ci.yml
+-- app/
|   +-- globals.css
|   +-- layout.tsx
|   +-- page.tsx
+-- components/
|   +-- AddLocationForm.tsx
|   +-- LocationDrawer.tsx
|   +-- LocationPipeline.tsx
|   +-- LocationTable.tsx
|   +-- MapView.tsx
|   +-- MetricsCards.tsx
|   +-- StatusFilter.tsx
|   +-- TopBar.tsx
+-- data/
|   +-- mockLocations.ts
+-- lib/
|   +-- attention.ts
|   +-- googleMaps.ts
|   +-- locations.ts
|   +-- pipeline.ts
|   +-- status.ts
|   +-- table.ts
+-- tests/
|   +-- locations.test.ts
+-- types/
|   +-- location.ts
+-- public/
|   +-- screenshots/
+-- package.json
+-- vitest.config.ts
+-- tsconfig.json
+-- next.config.ts
+-- postcss.config.js
+-- tailwind.config.ts
+-- README.md
+-- SECURITY.md
```
