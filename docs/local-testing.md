# Local Testing With Real Backend and Supabase

This guide is the current source of truth for testing the web app locally with real users, FastAPI, and Supabase.

## What You Need To Provide

Create or update these two local files. Do not commit them.

### Root `.env`

```env
VITE_API_URL=http://127.0.0.1:3001
VITE_AUTH_DISABLED=false
VITE_USE_MOCK_AUTH=false
VITE_SHOW_ADS_FOR_ALL=false
```

Use `127.0.0.1` for `VITE_API_URL` while testing the full stack. It avoids browser and CORS edge cases where `localhost` resolves differently between frontend, backend, and proxy logs.

Optional ad variables can stay empty unless an ad-specific issue is being tested:

```env
VITE_ADSENSE_PUBLISHER_ID=
VITE_ADSENSE_AD_SLOT_RECTANGLE=
VITE_ADSENSE_AD_SLOT_HORIZONTAL=
VITE_ADSENSE_AD_SLOT_VERTICAL=
```

### `backend_python/.env`

```env
DATABASE_URL=postgresql://postgres:<SUPABASE_DB_PASSWORD>@db.<SUPABASE_PROJECT_REF>.supabase.co:5432/postgres
JWT_SECRET=<AT_LEAST_32_RANDOM_CHARACTERS>
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
AUTH_DISABLED=false
BACKEND_PORT=3001
GEMINI_API_KEY=
SPOONACULAR_API_KEY=
```

For image analysis or recipe API testing, fill `GEMINI_API_KEY` and `SPOONACULAR_API_KEY`. For inventory, shopping list, auth, profile, and most app smoke tests they can remain empty.

Generate `JWT_SECRET` locally, for example:

```bash
openssl rand -hex 32
```

Never reuse production secrets for local testing.

## Supabase Requirements

Use a disposable Supabase project or a staging database, not production.

The database must contain the tables expected by `backend_python/app/models.py`:

- `User`
- `RefreshToken`
- `Grocery`
- `SavedRecipe`
- `CookedRecipe`
- `ShoppingList`
- `ShoppingListItem`

The table names are case sensitive. If the schema is missing, apply the existing project schema from the known Smart Pantry database backup or recreate it from `database-dumps/smart_pantry_dbdiagram_20261008_171021.dbml` before testing user flows.

## Start Commands

Install dependencies once:

```bash
npm install
cd backend_python
pip install -r requirements.txt
cd ..
```

Run backend and frontend together:

```bash
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

- Backend `/health` returns `{"status":"ok"}`.
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
