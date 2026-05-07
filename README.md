# kcapp-venue-screen

Remote venue display for kcapp matches.

## What It Does

- Connects a screen to a venue ID.
- Listens for remote match start events on `/venue/:venueId`.
- Joins the active leg namespace `/legs/:legId` when a match starts.
- Renders live score updates from `score_update` events.

## Environment

Create `.env` values as needed:

```env
VITE_KCAPP_API_BASE=http://localhost:8001
VITE_KCAPP_SOCKET_URL=http://localhost:8001
VITE_KCAPP_VENUE_LIST_URL=http://localhost:5173/api/venue
VITE_KCAPP_BASIC_AUTH_USERNAME=
VITE_KCAPP_BASIC_AUTH_PASSWORD=
```

- `VITE_KCAPP_API_BASE` is used for REST calls such as venue validation.
- `VITE_KCAPP_SOCKET_URL` is used for Socket.IO namespaces.
- `VITE_KCAPP_VENUE_LIST_URL` is used by Screen Setup to list venues (defaults to `/api/venue`).
- If omitted, both default to `http://<current-host>:8001`.

## Basic Auth

If your API is behind nginx basic auth, set credentials in `.env`:

- `VITE_KCAPP_BASIC_AUTH_USERNAME`
- `VITE_KCAPP_BASIC_AUTH_PASSWORD`

These credentials are sent as `Authorization: Basic ...` for venue list and venue validation requests.

## Run

```bash
npm install
npm run dev
```

On first load, enter Venue ID in setup.

The app stores:

- `kcapp_venue` (selected venue metadata)
- `venue_id`
- `remote-control=true`

These values are used to reconnect automatically after reload.
