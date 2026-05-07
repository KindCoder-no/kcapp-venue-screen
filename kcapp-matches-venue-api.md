# Matches and Venue Connection API (REST + Socket.IO)

This document describes how match control, venue connection, and live score updates work in this frontend.

It covers:
- Frontend REST endpoints
- Upstream kcapp-api endpoints used by the frontend
- Socket.IO namespaces and events
- Typical remote-control and scoring flows

## Architecture Overview

There are two API layers:

1. Frontend Express routes in this repo (for browser calls such as `/matches/new`, `/legs/:id/finish`, etc.)
2. Upstream kcapp-api (called from the frontend server and, in some cases, directly from browser code via `KCAPP_API_PATH`)

Real-time updates are done with Socket.IO namespaces:
- `/active`
- `/venue/:venueId`
- `/legs/:legId`

## Configuration

- `KCAPP_API` (server-side): full URL to the kcapp-api, default `http://localhost:8001`
- `KCAPP_API_PATH` (browser-side): host+port path used by browser axios calls, default `:8001`

The browser builds upstream URLs like:
- `${window.location.protocol}//${window.location.hostname}${kcapp.api_path}/...`

## Frontend REST Endpoints (this service)

### Matches

- `POST /matches/new`
  - Creates a new match and sets up `/legs/:current_leg_id` namespace.
  - If a venue is attached, emits:
    - `/venue/:venueId` -> `venue_new_match`
    - `/active` -> `new_match`
  - Request body fields used:
    - `players` (array)
    - `venue` (`-1` means null)
    - `match_type`, `match_mode`, `match_stake`
    - `starting_score`, `outshot_type`, `starting_lives`, `points_to_win`, `max_rounds`
    - `office_id`, `player_handicaps`, `bot_player_config`

- `POST /matches/:id/rematch`
  - Starts rematch for an existing match.
  - Same socket side effects as `POST /matches/new`.

- `PUT /matches/:id/finish`
  - Proxies match score/finish payload to upstream `/match/:id/score`.

- `GET /matches/:id`
  - Redirects to the current leg route `/legs/:current_leg_id`.

### Legs (important for score control)

- `PUT /legs/:id/order`
  - Changes player order.
  - Emits:
    - `/active` -> `order_changed`
    - `/legs/:id` -> `order_changed`

- `PUT /legs/:id/finish`
  - Force-finishes a leg.
  - Emits on `/legs/:id`: `score_update`, `leg_finished`, and sometimes `new_leg`.
  - Emits on `/active`: `leg_finished`.

- `PUT /legs/:id/undo`
  - Undoes leg finish and (re)creates `/legs/:id` namespace.

- `DELETE /legs/:id/cancel`
  - Cancels leg.
  - Emits `/legs/:id` -> `cancelled`.

- `DELETE /legs/:id/visit/:visitid`
  - Deletes a visit directly.

- `POST /legs/:id/result`
  - Modifies an existing visit via upstream `/visit/:visitId/modify`.

### Venue page endpoint

- `GET /venues/:id/spectate`
  - Renders venue spectate page using upstream `/venue/:id/spectate` and current leg data.

## Upstream kcapp-api Endpoints Used for Remote/Controller Flows

These are called from browser components (not proxied through frontend Express routes):

- `GET /venue/:venueId/players`
  - Used by controller to filter/select venue players.

- `GET /venue/:venueId/matches`
  - Used by controller "Continue Match" to fetch active/recent matches for a venue.

- `GET /match/active?since=...`
  - Used when continuing matches without venue filter.

- `PUT /match/:id`
  - Used by "Start Remote" action to assign/update the match venue before remote start signal.

## Socket.IO Namespaces and Events

## `/active` namespace

Purpose: global events (smartcard scanning, demo, global leg/match events).

Client -> server events:
- `smartcard` with payload containing at least `uid` and `venue_id`
- `demo` with venue/context payload

Server -> client events used in app:
- `smartcard`
- `demo`
- `new_match`
- `first_throw`
- `leg_finished`
- `order_changed`
- `warmup_started`
- `reconnect_smartboard`

## `/venue/:venueId` namespace

Purpose: venue-scoped control and forwarding to local controller/remote screens.

Client -> server events:
- `start_remote`

Server -> client events:
- `start_remote`
- `venue_new_match`
- `warmup_started`

Notes:
- Venue namespaces are created at server startup for all venues.
- Global `venue-socket` component listens here and auto-redirects to leg pages when these events arrive.

## `/legs/:legId` namespace

Purpose: live scoring, announcements, spectators, and leg lifecycle.

Client -> server events:
- `join`
- `throw` (JSON string payload)
- `possible_throw`
- `undo_throw`
- `undo_visit`
- `announce`
- `spectator_connected`
- `chat_message`
- `warmup_started`
- `reconnect_smartboard`
- `speak`
- `speak_finish`
- `stream`

Server -> client events:
- `connected`
- `possible_throw`
- `score_update`
- `undo_visit`
- `new_leg`
- `leg_finished`
- `say`
- `say_finish`
- `announce`
- `chat_message`
- `spectator_connected`
- `spectator_disconnected`
- `order_changed`
- `cancelled`
- `error`
- `board2`

## Score Update Contract

When a throw is committed (`throw` event), server writes visit via upstream `/visit`, then emits `score_update`.

Typical `score_update` payload shape:

```json
{
  "leg": { "id": 123, "current_player_id": 45, "visits": [], "is_finished": false },
  "players": [
    { "player_id": 45, "current_score": 341, "is_current_player": false },
    { "player_id": 67, "current_score": 501, "is_current_player": true }
  ],
  "match": { "id": 999, "current_leg_id": 124, "is_finished": false },
  "globalstat": { "fish_n_chips": 1234 },
  "is_undo": false
}
```

`match` may be present on finish flows and omitted on some intermediate updates.

## Throw Payload Contract

Client sends `throw` as a JSON string created from scorecard payload:

```json
{
  "player_id": 45,
  "leg_id": 123,
  "first_dart": { "value": 20, "multiplier": 3 },
  "second_dart": { "value": 19, "multiplier": 3 },
  "third_dart": { "value": 12, "multiplier": 2 }
}
```

Server parses and posts this body to upstream `POST /visit`.

## Possible Throw Payload

Client sends optimistic throw updates before final submit:

```json
{
  "uuid": "client-instance-id",
  "current_player_id": 45,
  "score": 20,
  "multiplier": 3,
  "is_bust": false,
  "is_finished": false,
  "darts_thrown": 1,
  "is_undo": false,
  "origin": "web"
}
```

This is broadcast to other clients as `possible_throw`.

## Remote Control Flow (Tournament Start Remote)

1. User opens Start Remote modal and chooses venue.
2. Browser calls upstream `PUT /match/:id` with match object containing selected venue.
3. Browser emits `start_remote` on `/venue/:venueId`.
4. Devices connected through `venue-socket` receive `start_remote` and redirect to:
   - Controller device: `/legs/:current_leg_id/controller`
   - Non-controller/remote device: `/legs/:current_leg_id`

## New Match Flow (Venue-aware)

1. Browser posts to `POST /matches/new`.
2. Frontend creates legs namespace for current leg.
3. If venue is set, frontend emits:
   - `venue_new_match` on `/venue/:venueId`
   - `new_match` on `/active`
4. Venue subscribers auto-navigate to the new leg page.

## Continue Match Fetching

Controller page fetch strategy:

- If `venueId` is configured: `GET /venue/:venueId/matches` (upstream)
- Otherwise: `GET /match/active?since=200000000` (upstream)

The returned match can be continued by navigating to `/legs/:current_leg_id/controller`.

## Local Storage Flags That Affect Venue Connection

These values gate whether `venue-socket` auto-connects and auto-redirects:

- `controller` (boolean)
- `has_controller` (boolean)
- `remote-control` (boolean)
- `venue_id` (number/string)

If one of the first three flags is true and `venue_id` is set, the app connects to `/venue/:venueId`.

## Minimal Integration Examples

### Connect to venue namespace and listen for remote start

```js
import io from "socket.io-client";

const venueId = 12;
const socket = io(`${window.location.origin}/venue/${venueId}`);

socket.on("start_remote", ({ match }) => {
  location.href = `/legs/${match.current_leg_id}/controller`;
});

socket.on("venue_new_match", ({ leg_id }) => {
  location.href = `/legs/${leg_id}/controller`;
});
```

### Emit score throw to a leg namespace

```js
import io from "socket.io-client";

const legId = 123;
const socket = io(`${window.location.origin}/legs/${legId}`);

socket.emit("throw", JSON.stringify({
  player_id: 45,
  leg_id: 123,
  first_dart: { value: 20, multiplier: 3 },
  second_dart: { value: 19, multiplier: 3 },
  third_dart: { value: 12, multiplier: 2 }
}));

socket.on("score_update", (data) => {
  console.log("Updated leg state", data);
});
```
