# Local Testing With Real Backend and Supabase

This guide is the current source of truth for testing the web app locally with real users, FastAPI, and Supabase.

## What You Need To Provide

Create or update these two local files. Do not commit them.

If the old Supabase project was deleted, create a fresh disposable/staging Supabase project first and copy its exact `DATABASE_URL` into `backend_python/.env`. The local smoke tests need a live Postgres database with the Smart Pantry schema; the app depends only on the current `DATABASE_URL`, not on the deleted project.

### Root `.env`

```env
VITE_API_URL=http://127.0.0.1:3001
VITE_AUTH_DISABLED=false
VITE_USE_MOCK_AUTH=false
VITE_SHOW_ADS_FOR_ALL=false
VITE_ADSENSE_ENABLED=false
VITE_ADSENSE_CONSENT_GRANTED=false
```

Use `127.0.0.1` for `VITE_API_URL` while testing the full stack. It avoids browser and CORS edge cases where `localhost` resolves differently between frontend, backend, and proxy logs.

Optional ad variables can stay empty unless an ad-specific issue is being tested:

```env
VITE_ADSENSE_PUBLISHER_ID=
VITE_ADSENSE_AD_SLOT_RECTANGLE=
VITE_ADSENSE_AD_SLOT_HORIZONTAL=
VITE_ADSENSE_AD_SLOT_VERTICAL=
```

Keep `VITE_ADSENSE_ENABLED=false` and `VITE_ADSENSE_CONSENT_GRANTED=false` until a certified CMP and consent-mode implementation are tested. `VITE_SHOW_ADS_FOR_ALL=true` may show local placeholders for layout checks, but it must not load external AdSense scripts without both gates enabled.

### `backend_python/.env`

Use the exact Supabase connection string from Project Settings:

```env
DATABASE_URL=postgresql://postgres.<SUPABASE_PROJECT_REF>:<SUPABASE_DB_PASSWORD>@db.<SUPABASE_PROJECT_REF>.supabase.co:5432/postgres
JWT_SECRET=<AT_LEAST_32_RANDOM_CHARACTERS>
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTH_DISABLED=false
BACKEND_PORT=3001
GEMINI_API_KEY=
SPOONACULAR_API_KEY=
```

For image analysis or recipe API testing, fill `GEMINI_API_KEY` and `SPOONACULAR_API_KEY`. For inventory, shopping list, auth, profile, and most app smoke tests they can remain empty.

Replace every placeholder literally. If `DATABASE_URL` still contains `<SUPABASE_PROJECT_REF>`, the backend can start but registration/login will fail when it tries to resolve the database host.

`postgresql://...` and `postgres://...` are both accepted; URL-encode special characters in the password. The direct `db.<project-ref>.supabase.co` form from Supabase is valid here and should not be replaced with a pooler string just because a local DNS check happens to fail.

Generate `JWT_SECRET` locally, for example:

```bash
openssl rand -hex 32
```

Never reuse production secrets for local testing.

## Supabase Requirements

Use a disposable Supabase project or a staging database, not production.

For a new Supabase project:

1. Create the project and save its database password locally.
2. In Supabase, open the database connection settings and copy the connection string exactly as shown.
3. Put that value into `backend_python/.env` as `DATABASE_URL`; URL-encode special characters in the password.
4. Open the SQL editor and run `database-dumps/smart_pantry_schema.sql`.
5. Run `npm run check:local-env` and `npm run check:db-schema`.

The database must contain the tables expected by `backend_python/app/models.py`:

- `User`
- `RefreshToken`
- `Grocery`
- `SavedRecipe`
- `CookedRecipe`
- `ShoppingList`
- `ShoppingListItem`

The table names are case sensitive. If the schema is missing in a disposable/staging Supabase database, apply `database-dumps/smart_pantry_schema.sql`. The older `database-dumps/smart_pantry_dbdiagram_20261008_171021.dbml` is useful for visualization, but the SQL file follows the current FastAPI/SQLModel backend more closely.

## Start Commands

Install dependencies once:

```bash
npm install
cd backend_python
python3 -m pip install -r requirements.txt
cd ..
```

Run backend and frontend together:

```bash
npm run check:local-env
npm run check:db-schema
npm run dev:all
```

Or run them separately:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Open the web app at:

```text
http://localhost:5173
```

Health check:

```text
http://localhost:3001/health
```

Expected response:

```json
{"status":"ok"}
```

Automated API smoke test after `npm run check:local-env`, `npm run check:db-schema`, and `npm run dev:api`:

```bash
npm run smoke:api
```

The smoke test creates two unique temporary users, checks auth, profile, groceries, saved recipes, shopping lists, and user-data isolation, then deletes the records it created. The user accounts remain in the test database so auth/token behavior stays auditable.

If the backend starts but frontend requests fail, open the browser developer tools and verify that requests go to `/api/...` on `localhost:5173` or directly to `http://127.0.0.1:3001`, depending on the code path being tested.

## Test Users

For realistic multi-user testing, register users through the web app so password hashing, JWT issuance, refresh tokens, and user-owned records are tested end to end.

Recommended local test accounts:

```text
sp-test-user-1+local@example.com
sp-test-user-2+local@example.com
```

Use unique strong passwords and store them only locally. Do not commit test passwords, screenshots containing tokens, or Supabase connection strings.

Test both users independently:

1. Register user 1.
2. Add groceries, a shopping list, and at least one saved recipe.
3. Log out.
4. Register user 2.
5. Verify user 2 cannot see user 1 data.
6. Log back into user 1 and verify the original data is still present.

## Smoke Test Checklist

Run this before pushing issue work:

- `npm run check:local-env` passes.
- `npm run check:db-schema` passes.
- Backend `/health` returns `{"status":"ok"}`.
- `npm run smoke:api` passes.
- Frontend loads at `http://localhost:5173`.
- Register works with `VITE_USE_MOCK_AUTH=false`.
- Login returns access and refresh tokens.
- `/app` dashboard loads after login.
- Groceries can be added, edited, and deleted.
- Shopping list items can be added and checked.
- Recipes page loads without crashing when recipe API keys are empty.
- Profile page loads and keeps the authenticated user.
- Logging out removes access to protected routes.
- A second user cannot see the first user's data.

## Known Local Pitfalls

- If login works but app data requests fail, check that `VITE_API_URL` points to `http://127.0.0.1:3001` and Vite proxy logs show `/api` requests.
- If the backend fails at startup, check `DATABASE_URL` and `JWT_SECRET` first.
- If browser requests are blocked by CORS, keep `ENVIRONMENT=development` or include the local frontend origin in `ALLOWED_ORIGINS`.
- If schema errors mention quoted table names, verify the Supabase tables use the exact mixed-case names listed above.
- If `npm run dev:all` starts only the frontend, check that `concurrently` is installed through `npm install` and that Python dependencies were installed in the same Python environment used by your shell.
