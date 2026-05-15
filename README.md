# Yourban

A full-stack movie catalogue for browsing, filtering, and managing French box-office titles. The app ships with a seeded dataset of **200 films** and provides CRUD operations, analytics on the home page, and a client-side recommendation engine on the movie detail page.

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Frontend features](#frontend-features)
- [Recommendation algorithm](#recommendation-algorithm)
- [Project structure](#project-structure)
- [Areas for improvement](#areas-for-improvement)

---

## Architecture

The repository is split into two packages:

| Package | Path | Role |
|---------|------|------|
| **API** | `api/` | Express REST server. Persists data in a JSON file on disk. |
| **App** | `app/` | React SPA (Create React App). Talks to the API over HTTP with CORS. |

```
┌─────────────────┐     HTTP (fetch)      ┌─────────────────┐
│  React app      │ ────────────────────► │  Express API    │
│  localhost:3000 │                       │  localhost:8080 │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                                   ▼
                                        box-office-200.json
```

There is no database server. All reads and writes go through `api/src/services/db.ts`, which synchronously reads and writes `api/src/services/box-office-200.json`.

---

## Tech stack

**Backend**

- Node.js, Express 5, TypeScript
- `body-parser`, `cookie-parser`, `cors`
- `nodemon` + `ts-node` for development

**Frontend**

- React 19, TypeScript, React Router 7
- Tailwind CSS
- Recharts (genre statistics bar chart)
- react-hot-toast (notifications)

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node)

---

## Getting started

### 1. Install dependencies

From the repository root:

```bash
cd api && npm install
cd ../app && npm install
```

### 2. Configure the frontend and backend

Create or verify `app/.env`:

```env
REACT_APP_API_URL=http://localhost:8080/
```

Create or verify `api/.env`:

```env
PORT=8080
CORS_ORIGIN=http://localhost:3000
```

The trailing slash is optional but must match how paths are concatenated in `app/src/services/api.ts` (e.g. `http://localhost:8080/` + `movies` → `http://localhost:8080/movies`).

### 3. Start the API

```bash
cd api
npm start
```

This runs `nodemon`, which executes `ts-node ./src/index.ts`. The server listens on **port 8080**.

You should see: `Server is running on port 8080`.

### 4. Start the React app

In a second terminal:

```bash
cd app
npm start
```

The app opens at **http://localhost:3000**. CORS is configured to allow only this origin (`api/src/index.ts`).

### 5. Production build (frontend only)

```bash
cd app
npm run build
```

Serve the `app/build` folder with any static host. Point `REACT_APP_API_URL` at your deployed API URL before building.

---

## Environment variables

| Variable | Location | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | `app/.env` | `http://localhost:8080/` | Base URL for all API requests |
| `PORT`| `api/.env` | `8080` | API port
| `CORS_ORIGIN`| `api/.env` | `http://localhost:3000` | App url for cors config


---

## Data model

Each movie is stored with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique identifier (assigned on create) |
| `titre` | `string` | Title (min. 3 characters after trim) |
| `date_sortie` | `string` | Release date (ISO date string, parseable by `Date`) |
| `genre` | `string` | Genre label |
| `recettes_totales` | `number` | Total gross revenue in euros (≥ 0) |
| `nombre_entrees` | `number` | Ticket admissions (non-negative integer) |
| `pays_origine` | `string` | Country of origin |
| `distributeur` | `string` | Distributor |
| `duree_minutes` | `number` | Runtime in minutes (positive integer) |
| `note_presse` | `number` | Press rating (0–10) |

**Example record:**

```json
{
  "id": 1,
  "titre": "The Dark Knight Returns",
  "date_sortie": "2022-01-01",
  "genre": "Thriller",
  "recettes_totales": 33590926,
  "nombre_entrees": 3091121,
  "pays_origine": "Danemark",
  "distributeur": "Netflix Films",
  "duree_minutes": 87,
  "note_presse": 6.2
}
```

---

## API reference

All routes are mounted at the server root (`/`). Responses use a common envelope:

**Success**

```json
{ "ok": true, "data": { ... } }
```

**Success with message** (e.g. update)

```json
{ "ok": true, "data": { ... }, "message": "Movie updated successfully" }
```

**Validation error**

```json
{ "ok": false, "errors": ["Invalid titre: must be a non-empty string.", "..."] }
```

**Other errors**

```json
{ "ok": false, "message": "No movie found" }
```

### Endpoints

#### `GET /movies`

Returns the full catalogue.

| | |
|---|---|
| **Success** | `200` — `{ ok: true, data: Movie[] }` |
| **Empty** | `404` — `{ ok: false, message: "No movies found" }` |
| **Server error** | `500` — `{ ok: false, message: "Internal server error" }` |

---

#### `GET /movie/:id`

Returns a single movie by `id`.

| | |
|---|---|
| **Success** | `200` — `{ ok: true, data: Movie }` |
| **Not found** | `404` — `{ ok: false, message: "No movie found" }` |
| **Server error** | `500` |

`:id` is coerced with `Number(req.params.id)` (non-numeric ids become `NaN` and typically yield 404).

---

#### `POST /movie`

Creates a movie. **All fields are required** in the body.

**Request body** — `Movie` without `id`:

```json
{
  "titre": "Example Film",
  "date_sortie": "2024-06-15",
  "genre": "Drama",
  "recettes_totales": 1000000,
  "nombre_entrees": 50000,
  "pays_origine": "France",
  "distributeur": "Pathé",
  "duree_minutes": 120,
  "note_presse": 7.5
}
```

| | |
|---|---|
| **Success** | `201` — `{ ok: true, data: Movie }` |
| **Validation** | `400` — `{ ok: false, errors: string[] }` |
| **Create failed** | `500` — `{ ok: false, message: "Failed to create new movie" }` |

**Validation rules (POST)** — see [Validation](#validation-rules).

---

#### `PUT /movie/:id`

Partial or full update. Only fields **present in the body** are validated and applied.

| | |
|---|---|
| **Invalid id** | `400` — `{ ok: false, message: "Invalid movie id" }` |
| **Validation** | `400` — `{ ok: false, errors: string[] }` |
| **Empty patch** | `400` — `{ ok: false, message: "No valid fields to update" }` |
| **Not found** | `404` — `{ ok: false, message: "Movie not found" }` |
| **Success** | `200` — `{ ok: true, data: Movie, message: "Movie updated successfully" }` |

String fields (`titre`, `genre`, `pays_origine`, `distributeur`) are trimmed on update when valid.

---

#### `DELETE /movie/:id`

Removes a movie from the JSON store.

| | |
|---|---|
| **Success** | `204` — body may still contain `{ ok: true, message: "Movie deleted successfully" }` (unusual for 204; the client handles both empty and JSON bodies) |
| **Not found** | `404` — `{ ok: false, message: "Movie not found" }` |
| **Server error** | `500` |

---

### Validation rules

Applied in `api/src/controllers/movie.ts`.

| Field | POST (required) | PUT (if provided) |
|-------|-----------------|-------------------|
| `titre` | string, trim length ≥ 3 | same |
| `date_sortie` | string, valid `Date.parse` | same |
| `genre` | string, trim length ≥ 1 | same |
| `recettes_totales` | number, ≥ 0, finite | same |
| `nombre_entrees` | number, ≥ 0, integer | same |
| `pays_origine` | string, trim length ≥ 1 | same |
| `distributeur` | string, trim length ≥ 1 | same |
| `duree_minutes` | number, > 0, integer | same |
| `note_presse` | number, 0–10 inclusive | same |

---

## Frontend features

### Routes (`app/src/App.tsx`)

| Path | Page | Description |
|------|------|-------------|
| `/` | `Home.tsx` | Main catalogue dashboard |
| `/movie/:id` | `Movie.jsx` | Movie detail, edit, delete, recommendations |
| `*` | `NotFound.tsx` | 404 page with link back home |

`Statistics.tsx` exists but is **not wired** to a route.

### Home page (`/`)

- **List all movies** in a sortable table (click a row to open detail).
- **Sort** by release date (`date_sortie`) or gross (`recettes_totales`), toggling ascending/descending.
- **Filter by genre** using chips derived from the catalogue; **Reset** restores the full list.
- **Summary cards**: count of visible titles and combined gross for the filtered set.
- **Bar chart** (Recharts): per-genre film count, total revenue, and average press score.
- **Create movie**: inline form; submits `POST /movie` and refreshes the list on success.
- Toast notifications for API success and failure.

### Movie detail page (`/movie/:id`)

- **View** all fields for one movie.
- **Edit** inline form → `PUT /movie/:id` with full payload built from form values.
- **Delete** with browser confirm → `DELETE /movie/:id`, then redirect to `/`.
- **“You may also like”** — up to 3 similar movies (see [Recommendation algorithm](#recommendation-algorithm)).

### API client (`app/src/services/api.ts`)

Thin `fetch` wrapper with `get`, `post`, `put`, `delete`. Sends JSON, uses `credentials: "include"`, and normalizes delete responses (204 / empty body / JSON).

### Not found

Custom 404 UI for unknown routes.

---

## Recommendation algorithm

Implemented as a service method in **API** in `api/src/services/recommendations.ts`. App gets recommended movies at `movie/:id/recommendations` endpoint with function(`getSimilarMovies`). 

### Goal

Suggest up to **3 movies** similar to the one being viewed, shown under **“You may also like”**.

### Steps

1. **Candidate pool (genre-first)**  
   Start with all movies except the current one that share the **same `genre`**.

2. **Fallback pool**  
   If fewer than 3 candidates remain, expand to **all other movies** (any genre).

3. **Early exit**  
   If the pool is still empty, return `[]`.

4. **Normalize features**  
   For the pool, compute:
   - `maxRecettes` = maximum `recettes_totales` in the pool  
   - `maxRating` = maximum `note_presse` in the pool  

5. **Similarity score** (per candidate)

   For each candidate movie `m`:

   ```
   recettesDiff = |m.recettes_totales - current.recettes_totales| / maxRecettes
   ratingDiff   = |m.note_presse - current.note_presse| / maxRating

   similarity = 1 - (recettesDiff × 0.5 + ratingDiff × 0.5)
   ```

   - Differences are **normalized** to [0, 1] using the pool maximums so revenue and rating contribute on comparable scales.
   - Weights are **50% revenue**, **50% press score**.
   - Higher `similarity` means closer match (score in roughly [0, 1]).

6. **Rank and return**  
   Sort candidates by `similarity` descending, take the top **3**, return those movie objects.

### Design notes

- Genre acts as a **hard preference** when enough titles exist; otherwise the system widens the pool.
- Only **revenue** and **press rating** drive the score; runtime, country, distributor, and release date are ignored.
- The algorithm runs in a `useMemo` whenever `movie` or `allMovies` changes, after loading the full catalogue via `GET /movies`.

### Possible enhancements

- Add genre weight decay instead of a hard cut-off at 3 titles.
- Handle edge case where `maxRecettes` or `maxRating` is 0 (division by zero).
- Include collaborative or content-based features (director, decade, etc.).

---

## Project structure

```
yourban/
├── README.md
├── api/
    ├── .env
│   ├── nodemon.json
│   ├── package.json
│   └── src/
│       ├── index.ts              # Express app entry
│       ├── controllers/
│       │   └── movie.ts          # REST routes + validation
│       └── services/
│           ├── db.ts             # JSON file persistence
│           └── box-office-200.json
└── app/
    ├── .env
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.tsx
        ├── services/
        │   └── api.ts            # HTTP client
        └── pages/
            ├── Home.tsx
            ├── Movie.jsx
            ├── NotFound.tsx
            ├── Statistics.tsx    # stub, not routed
            └── global/
                ├── Header.tsx
                └── Footer.tsx
```

---

## Areas for improvement

### 1. DRY validation (POST vs PUT)

`api/src/controllers/movie.ts` duplicates the same field checks twice: once for **create** (all fields required) and again for **update** (per-field `if (field !== undefined)` blocks). Extracting shared validators would reduce bugs when rules change.

**Possible approach:**

```ts
// api/src/validation/movie.ts
const rules = {
  titre: (v: unknown) => typeof v === "string" && v.trim().length >= 3,
  // ...
};

export function validateMovieBody(
  body: Record<string, unknown>,
  options: { partial: boolean }
): { errors: string[]; data: Partial<MovieInput> }
```

Use `partial: false` for POST and `partial: true` for PUT. Consider a schema library (**Zod**, **Valibot**) shared between API and app for one source of truth.

### 2. Duplicated form / payload logic (frontend)

Create and edit forms in `Home.tsx` and `Movie.jsx` both map string inputs → numeric API fields with nearly identical code. A small helper (`formToMovieInput`) or shared form component would follow DRY.

### 3. ID generation and persistence

New IDs are assigned as `movies.length + 1` in `db.ts`. After deletions, this can **reuse ids** or skip numbers. Prefer `max(id) + 1` or UUIDs.

The JSON file is read/written **synchronously** on every operation — fine for 200 records, but not safe under concurrent requests. A real database or file locking would scale better.


### 4. Security and configuration

- No authentication — acceptable for a demo, required for production.
- No rate limiting or request size limits beyond Express defaults.

### 5. Testing and tooling

- No automated tests (`api` script exits with “no test specified”).
- No root-level script to run API + app together (e.g. `concurrently`).

### 6. Recommendation system

- No tests for similarity edge cases (single movie in pool, identical scores, etc.).

### 7. UX polish

- Loading and error states on detail page could be more consistent (skeletons vs “Loading…”).

---

## License

ISC (see `api/package.json`). Frontend package is private (`app/package.json`).
