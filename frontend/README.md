# GoliTransit Frontend Hackathon Deck

This folder contains a standalone front-end concept for the hackathon demo.

## What is inside

- `index.html` - the main interface
- `styles.css` - the full visual system and responsive layout
- `app.js` - route planner logic, API calls, and SVG map rendering

## How to use

1. Open `index.html` in a browser, or serve the folder with any static server.
2. Paste your backend URL into `API base URL`.
3. Click `Save`, then use:
   - `Compute route`
   - `Load snapshot`
   - `Trigger anomaly`

## API endpoints used

- `POST /api/route`
- `GET /api/graph/snapshot`
- `POST /api/anomaly`

If the API is unavailable, the page falls back to local mock data so the design
still works during presentation.
