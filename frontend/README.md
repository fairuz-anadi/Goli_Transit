# GoliTransit — public site

The traveller-facing website. This is a standalone React SPA: it holds no routing
logic of its own and talks to the GoliTransit backend purely over HTTP, so the
two run as separate services on separate ports.

## Running it

From the **project root** (not this folder):

```bash
# terminal 1 - the backend service (API + Control Room)
php artisan serve

# terminal 2 - this site
npm run dev
```

| Service | URL | What it serves |
| --- | --- | --- |
| Public site | http://localhost:5173 | Everything a traveller sees |
| Backend | http://127.0.0.1:8000 | JSON API + Control Room and operator consoles |

The site needs the backend running; if it isn't, every page shows a "Can't reach
the routing service" panel naming the API base URL rather than failing silently.

## Pointing at a different backend

The API base URL comes from `VITE_API_BASE_URL` and defaults to
`http://127.0.0.1:8000`. Copy `.env.example` to `.env` in this folder to change
it:

```env
VITE_API_BASE_URL=https://your-backend.example.com
```

It is read at build time, so rebuild after changing it.

## Pages

| Route | Page |
| --- | --- |
| `/` | Home — hero, live map, popular trips |
| `/plan` | Plan a trip — the planner, map, insights, step-by-step directions |
| `/nearby` | Nearby — closest stops to your live location |
| `/trips` | Recent trips — saved in your browser, never sent anywhere |
| `/coverage` | Coverage — every stop on the network, searchable |
| `/how-it-works` | How the routing model works, in plain language |
| `/faq` | Frequently asked questions |
| `/about` | About the project |

`/plan` accepts `?from=<node_id>&to=<node_id>`, so trip links are shareable.

## Layout

```text
frontend/
  index.html
  vite.config.js        # port 5173, path aliases
  tailwind.config.js
  src/
    App.jsx             # routes
    api/client.js       # fetch wrapper around the backend
    components/         # layout, page header, backend-down notice
    hooks/useGraph.js   # loads the network graph
    lib/recentTrips.js  # localStorage trip history
    pages/
    styles/app.css
```

## Shared code

The map canvas, planner form, journey steps and route insights are shared with
the backend's Control Room and live in `resources/js`. Two aliases reach them:

- `@` / `@shared` → `../resources/js`
- `@app` → `./src`

`@` has to mean `resources/js` because the shared components import each other
that way, matching the Laravel app's `jsconfig.json`. Use `@app` for this site's
own modules.

## Building

```bash
npm run build:site
```

Outputs a static bundle to `frontend/dist/`, deployable to any static host. It is
independent of the backend's `npm run build`, which compiles the Control Room's
assets into `public/build`.
