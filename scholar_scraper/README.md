# LARODEC Backend — FastAPI + PostgreSQL + Multi-source Scraper

## Architecture

```
scholar_scraper/
├── api.py                  ← FastAPI server (port 3001)
├── scrape_articles.py      ← Multi-source scraper (DBLP, OpenAlex, Scopus, RG, Scholar)
├── Scholar_scraper.py      ← Google Scholar standalone
├── dblp_scraper.py         ← DBLP standalone
├── scopus_scraper.py       ← Scopus standalone
├── wos_scraper.py          ← OpenAlex/WOS standalone
├── larodec_schema.sql      ← Researcher registry tables
├── larodec_app_schema.sql  ← Portal tables (users, publications, events...)
├── larodec_seed.sql        ← Seed data for researchers
└── requirements.txt
```

## Setup

### 1. PostgreSQL — create database

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
$env:PGPASSWORD = "your_password"
psql -U postgres -c "CREATE DATABASE larodec_db ENCODING 'UTF8';"
psql -U postgres -d larodec_db -f larodec_schema.sql
psql -U postgres -d larodec_db -f larodec_seed.sql
psql -U postgres -d larodec_db -f larodec_app_schema.sql
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DB_PASSWORD at minimum
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the API server

```bash
uvicorn api:app --reload --port 3001
```

The API runs on **http://localhost:3001**

### 5. Start the frontend (separate terminal, from the Larodec folder)

```bash
pnpm dev
```

Frontend runs on **http://localhost:5173** and proxies `/api` → `localhost:3001`

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/register` | Register |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/me` | Update profile |

### Publications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/publications?statut=en_attente` | List |
| POST | `/api/publications` | Create |
| PUT | `/api/publications/{id}/statut` | Validate/reject (admin) |
| DELETE | `/api/publications/{id}` | Delete |

### Scraper
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scraper/search` | Search by author name (DBLP + OpenAlex + Scopus) |
| POST | `/api/scraper/import` | Import selected papers |
| POST | `/api/scraper/auto` | Auto-scrape all researchers (admin) |

### Events, Stats, Audit
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/evenements` | List events |
| POST | `/api/evenements` | Create event |
| PUT | `/api/evenements/{id}/statut` | Validate/reject |
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/audit` | Audit log (admin) |
| GET | `/api/researchers` | All researchers from registry |

---

## Demo accounts

After running `larodec_app_schema.sql`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@larodec.tn` | `admin123` |

Create researcher accounts via the registration form in the frontend.

---

## Scraper sources

| Source | Auth required | Notes |
|--------|--------------|-------|
| DBLP | No | Free API, very reliable |
| OpenAlex/WOS | No | Free API, 100k req/day |
| Scopus | API key | Key in `.env` |
| ResearchGate | No (curl_cffi) | May be blocked |
| Google Scholar | No (scholarly) | Rate limited, use proxy |

---

## Production

Replace SQLite → PostgreSQL is already done. For deployment:

```bash
uvicorn api:app --host 0.0.0.0 --port 3001 --workers 4
```
