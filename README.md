# TerritoryOps Spain

TerritoryOps Spain is a local-first business control console for real estate locations across Spain — places you own, are negotiating, or are tracking. It starts empty by default, lets you add real assets from coordinates or Google Maps links, and keeps the dataset in your browser unless you export it.

## Problem It Solves

Real estate operations often begin with scattered map links, notes, and spreadsheets. TerritoryOps Spain provides one private local workspace for adding locations, classifying their status, tracking deal details and contacts, viewing them on a map, and exporting records without setting up backend infrastructure.

## Product Behavior

- Starts with zero locations on first load.
- Existing browser localStorage data is restored automatically.
- Legacy statuses from earlier builds are migrated automatically.
- Demo data is optional and must be loaded manually.
- User data is stored only in browser localStorage.
- `Clear all local data` removes the local dataset from the app.
- JSON and CSV export/import are available for portability.

## Local-First Architecture

- Next.js App Router frontend.
- TypeScript `RealEstateLocation` data model.
- Tailwind CSS command-center interface.
- Leaflet map with OpenStreetMap tiles.
- Browser localStorage persistence under `territoryops-spain.locations.v1`.
- Optional Spanish sample data in `data/mockLocations.ts`.
- No backend, Supabase, authentication, AI, Google Maps API, paid APIs, or province GeoJSON.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Leaflet
- Lucide React icons
- Vitest (tests)
- ESLint

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
- Needs attention metric: active records with overdue next action date, missing next action, or negotiating without contact.

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
npm run build
npm run lint
npm test
```

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
- Needs attention metric counts active records with overdue date, missing action, or negotiating without contact.
- JSON export/import works.
- CSV export/import works and includes new columns.
- Old CSV (without new columns) still imports successfully.
- Invalid JSON/CSV import shows a safe error.

## Demo Walkthrough Script

1. Open the dashboard and show that the app starts as a clean personal workspace.
2. Add a first location manually with name, city, province, status, latitude, and longitude.
3. Paste a supported Google Maps URL and use coordinate extraction.
4. Expand Deal details and enter asking price, target price, and probability.
5. Expand Contact/follow-up and enter a contact name and next action date.
6. Load sample demo data to demonstrate a fuller portfolio view.
7. Filter by status and click a province summary row.
8. Open a location drawer from the map or list. Observe deal info and next action sections.
9. Open the data health panel and inspect a drilldown.
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

## Known Limitations And Dependency Notes

- Data is browser-local and not shared across devices.
- Imports replace the dataset instead of merging.
- Duplicate detection is advisory and does not block saving.
- CSV parsing is intentionally lightweight and expects the documented columns.
- Province summaries are table-based; no province GeoJSON or boundary map yet.
- No user accounts, permissions, audit log, or multi-user collaboration.
- `npm audit` reports two moderate findings from Next.js depending on a nested `postcss <8.5.10`. The only suggested automated fix is `npm audit fix --force`, which would downgrade Next to `9.3.3`; that is a breaking change and was intentionally not applied.

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
+-- app/
|   +-- globals.css
|   +-- layout.tsx
|   +-- page.tsx
+-- components/
|   +-- AddLocationForm.tsx
|   +-- LocationDrawer.tsx
|   +-- MapView.tsx
|   +-- MetricsCards.tsx
|   +-- StatusFilter.tsx
|   +-- TopBar.tsx
+-- data/
|   +-- mockLocations.ts
+-- lib/
|   +-- googleMaps.ts
|   +-- locations.ts
|   +-- status.ts
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
```
