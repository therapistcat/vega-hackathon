# Mumbai Smart Civic Backend

## Stack
- FastAPI
- MongoDB Atlas (Motor/PyMongo)
- JWT auth (citizen + authority roles)

## Auth model
- `POST /api/v1/auth/register`
  - Citizen registration only
- `POST /api/v1/auth/register/authority`
  - Authority registration with:
    - `authority_rank`
    - `authority_code` (validated by rank)
- `POST /api/v1/auth/login`
  - Requires `login_as` (`citizen` or `authority`)
  - Authority login also requires `authority_code`
- `GET /api/v1/auth/me`
  - Returns current authenticated user

## Authority ranks
- `inspector` (level 1)
- `ward_officer` (level 2)
- `deputy_commissioner` (level 3)
- `commissioner` (level 4)

Configured via `.env`:
- `AUTHORITY_CODE_INSPECTOR`
- `AUTHORITY_CODE_WARD_OFFICER`
- `AUTHORITY_CODE_DEPUTY_COMMISSIONER`
- `AUTHORITY_CODE_COMMISSIONER`

## Core complaint endpoints
- Citizen:
  - `POST /api/v1/c/complaints`
  - `GET /api/v1/c/complaints/me`
- Authority:
  - `GET /api/v1/a/complaints`
  - `PATCH /api/v1/a/complaints/{complaint_id}/status`
  - `GET /api/v1/a/spatial-analytics`

## Database/indexes
- `users.email` unique index
- `complaints.location` 2dsphere index
- additional time/user indexes for complaint queries

## Seed data
Run:
```bash
python scripts/seed_data.py
```

Seeds:
- 1 authority user (from `SEED_AUTHORITY_*`)
- 1 citizen user (from `SEED_CITIZEN_*`)
- 6 sample complaints

## Run
```bash
pip install -r requirements.txt
python scripts/seed_data.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Frontend integration notes
- Backend includes CORS for:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
- Vite frontend should call `/api/v1` (proxied to backend in `vite.config.js`)
