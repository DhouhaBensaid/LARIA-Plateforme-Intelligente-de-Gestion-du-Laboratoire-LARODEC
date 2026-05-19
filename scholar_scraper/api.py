# -*- coding: utf-8 -*-
"""
LARODEC FastAPI Backend
Wraps the existing scrapers and exposes a REST API for the frontend.
Run: python -m uvicorn scholar_scraper.api:app --reload --port 3001
"""

import os
import re
import time
import unicodedata
from typing import Optional, List
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
import bcrypt
import jwt
import requests
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.responses import StreamingResponse
import io
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv

# -- Import scrapers ------------------------------------------------------------
from .scrape_articles import (
    scrape_dblp,
    scrape_openalex,
    scrape_scopus,
    deduplicate,
    format_apa,
)

load_dotenv()

# --- Config -------------------------------------------------------------------

JWT_SECRET  = os.getenv("JWT_SECRET", "larodec_dev_secret_2025")
JWT_EXPIRE  = int(os.getenv("JWT_EXPIRE_DAYS", "7"))
SCOPUS_KEY  = os.getenv("SCOPUS_API_KEY", "52b68d84f40379915effbb9e8fa7d0fb")

DB_CONFIG = {
    "host"    : os.getenv("DB_HOST",     "localhost"),
    "database": os.getenv("DB_NAME",     "larodec_db"),
    "user"    : os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", "doudou"),
    "port"    : os.getenv("DB_PORT",     "5432"),
}

app = FastAPI(title="LARODEC API", version="1.0.0")

# Allow all localhost origins for development
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse

class PermissiveCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        origin = request.headers.get("origin", "")
        is_local = bool(re.match(r"http://(localhost|127\.0\.0\.1)(:\d+)?$", origin))

        if request.method == "OPTIONS":
            response = StarletteResponse(status_code=200)
        else:
            response = await call_next(request)

        if is_local or not origin:
            response.headers["Access-Control-Allow-Origin"] = origin or "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
            response.headers["Access-Control-Max-Age"] = "600"
        return response

app.add_middleware(PermissiveCORSMiddleware)

security = HTTPBearer()


# --- DB helpers ---------------------------------------------------------------

def get_conn():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=psycopg2.extras.RealDictCursor)


def query(sql: str, params=(), one=False):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(sql, params)
    result = cur.fetchone() if one else cur.fetchall()
    conn.close()
    return result


def clean_user_data(user: dict) -> dict:
    """Remove sensitive/non-serializable fields from user data"""
    if not user:
        return user
    return {k: v for k, v in user.items() if k not in ("password", "photo")}


def execute(sql: str, params=()):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    conn.close()
    return None


# --- Auth helpers -------------------------------------------------------------

def make_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "id"   : user_id,
        "email": email,
        "role" : role,
        "exp"  : datetime.utcnow() + timedelta(days=JWT_EXPIRE),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    return decode_token(creds.credentials)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    role = user.get("role", "")
    # Allow both "admin" and "admin+chercheur" roles
    if role not in ("admin", "admin+chercheur"):
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user


# --- Pydantic models ----------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    nom: str = ""
    prenom: str = ""
    cin: str = ""
    etablissement: str = ""
    universite: str = ""
    grade: str = ""
    telephone: str = ""
    google_scholar_url: str = ""

class UpdateProfileRequest(BaseModel):
    nom: str = ""
    prenom: str = ""
    cin: str = ""
    etablissement: str = ""
    universite: str = ""
    grade: str = ""
    telephone: str = ""
    google_scholar_url: str = ""
    orcid: Optional[str] = None

class PublicationCreate(BaseModel):
    titre: str
    journal: str = ""
    annee: int = 0
    indexation: str = ""
    auteurs: str = ""
    impact_factor: float = 0
    doi: Optional[str] = None
    abstract: Optional[str] = None

class StatutUpdate(BaseModel):
    statut: str

class EvenementCreate(BaseModel):
    titre: str
    type: str = "Seminaire"
    date: str = ""
    date_debut: str = ""
    date_fin: str = ""
    lieu: str = ""
    description: str = ""
    url_photo: Optional[str] = None

class ScraperSearchRequest(BaseModel):
    authorName: str
    sources: List[str] = ["dblp", "openalex", "scopus"]

class ScraperImportRequest(BaseModel):
    papers: List[dict]
    chercheurId: Optional[int] = None

class UserCreate(BaseModel):
    email: str
    password: str = "changeme123"
    nom: str = ""
    prenom: str = ""
    cin: str = ""
    etablissement: str = ""
    universite: str = ""
    grade: str = ""
    role: str = "chercheur"


# ===============================================================================
# AUTH ROUTES
# ===============================================================================

@app.post("/api/auth/login")
def login(body: LoginRequest):
    row = query("SELECT * FROM larodec_users WHERE email = %s", (body.email,), one=True)
    if not row:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not bcrypt.checkpw(body.password.encode(), row["password"].encode()):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = make_token(row["id"], row["email"], row["role"])
    return {"token": token, "user": clean_user_data(row)}


@app.post("/api/auth/register", status_code=201)
async def register(
    email: str = Form(...),
    password: str = Form(...),
    nom: str = Form(""),
    prenom: str = Form(""),
    cin: str = Form(""),
    etablissement: str = Form(""),
    universite: str = Form(""),
    grade: str = Form(""),
    telephone: str = Form(""),
    google_scholar_url: str = Form(""),
    photo: Optional[UploadFile] = File(None),
):
    existing = query("SELECT id FROM larodec_users WHERE email = %s", (email,), one=True)
    if existing:
        raise HTTPException(status_code=409, detail="Email déjà utilisé")
    
    # Validate photo if provided
    photo_data = None
    photo_filename = None
    if photo:
        if not photo.content_type.startswith("image/png"):
            raise HTTPException(status_code=400, detail="Photo doit être au format PNG")
        photo_bytes = await photo.read()
        if len(photo_bytes) > 5 * 1024 * 1024:  # 5 MB limit
            raise HTTPException(status_code=400, detail="Photo ne doit pas dépasser 5 MB")
        photo_data = photo_bytes
        photo_filename = photo.filename
    
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    # Use query() instead of execute() to get the RETURNING result
    row = query("""
        INSERT INTO larodec_users (email, password, role, nom, prenom, cin, etablissement, universite, grade, telephone, photo, photo_filename, google_scholar_url)
        VALUES (%s, %s, 'chercheur', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
    """, (email, hashed, nom, prenom, cin, etablissement, universite, grade, telephone, photo_data, photo_filename, google_scholar_url), one=True)
    
    if not row:
        raise HTTPException(status_code=500, detail="Erreur lors de la création du compte")
    
    token = make_token(row["id"], row["email"], row["role"])
    return {"token": token, "user": clean_user_data(row)}


@app.put("/api/auth/photo")
async def update_user_photo(
    photo: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Update user's photo"""
    if not photo.content_type.startswith("image/png"):
        raise HTTPException(status_code=400, detail="Photo doit être au format PNG")
    
    photo_bytes = await photo.read()
    if len(photo_bytes) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=400, detail="Photo ne doit pas dépasser 5 MB")
    
    execute(
        "UPDATE larodec_users SET photo = %s, photo_filename = %s WHERE id = %s",
        (photo_bytes, photo.filename, user["id"])
    )
    
    return {"message": "Photo mise à jour avec succès"}


@app.get("/api/auth/photo/{user_id}")
def get_user_photo(user_id: int):
    """Get user's photo as PNG image"""
    try:
        row = query("SELECT photo, photo_filename FROM larodec_users WHERE id = %s", (user_id,), one=True)
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        photo_data = row.get("photo")
        if not photo_data:
            print(f"[get_user_photo] User {user_id}: photo is None or empty")
            raise HTTPException(status_code=404, detail="Photo not found")
        
        print(f"[get_user_photo] User {user_id}: returning {len(photo_data)} bytes")
        return StreamingResponse(io.BytesIO(photo_data), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_user_photo] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me")
def me(user: dict = Depends(get_current_user)):
    row = query("SELECT * FROM larodec_users WHERE id = %s", (user["id"],), one=True)
    if not row:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return clean_user_data(row)


@app.put("/api/auth/me")
def update_me(body: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    execute("""
        UPDATE larodec_users SET nom=%s, prenom=%s, cin=%s, etablissement=%s, universite=%s, grade=%s, telephone=%s, google_scholar_url=%s, orcid=%s
        WHERE id=%s
    """, (body.nom, body.prenom, body.cin, body.etablissement, body.universite, body.grade, body.telephone, body.google_scholar_url, body.orcid, user["id"]))
    row = query("SELECT * FROM larodec_users WHERE id = %s", (user["id"],), one=True)
    return clean_user_data(row)


# ===============================================================================
# USERS ROUTES
# ===============================================================================

@app.get("/api/users")
def get_users(_: dict = Depends(require_admin)):
    return query("SELECT id,email,role,nom,prenom,cin,etablissement,universite,grade,orcid,created_at FROM larodec_users ORDER BY nom")


@app.post("/api/users", status_code=201)
def create_user(body: UserCreate, _: dict = Depends(require_admin)):
    existing = query("SELECT id FROM larodec_users WHERE email=%s", (body.email,), one=True)
    if existing:
        raise HTTPException(status_code=409, detail="Email déjà utilisé")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    row = execute("""
        INSERT INTO larodec_users (email,password,role,nom,prenom,cin,etablissement,universite,grade)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (body.email, hashed, body.role, body.nom, body.prenom, body.cin, body.etablissement, body.universite, body.grade))
    return {"id": row["id"]}


@app.put("/api/users/{user_id}")
def update_user(user_id: int, body: dict, _: dict = Depends(require_admin)):
    execute("UPDATE larodec_users SET nom=%s,prenom=%s,cin=%s,etablissement=%s,universite=%s,grade=%s,role=%s WHERE id=%s",
            (body.get("nom"), body.get("prenom"), body.get("cin"), body.get("etablissement"),
             body.get("universite"), body.get("grade"), body.get("role"), user_id))
    return {"success": True}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, _: dict = Depends(require_admin)):
    execute("DELETE FROM larodec_users WHERE id=%s", (user_id,))
    return {"success": True}


# ===============================================================================
# RESEARCHERS (from larodec_schema tables)
# ===============================================================================

def _normalize(s: str) -> str:
    """Remove accents and normalize to ASCII lowercase for comparison."""
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode("ascii").lower()


@app.get("/api/researchers")
def get_researchers(
    categorie: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Returns all researchers from the 5 category tables unified."""
    results = []
    # (table, category_label, has_grade, has_dates)
    tables = [
        ("enseignants_corps_a",       "Corps A",          True,  False),
        ("enseignants_corps_b",       "Corps B",          True,  False),
        ("doctorants",                "Doctorant",        True,  True),
        ("etudiants_master_recherche","Master Recherche", True,  True),
        ("cadres_post_doc",           "Post-Doc",         True,  False),
    ]
    for table, cat, has_grade, has_dates in tables:
        if categorie and categorie != cat:
            continue
        try:
            grade_col = "COALESCE(grade, '') as grade" if has_grade else f"'{cat}' as grade"
            date_cols = ", COALESCE(url_photo, '') as url_photo, COALESCE(date_debut::text, '') as date_debut, COALESCE(date_fin::text, '') as date_fin" if has_dates else ", '' as url_photo, '' as date_debut, '' as date_fin"
            sql = f"""
                SELECT id, nom_prenom,
                       {grade_col},
                       n_cin, etablissement, universite,
                       '{cat}' as categorie,
                       '{table}' as table_source
                       {date_cols}
                FROM {table}
            """
            params = []
            if search:
                sql += " WHERE LOWER(nom_prenom) LIKE %s"
                params.append(f"%{search.lower()}%")
            sql += " ORDER BY nom_prenom"
            rows = query(sql, params)
            results.extend(rows)
        except Exception as e:
            print(f"[researchers] {table}: {e}")
    return results


@app.get("/api/researchers/profile/{nom_prenom}")
def get_researcher_profile(nom_prenom: str, _: dict = Depends(get_current_user)):
    """Full profile of a researcher: info + their publications."""
    nom_upper = nom_prenom.upper().strip()

    # Search across all registry tables
    profile = None
    categorie = None
    for table, cat in [
        ("enseignants_corps_a",       "Corps A"),
        ("enseignants_corps_b",       "Corps B"),
        ("cadres_post_doc",           "Post-Doc"),
        ("doctorants",                "Doctorant"),
        ("etudiants_master_recherche","Master Recherche"),
    ]:
        row = query(
            f"SELECT * FROM {table} WHERE UPPER(TRIM(nom_prenom)) = %s",
            (nom_upper,), one=True
        )
        if row:
            profile = dict(row)
            categorie = cat
            break

    if not profile:
        # Return minimal profile from articles table
        profile = {"nom_prenom": nom_prenom, "grade": "", "etablissement": "", "universite": "", "n_cin": ""}
        categorie = "Externe"

    profile["categorie"] = categorie

    # Get all publications for this researcher
    pubs = query("""
        SELECT titre, auteurs, journal_ou_editeur, annee, doi, url,
               source_scraping, citation_apa, type_publication, indexation
        FROM articles
        WHERE UPPER(TRIM(chercheur_nom)) = %s
        ORDER BY annee DESC
        LIMIT 50
    """, (nom_upper,))

    return {
        "profile": profile,
        "publications": pubs,
        "nb_publications": len(pubs),
    }


@app.get("/api/researchers/stats")
def get_researcher_stats():
    """Count per category."""
    stats = {}
    for table, cat in [
        ("enseignants_corps_a", "Corps A"),
        ("enseignants_corps_b", "Corps B"),
        ("doctorants",          "Doctorant"),
        ("etudiants_master_recherche", "Master Recherche"),
        ("cadres_post_doc",     "Post-Doc"),
    ]:
        try:
            row = query(f"SELECT COUNT(*) as c FROM {table}", one=True)
            stats[cat] = list(row.values())[0]
        except Exception:
            stats[cat] = 0
    return stats


# ===============================================================================
# ARTICLES (real scraped data from `articles` table)
# ===============================================================================

@app.get("/api/articles")
def get_articles(
    chercheur: Optional[str] = None,
    annee: Optional[int] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user)
):
    # Build a unified researcher lookup (name → grade + category)
    sql = """
        SELECT a.*,
               COALESCE(ca.grade, cb.grade, cp.grade, 'Chercheur') as chercheur_grade,
               CASE
                 WHEN ca.nom_prenom IS NOT NULL THEN 'Corps A'
                 WHEN cb.nom_prenom IS NOT NULL THEN 'Corps B'
                 WHEN cp.nom_prenom IS NOT NULL THEN 'Post-Doc'
                 WHEN d.nom_prenom  IS NOT NULL THEN 'Doctorant'
                 WHEN m.nom_prenom  IS NOT NULL THEN 'Master'
                 ELSE 'Externe'
               END as chercheur_categorie
        FROM articles a
        LEFT JOIN enseignants_corps_a ca ON UPPER(TRIM(ca.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN enseignants_corps_b cb ON UPPER(TRIM(cb.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN cadres_post_doc      cp ON UPPER(TRIM(cp.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN doctorants           d  ON UPPER(TRIM(d.nom_prenom))  = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN etudiants_master_recherche m ON UPPER(TRIM(m.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        WHERE 1=1
    """
    params: list = []
    if chercheur:
        sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"; params.append(chercheur)
    if annee:
        sql += " AND a.annee = %s"; params.append(annee)
    if search:
        sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    if source:
        sql += " AND a.source_scraping = %s"; params.append(source)
    sql += " ORDER BY a.annee DESC, a.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    rows = query(sql, params)

    count_sql = "SELECT COUNT(*) as c FROM articles WHERE 1=1"
    count_params: list = []
    if chercheur:
        count_sql += " AND UPPER(TRIM(chercheur_nom)) = UPPER(TRIM(%s))"; count_params.append(chercheur)
    if annee:
        count_sql += " AND annee = %s"; count_params.append(annee)
    if search:
        count_sql += " AND (LOWER(titre) LIKE %s OR LOWER(auteurs) LIKE %s OR LOWER(chercheur_nom) LIKE %s)"
        count_params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    total = list(query(count_sql, count_params, one=True).values())[0]

    return {"items": rows, "total": total, "limit": limit, "offset": offset}


@app.get("/api/articles/chercheurs")
def get_articles_chercheurs(_: dict = Depends(get_current_user)):
    """Distinct researcher names that have articles, with their registry info."""
    rows = query("""
        SELECT DISTINCT a.chercheur_nom,
               COALESCE(ca.grade, cb.grade, cp.grade, '') as grade,
               CASE
                 WHEN ca.nom_prenom IS NOT NULL THEN 'Corps A'
                 WHEN cb.nom_prenom IS NOT NULL THEN 'Corps B'
                 WHEN cp.nom_prenom IS NOT NULL THEN 'Post-Doc'
                 WHEN d.nom_prenom  IS NOT NULL THEN 'Doctorant'
                 WHEN m.nom_prenom  IS NOT NULL THEN 'Master'
                 ELSE 'Externe'
               END as categorie,
               COUNT(a.id) OVER (PARTITION BY a.chercheur_nom) as nb_pubs
        FROM articles a
        LEFT JOIN enseignants_corps_a ca ON UPPER(TRIM(ca.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN enseignants_corps_b cb ON UPPER(TRIM(cb.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN cadres_post_doc      cp ON UPPER(TRIM(cp.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN doctorants           d  ON UPPER(TRIM(d.nom_prenom))  = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN etudiants_master_recherche m ON UPPER(TRIM(m.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        ORDER BY a.chercheur_nom
    """)
    return rows


@app.get("/api/articles/stats")
def get_articles_stats(_: dict = Depends(get_current_user)):
    total       = list(query("SELECT COUNT(*) as c FROM articles", one=True).values())[0]
    par_annee   = query("SELECT annee, COUNT(*) as total FROM articles WHERE annee IS NOT NULL GROUP BY annee ORDER BY annee")
    par_source  = query("SELECT source_scraping, COUNT(*) as total FROM articles GROUP BY source_scraping ORDER BY total DESC")
    par_chercheur = query("SELECT chercheur_nom, COUNT(*) as total FROM articles GROUP BY chercheur_nom ORDER BY total DESC LIMIT 20")
    return {
        "total": total,
        "par_annee": par_annee,
        "par_source": par_source,
        "par_chercheur": par_chercheur,
    }


@app.get("/api/ouvrages")
def get_ouvrages(
    type_filter: str = "book",  # "book" or "chapter"
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    _: dict = Depends(get_current_user)
):
    """
    Returns articles filtered by type:
    - type_filter=book    → book, Books and Theses, Editorship, livre
    - type_filter=chapter → book-chapter, Parts in Books or Collections, chapter
    """
    if type_filter == "book":
        type_conditions = "LOWER(type_publication) IN ('book','livre','books and theses','editorship')"
    else:
        type_conditions = "LOWER(type_publication) IN ('book-chapter','book_chapter','chapter','parts in books or collections')"

    sql = f"""
        SELECT a.*,
               COALESCE(ca.grade, cb.grade, cp.grade, '') as chercheur_grade,
               CASE
                 WHEN ca.nom_prenom IS NOT NULL THEN 'Corps A'
                 WHEN cb.nom_prenom IS NOT NULL THEN 'Corps B'
                 WHEN cp.nom_prenom IS NOT NULL THEN 'Post-Doc'
                 WHEN d.nom_prenom  IS NOT NULL THEN 'Doctorant'
                 WHEN m.nom_prenom  IS NOT NULL THEN 'Master'
                 ELSE 'Externe'
               END as chercheur_categorie
        FROM articles a
        LEFT JOIN enseignants_corps_a ca ON UPPER(TRIM(ca.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN enseignants_corps_b cb ON UPPER(TRIM(cb.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN cadres_post_doc      cp ON UPPER(TRIM(cp.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN doctorants           d  ON UPPER(TRIM(d.nom_prenom))  = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN etudiants_master_recherche m ON UPPER(TRIM(m.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        WHERE {type_conditions}
    """
    params: list = []
    if search:
        sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    sql += " ORDER BY a.annee DESC, a.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    rows = query(sql, params)

    count_sql = f"SELECT COUNT(*) as c FROM articles WHERE {type_conditions}"
    count_params: list = []
    if search:
        count_sql += " AND (LOWER(titre) LIKE %s OR LOWER(auteurs) LIKE %s OR LOWER(chercheur_nom) LIKE %s)"
        count_params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    total = list(query(count_sql, count_params, one=True).values())[0]

    return {"items": rows, "total": total}



# ===============================================================================
# OUVRAGES (books + chapters from articles table)
# ===============================================================================

@app.get("/api/ouvrages")
def get_ouvrages(
    type_filter: str = "book",
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    _: dict = Depends(get_current_user)
):
    if type_filter == "book":
        type_conditions = "LOWER(a.type_publication) IN ('book', 'livre', 'books and theses')"
    else:
        type_conditions = "LOWER(a.type_publication) IN ('book-chapter', 'book_chapter', 'chapter', 'parts in books or collections')"

    sql = f"""
        SELECT a.*,
               COALESCE(ca.grade, cb.grade, cp.grade, '') as chercheur_grade,
               CASE
                 WHEN ca.nom_prenom IS NOT NULL THEN 'Corps A'
                 WHEN cb.nom_prenom IS NOT NULL THEN 'Corps B'
                 WHEN cp.nom_prenom IS NOT NULL THEN 'Post-Doc'
                 WHEN d.nom_prenom  IS NOT NULL THEN 'Doctorant'
                 WHEN m.nom_prenom  IS NOT NULL THEN 'Master'
                 ELSE 'Externe'
               END as chercheur_categorie
        FROM articles a
        LEFT JOIN enseignants_corps_a ca ON UPPER(TRIM(ca.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN enseignants_corps_b cb ON UPPER(TRIM(cb.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN cadres_post_doc      cp ON UPPER(TRIM(cp.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN doctorants           d  ON UPPER(TRIM(d.nom_prenom))  = UPPER(TRIM(a.chercheur_nom))
        LEFT JOIN etudiants_master_recherche m ON UPPER(TRIM(m.nom_prenom)) = UPPER(TRIM(a.chercheur_nom))
        WHERE {type_conditions}
    """
    params: list = []
    if search:
        sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    sql += " ORDER BY a.annee DESC, a.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    rows = query(sql, params)

    count_sql = f"SELECT COUNT(*) as c FROM articles a WHERE {type_conditions}"
    count_params: list = []
    if search:
        count_sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        count_params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    total = list(query(count_sql, count_params, one=True).values())[0]
    return {"items": rows, "total": total}


# ===============================================================================

@app.get("/api/publications")
def get_publications(statut: Optional[str] = None, chercheur_id: Optional[int] = None,
                     user: dict = Depends(get_current_user)):
    sql    = "SELECT p.*, u.nom, u.prenom FROM larodec_publications p LEFT JOIN larodec_users u ON p.chercheur_id=u.id WHERE 1=1"
    params = []
    if statut:
        sql += " AND p.statut=%s"; params.append(statut)
    if user["role"] in ("chercheur", "admin+chercheur"):
        sql += " AND p.chercheur_id=%s"; params.append(user["id"])
    elif chercheur_id:
        sql += " AND p.chercheur_id=%s"; params.append(chercheur_id)
    sql += " ORDER BY p.annee DESC, p.created_at DESC"
    return query(sql, params)


@app.post("/api/publications", status_code=201)
def create_publication(body: PublicationCreate, user: dict = Depends(get_current_user)):
    row = execute("""
        INSERT INTO larodec_publications (titre,journal,annee,indexation,auteurs,impact_factor,chercheur_id,statut,doi,abstract,source)
        VALUES (%s,%s,%s,%s,%s,%s,%s,'en_attente',%s,%s,'manuel') RETURNING id
    """, (body.titre, body.journal, body.annee, body.indexation, body.auteurs,
          body.impact_factor, user["id"], body.doi, body.abstract))
    _audit(user["id"], "CREATE", "publication", row["id"])
    return {"id": row["id"]}


@app.put("/api/publications/{pub_id}/statut")
def update_pub_statut(pub_id: int, body: StatutUpdate, user: dict = Depends(require_admin)):
    execute("UPDATE larodec_publications SET statut=%s WHERE id=%s", (body.statut, pub_id))
    _audit(user["id"], "STATUS_CHANGE", "publication", pub_id, body.statut)
    return {"success": True}


@app.delete("/api/publications/{pub_id}")
def delete_publication(pub_id: int, user: dict = Depends(get_current_user)):
    execute("DELETE FROM larodec_publications WHERE id=%s", (pub_id,))
    return {"success": True}


# ===============================================================================
# SCRAPER ROUTES
# ===============================================================================

@app.post("/api/scraper/search")
def scraper_search(body: ScraperSearchRequest, user: dict = Depends(get_current_user)):
    """Search publications for an author across selected sources."""
    name    = body.authorName.strip()
    parts   = name.split()
    prenom  = parts[0] if parts else name
    nom     = " ".join(parts[1:]) if len(parts) > 1 else name
    sources = [s.lower() for s in body.sources]

    all_articles = []

    if "dblp" in sources:
        try:
            arts = scrape_dblp(name)
            all_articles.extend(arts)
        except Exception as e:
            print(f"[DBLP] {e}")

    if "openalex" in sources:
        try:
            arts = scrape_openalex(prenom, nom)
            all_articles.extend(arts)
        except Exception as e:
            print(f"[OpenAlex] {e}")

    if "scopus" in sources:
        try:
            arts = scrape_scopus(prenom, nom)
            all_articles.extend(arts)
        except Exception as e:
            print(f"[Scopus] {e}")

    unique = deduplicate(all_articles)

    results = [{
        "paperId"   : f"{a.get('source','?')}_{i}",
        "titre"     : a.get("titre", ""),
        "journal"   : a.get("venue", ""),
        "annee"     : a.get("annee", 0),
        "auteurs"   : a.get("auteurs", ""),
        "doi"       : a.get("doi", ""),
        "abstract"  : a.get("description", ""),
        "indexation": a.get("indexation", ""),
        "source"    : a.get("source", ""),
        "url"       : a.get("url", ""),
        "citation_apa": format_apa(a),
    } for i, a in enumerate(unique)]

    return {"results": results, "total": len(results)}


@app.post("/api/scraper/import")
def scraper_import(body: ScraperImportRequest, user: dict = Depends(get_current_user)):
    """Import selected papers into larodec_publications."""
    target_id = body.chercheurId if (user["role"] == "admin" and body.chercheurId) else user["id"]
    imported  = 0

    for p in body.papers:
        doi = (p.get("doi") or "").strip() or None
        # Skip duplicates by DOI
        if doi:
            exists = query("SELECT id FROM larodec_publications WHERE doi=%s", (doi,), one=True)
            if exists:
                continue
        execute("""
            INSERT INTO larodec_publications
                (titre, journal, annee, indexation, auteurs, impact_factor, chercheur_id, statut, doi, abstract, source, citations)
            VALUES (%s,%s,%s,%s,%s,0,%s,'en_attente',%s,%s,%s,%s)
        """, (p.get("titre",""), p.get("journal",""), p.get("annee", 0),
              p.get("indexation",""), p.get("auteurs",""), target_id,
              doi, p.get("abstract",""), p.get("source","scraper"), p.get("citations", 0)))
        imported += 1

    _audit(user["id"], "SCRAPE_IMPORT", "publication", target_id, f"{imported} importées")
    return {"imported": imported, "message": f"{imported} publication(s) importée(s) avec succès"}


@app.post("/api/scraper/auto")
def scraper_auto(_: dict = Depends(require_admin)):
    """Auto-scrape all researchers from the DB."""
    researchers = []
    for table in ["enseignants_corps_a", "enseignants_corps_b", "cadres_post_doc"]:
        try:
            rows = query(f"SELECT nom_prenom FROM {table}")
            researchers.extend([r["nom_prenom"] for r in rows])
        except Exception:
            pass

    summary = []
    for nom_complet in researchers[:10]:  # limit to 10 per call to avoid timeout
        parts  = nom_complet.strip().split()
        prenom = parts[-1] if len(parts) > 1 else parts[0]
        nom    = " ".join(parts[:-1]) if len(parts) > 1 else parts[0]
        try:
            arts     = scrape_dblp(nom_complet)
            arts    += scrape_openalex(prenom, nom)
            unique   = deduplicate(arts)
            imported = 0
            for a in unique:
                doi = (a.get("doi") or "").strip() or None
                if doi:
                    exists = query("SELECT id FROM larodec_publications WHERE doi=%s", (doi,), one=True)
                    if exists:
                        continue
                execute("""
                    INSERT INTO larodec_publications
                        (titre, journal, annee, indexation, auteurs, impact_factor, statut, doi, abstract, source)
                    VALUES (%s,%s,%s,%s,%s,0,'en_attente',%s,%s,%s)
                """, (a.get("titre",""), a.get("venue",""), a.get("annee",0),
                      a.get("indexation",""), a.get("auteurs",""),
                      doi, a.get("description",""), a.get("source","scraper")))
                imported += 1
            summary.append({"chercheur": nom_complet, "imported": imported})
            time.sleep(0.5)
        except Exception as e:
            summary.append({"chercheur": nom_complet, "error": str(e)})

    return {"summary": summary}


# ===============================================================================
# ÉVÉNEMENTS
# ===============================================================================

@app.get("/api/evenements")
def get_evenements(_: dict = Depends(get_current_user)):
    return query("SELECT * FROM larodec_evenements ORDER BY date DESC")


@app.post("/api/evenements", status_code=201)
def create_evenement(body: EvenementCreate, user: dict = Depends(get_current_user)):
    row = execute("""
        INSERT INTO larodec_evenements (titre,type,date,date_debut,date_fin,lieu,description,url_photo,statut)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'en_attente') RETURNING id
    """, (body.titre, body.type, body.date, body.date_debut, body.date_fin,
          body.lieu, body.description, body.url_photo))
    return {"id": row["id"]}


@app.put("/api/evenements/{ev_id}/statut")
def update_ev_statut(ev_id: int, body: StatutUpdate, user: dict = Depends(require_admin)):
    execute("UPDATE larodec_evenements SET statut=%s WHERE id=%s", (body.statut, ev_id))
    _audit(user["id"], "STATUS_CHANGE", "evenement", ev_id, body.statut)
    return {"success": True}


@app.delete("/api/evenements/{ev_id}")
def delete_evenement(ev_id: int, _: dict = Depends(require_admin)):
    execute("DELETE FROM larodec_evenements WHERE id=%s", (ev_id,))
    return {"success": True}


# ===============================================================================
# CONVENTIONS
# ===============================================================================

class ConventionCreate(BaseModel):
    titre: str
    partenaire: str = ""
    date_debut: str = ""
    date_fin: str = ""
    type: str = "Recherche"
    annee: int = 2025
    programme: Optional[str] = None
    budget: Optional[str] = None
    pays: Optional[str] = None
    coordinateur: Optional[str] = None
    categorie: str = "entreprise"  # entreprise | cooperation

@app.get("/api/conventions")
def get_conventions(_: dict = Depends(get_current_user)):
    return query("SELECT * FROM larodec_conventions ORDER BY annee DESC, created_at DESC")

@app.post("/api/conventions", status_code=201)
def create_convention(body: ConventionCreate, user: dict = Depends(require_admin)):
    row = execute("""
        INSERT INTO larodec_conventions (titre, partenaire, date_debut, date_fin, type, annee, programme, budget, pays, coordinateur, categorie)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (body.titre, body.partenaire, body.date_debut, body.date_fin, body.type,
          body.annee, body.programme, body.budget, body.pays, body.coordinateur, body.categorie))
    _audit(user["id"], "CREATE", "convention", row["id"])
    return {"id": row["id"]}

@app.delete("/api/conventions/{conv_id}")
def delete_convention(conv_id: int, user: dict = Depends(require_admin)):
    execute("DELETE FROM larodec_conventions WHERE id=%s", (conv_id,))
    _audit(user["id"], "DELETE", "convention", conv_id)
    return {"success": True}


# ===============================================================================
# RAPPORT ANNUEL — dynamic stats by year
# ===============================================================================

@app.get("/api/rapport/{annee}")
def get_rapport(annee: int, _: dict = Depends(get_current_user)):
    def count(sql, params=()):
        row = query(sql, params, one=True)
        return list(row.values())[0] if row else 0

    # Équipe (static counts from registry — not year-dependent)
    corps_a   = count("SELECT COUNT(*) FROM enseignants_corps_a")
    corps_b   = count("SELECT COUNT(*) FROM enseignants_corps_b")
    doctorants_n = count("SELECT COUNT(*) FROM doctorants")
    masters   = count("SELECT COUNT(*) FROM etudiants_master_recherche")
    post_doc  = count("SELECT COUNT(*) FROM cadres_post_doc")

    # Production scientifique — from scraped articles filtered by year
    pubs_jcr  = count("SELECT COUNT(*) FROM articles WHERE annee=%s", (annee,))
    pubs_all  = count("SELECT COUNT(*) FROM articles WHERE annee<=%s", (annee,))

    # Portal data filtered by year
    theses_n  = count("SELECT COUNT(*) FROM larodec_theses WHERE annee=%s", (annee,)) if _table_exists("larodec_theses") else 0
    ouvrages_n = count("SELECT COUNT(*) FROM larodec_ouvrages WHERE annee=%s", (annee,)) if _table_exists("larodec_ouvrages") else 0

    # Ouverture
    seminaires_n = count("SELECT COUNT(*) FROM larodec_evenements WHERE statut='valide' AND date LIKE %s", (f"{annee}%",))
    conventions_n = count("SELECT COUNT(*) FROM larodec_conventions WHERE annee=%s", (annee,))

    # Top publications for the year
    top_pubs = query("""
        SELECT titre, auteurs, journal_ou_editeur, annee, doi, source_scraping
        FROM articles WHERE annee=%s ORDER BY id LIMIT 20
    """, (annee,))

    # Publications per source for the year
    par_source = query("""
        SELECT source_scraping, COUNT(*) as total
        FROM articles WHERE annee=%s GROUP BY source_scraping ORDER BY total DESC
    """, (annee,))

    # Researchers list for the report
    chercheurs_a = query("SELECT grade, nom_prenom, n_cin, etablissement, universite FROM enseignants_corps_a ORDER BY nom_prenom")
    chercheurs_b = query("SELECT grade, nom_prenom, n_cin, etablissement, universite FROM enseignants_corps_b ORDER BY nom_prenom")
    doctorants_list = query("SELECT nom_prenom, n_cin, etablissement, universite FROM doctorants ORDER BY nom_prenom")

    # Events for the year
    evenements_list = query("SELECT * FROM larodec_evenements WHERE statut='valide' AND date LIKE %s ORDER BY date", (f"{annee}%",))

    # Conventions for the year
    conventions_list = query("SELECT * FROM larodec_conventions WHERE annee=%s ORDER BY created_at", (annee,))

    return {
        "annee": annee,
        "equipe": {
            "corps_a": corps_a,
            "corps_b": corps_b,
            "permanents": corps_a + corps_b,
            "doctorants": doctorants_n,
            "masters": masters,
            "post_doc": post_doc,
        },
        "production": {
            "publications_jcr": pubs_jcr,
            "publications_total": pubs_all,
            "ouvrages": ouvrages_n,
            "theses": theses_n,
            "par_source": par_source,
        },
        "ouverture": {
            "seminaires": seminaires_n,
            "conventions": conventions_n,
            "projets_internationaux": 0,
        },
        "listes": {
            "publications": top_pubs,
            "chercheurs_a": chercheurs_a,
            "chercheurs_b": chercheurs_b,
            "doctorants": doctorants_list,
            "evenements": evenements_list,
            "conventions": conventions_list,
        }
    }


# ===============================================================================
# STATS
# ===============================================================================

@app.get("/api/stats")
def get_stats(_: dict = Depends(get_current_user)):
    def count(sql, params=()):
        row = query(sql, params, one=True)
        return list(row.values())[0] if row else 0

    # Real researcher counts from registry tables
    corps_a   = count("SELECT COUNT(*) FROM enseignants_corps_a")
    corps_b   = count("SELECT COUNT(*) FROM enseignants_corps_b")
    doctorants_n = count("SELECT COUNT(*) FROM doctorants")
    post_doc  = count("SELECT COUNT(*) FROM cadres_post_doc")
    total_chercheurs = corps_a + corps_b + doctorants_n + post_doc

    # Real articles from scraped table
    total_articles = count("SELECT COUNT(*) FROM articles")
    articles_par_annee = query(
        "SELECT annee, COUNT(*) as total FROM articles WHERE annee IS NOT NULL GROUP BY annee ORDER BY annee"
    )

    # Portal publications (pending validation)
    pubs_attente = count("SELECT COUNT(*) FROM larodec_publications WHERE statut='en_attente'")
    ev_attente   = count("SELECT COUNT(*) FROM larodec_evenements WHERE statut='en_attente'")
    evenements   = count("SELECT COUNT(*) FROM larodec_evenements")
    theses       = count("SELECT COUNT(*) FROM larodec_theses") if _table_exists("larodec_theses") else 0

    return {
        "chercheurs"      : total_chercheurs,
        "corps_a"         : corps_a,
        "corps_b"         : corps_b,
        "doctorants"      : doctorants_n,
        "post_doc"        : post_doc,
        "publications"    : total_articles,
        "pubsEnAttente"   : pubs_attente,
        "evenements"      : evenements,
        "evEnAttente"     : ev_attente,
        "theses"          : theses,
        "pubsParAnnee"    : articles_par_annee,
    }


def _table_exists(table: str) -> bool:
    row = query("SELECT to_regclass(%s) as t", (table,), one=True)
    return row and row["t"] is not None


# ===============================================================================
# AUDIT
# ===============================================================================

def _audit(user_id, action, entity, entity_id=None, detail=None):
    try:
        execute("""
            INSERT INTO larodec_audit (user_id, action, entity, entity_id, detail)
            VALUES (%s,%s,%s,%s,%s)
        """, (user_id, action, entity, entity_id, detail))
    except Exception:
        pass  # audit table may not exist yet


@app.get("/api/audit")
def get_audit(_: dict = Depends(require_admin)):
    return query("""
        SELECT a.*, u.email FROM larodec_audit a
        LEFT JOIN larodec_users u ON a.user_id=u.id
        ORDER BY a.created_at DESC LIMIT 100
    """)


@app.get("/api/public/events")
def get_public_events():
    """Public endpoint — upcoming/recent validated events, no auth required."""
    events = query("""
        SELECT * FROM larodec_evenements
        WHERE statut = 'valide'
        ORDER BY date DESC
        LIMIT 6
    """)
    return events


@app.get("/api/public/stats")
def get_public_stats():
    """Public stats for the homepage."""
    def count(sql):
        row = query(sql, one=True)
        return list(row.values())[0] if row else 0
    return {
        "chercheurs":   count("SELECT COUNT(*) FROM enseignants_corps_a") + count("SELECT COUNT(*) FROM enseignants_corps_b"),
        "publications": count("SELECT COUNT(*) FROM articles"),
        "doctorants":   count("SELECT COUNT(*) FROM doctorants"),
        "conventions":  count("SELECT COUNT(*) FROM larodec_conventions"),
        "evenements":   count("SELECT COUNT(*) FROM larodec_evenements WHERE statut='valide'"),
    }


# ===============================================================================
# HEALTH
# ===============================================================================

@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


# ===============================================================================
# PUBLIC ROUTES (no auth required)
# ===============================================================================

@app.get("/api/public/events")
def public_events():
    """Upcoming and recent validated events for the public homepage."""
    upcoming = query("""
        SELECT titre, type, date, date_debut, date_fin, lieu, description, url_photo
        FROM larodec_evenements
        WHERE statut = 'valide'
        ORDER BY COALESCE(date_debut, date) DESC
        LIMIT 6
    """)
    return upcoming or []


@app.get("/api/public/conventions")
def public_conventions():
    """Public list of conventions for the homepage partners section."""
    rows = query("""
        SELECT titre, partenaire, type, annee, pays
        FROM larodec_conventions
        ORDER BY annee DESC, created_at DESC
        LIMIT 20
    """)
    return rows or []


@app.get("/api/public/researchers")
def public_researchers(categorie: Optional[str] = None):
    """Public list of researchers for the homepage — no auth required."""
    results = []
    
    # D'abord, récupérer les utilisateurs avec leurs infos ET leur grade depuis les tables de membres
    try:
        user_sql = """
            SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.photo, 
                   CONCAT(u.prenom, ' ', u.nom) as nom_prenom,
                   COALESCE(
                     (SELECT grade FROM enseignants_corps_a WHERE LOWER(nom_prenom) = LOWER(CONCAT(u.prenom, ' ', u.nom)) LIMIT 1),
                     (SELECT grade FROM enseignants_corps_b WHERE LOWER(nom_prenom) = LOWER(CONCAT(u.prenom, ' ', u.nom)) LIMIT 1),
                     'Chercheur'
                   ) as grade
            FROM larodec_users u
            WHERE u.role IN ('chercheur', 'admin+chercheur')
            ORDER BY u.nom, u.prenom
        """
        users = query(user_sql)
        for user in users:
            photo_url = f"/api/auth/photo/{user['id']}" if user.get('photo') else ""
            results.append({
                'id': user['id'],
                'nom_prenom': user['nom_prenom'],
                'grade': user.get('grade', 'Chercheur'),
                'categorie': 'Utilisateur',
                'table_source': 'larodec_users',
                'url_photo': photo_url,
                'email': user.get('email', ''),
                'telephone': user.get('telephone', '')
            })
    except Exception as e:
        print(f"[public_researchers] larodec_users: {e}")
    
    # Ensuite, récupérer les membres des tables
    tables = [
        ("enseignants_corps_a",       "Corps A",          True,  False),
        ("enseignants_corps_b",       "Corps B",          True,  False),
        ("doctorants",                "Doctorant",        True,  True),
        ("etudiants_master_recherche","Master Recherche", True,  True),
        ("cadres_post_doc",           "Post-Doc",         True,  False),
    ]
    for table, cat, has_grade, has_dates in tables:
        if categorie and categorie != cat:
            continue
        try:
            grade_col = "COALESCE(grade, '') as grade" if has_grade else f"'{cat}' as grade"
            date_cols = ", COALESCE(url_photo, '') as url_photo" if has_dates else ", '' as url_photo"
            sql = f"""
                SELECT id, nom_prenom,
                       {grade_col},
                       '{cat}' as categorie,
                       '{table}' as table_source
                       {date_cols}
                FROM {table}
                ORDER BY nom_prenom
            """
            rows = query(sql)
            results.extend(rows)
        except Exception as e:
            print(f"[public_researchers] {table}: {e}")
    return results


@app.get("/api/public/researcher/{nom_prenom}")
def public_researcher(nom_prenom: str):
    """Get a single researcher by nom_prenom with user info — no auth required."""
    # First check larodec_users
    try:
        user_sql = """
            SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.photo, 
                   CONCAT(u.prenom, ' ', u.nom) as nom_prenom,
                   COALESCE(
                     (SELECT grade FROM enseignants_corps_a WHERE LOWER(nom_prenom) = LOWER(CONCAT(u.prenom, ' ', u.nom)) LIMIT 1),
                     (SELECT grade FROM enseignants_corps_b WHERE LOWER(nom_prenom) = LOWER(CONCAT(u.prenom, ' ', u.nom)) LIMIT 1),
                     'Chercheur'
                   ) as grade
            FROM larodec_users u
            WHERE LOWER(CONCAT(u.prenom, ' ', u.nom)) = LOWER(%s)
            AND u.role IN ('chercheur', 'admin+chercheur')
            LIMIT 1
        """
        user = query(user_sql, (nom_prenom,), one=True)
        if user:
            photo_url = f"/api/auth/photo/{user['id']}" if user.get('photo') else ""
            return {
                'id': user['id'],
                'nom_prenom': user['nom_prenom'],
                'grade': user.get('grade', 'Chercheur'),
                'categorie': 'Utilisateur',
                'table_source': 'larodec_users',
                'url_photo': photo_url,
                'email': user.get('email', ''),
                'telephone': user.get('telephone', '')
            }
    except Exception as e:
        print(f"[public_researcher] larodec_users: {e}")
    
    # Then check member tables
    tables = [
        ("enseignants_corps_a",       "Corps A",          True,  False),
        ("enseignants_corps_b",       "Corps B",          True,  False),
        ("doctorants",                "Doctorant",        True,  True),
        ("etudiants_master_recherche","Master Recherche", True,  True),
        ("cadres_post_doc",           "Post-Doc",         True,  False),
    ]
    for table, cat, has_grade, has_dates in tables:
        try:
            grade_col = "COALESCE(grade, '') as grade" if has_grade else f"'{cat}' as grade"
            date_cols = ", COALESCE(url_photo, '') as url_photo" if has_dates else ", '' as url_photo"
            sql = f"""
                SELECT id, nom_prenom,
                       {grade_col},
                       n_cin, etablissement, universite,
                       '{cat}' as categorie,
                       '{table}' as table_source
                       {date_cols}
                FROM {table}
                WHERE LOWER(nom_prenom) = LOWER(%s)
                LIMIT 1
            """
            row = query(sql, (nom_prenom,), one=True)
            if row:
                return row
        except Exception as e:
            print(f"[public_researcher] {table}: {e}")
    return None


@app.get("/api/public/researcher-publications/{nom_prenom}")
def public_researcher_publications(nom_prenom: str):
    """Get publications for a researcher — no auth required."""
    try:
        sql = """
            SELECT p.*, u.nom, u.prenom 
            FROM larodec_publications p 
            LEFT JOIN larodec_users u ON p.chercheur_id=u.id 
            WHERE p.statut='valide' AND (
                LOWER(u.nom || ' ' || u.prenom) LIKE LOWER(%s) OR
                LOWER(p.auteurs) LIKE LOWER(%s)
            )
            ORDER BY p.annee DESC, p.created_at DESC
        """
        search_term = f"%{nom_prenom}%"
        rows = query(sql, (search_term, search_term))
        return rows or []
    except Exception as e:
        print(f"[public_researcher_publications]: {e}")
        return []


@app.get("/api/debug/photo-status/{user_id}")
def debug_photo_status(user_id: int):
    """Debug endpoint to check photo status"""
    try:
        row = query("""
            SELECT id, nom, prenom, email, photo_filename,
                   photo IS NOT NULL as has_photo,
                   OCTET_LENGTH(photo) as photo_size
            FROM larodec_users
            WHERE id = %s
        """, (user_id,), one=True)
        
        if not row:
            return {"error": "User not found"}
        
        return {
            "id": row["id"],
            "nom": row["nom"],
            "prenom": row["prenom"],
            "email": row["email"],
            "photo_filename": row["photo_filename"],
            "has_photo": row["has_photo"],
            "photo_size": row["photo_size"]
        }
    except Exception as e:
        return {"error": str(e)}


# ===============================================================================
# ADMIN MANAGEMENT - Dynamic admin based on direction
# ===============================================================================

class AdminChangeRequest(BaseModel):
    nom: str
    prenom: str
    email: str = "admin@larodec.tn"

def generate_admin_password(nom: str, prenom: str) -> str:
    """Generate password: larodec + nom + prenom (lowercase, no spaces)"""
    nom_clean = nom.replace(" ", "").lower()
    prenom_clean = prenom.replace(" ", "").lower()
    return f"larodec{nom_clean}{prenom_clean}"

@app.get("/api/admin/current")
def get_current_admin(_: dict = Depends(require_admin)):
    """Get current admin user"""
    result = query("""
        SELECT id, email, nom, prenom, grade
        FROM larodec_users
        WHERE role = 'admin'
        LIMIT 1
    """, one=True)
    if result:
        return {
            "id": result[0],
            "email": result[1],
            "nom": result[2],
            "prenom": result[3],
            "grade": result[4]
        }
    return {"error": "No admin found"}

@app.post("/api/admin/change")
def change_admin(body: AdminChangeRequest, _: dict = Depends(require_admin)):
    """
    Change admin user (typically when direction changes).
    Auto-generates password: larodec + nom + prenom
    """
    try:
        password = generate_admin_password(body.nom, body.prenom)
        hashed = make_token(0, body.email, "admin")  # Using make_token for consistency
        
        # In production, use bcrypt for password hashing
        # For now, we'll use a simple approach
        import bcrypt
        hashed_pwd = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        
        # Remove admin role from all users
        execute("UPDATE larodec_users SET role = 'chercheur' WHERE role = 'admin'")
        
        # Check if user exists
        user = query("SELECT id FROM larodec_users WHERE email = %s", (body.email,), one=True)
        
        if user:
            # Update existing user
            execute("""
                UPDATE larodec_users 
                SET role = 'admin', password = %s, nom = %s, prenom = %s
                WHERE email = %s
            """, (hashed_pwd, body.nom, body.prenom, body.email))
        else:
            # Create new user
            execute("""
                INSERT INTO larodec_users (email, password, role, nom, prenom, cin, etablissement, universite, grade)
                VALUES (%s, %s, 'admin', %s, %s, '', 'ISG Tunis', 'Université de Tunis', 'Professeur')
            """, (body.email, hashed_pwd, body.nom, body.prenom))
        
        _audit(_.get("id"), "ADMIN_CHANGE", "larodec_users", detail=f"Admin changed to {body.nom} {body.prenom}")
        
        return {
            "success": True,
            "message": f"Admin changed to {body.nom} {body.prenom}",
            "email": body.email,
            "password": password,
            "note": "Password contains: larodec + nom + prenom"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/admin/researchers")
def get_admin_candidates(_: dict = Depends(require_admin)):
    """Get list of researchers who can be admin"""
    results = query("""
        SELECT id, nom, prenom, grade, email, role
        FROM larodec_users
        WHERE role IN ('chercheur', 'admin')
        ORDER BY nom, prenom
    """)
    return results or []


# ===============================================================================
# CHERCHEUR THESES MANAGEMENT
# ===============================================================================

class ThesisRequest(BaseModel):
    titre: str
    annee: int
    annee_premiere_inscription: int
    sujet: str

@app.get("/api/chercheur/theses")
def get_chercheur_theses(user: dict = Depends(get_current_user)):
    """Get all theses supervised by the current chercheur"""
    theses = query("""
        SELECT id, titre, annee, annee_premiere_inscription, sujet, chercheur_id, created_at
        FROM larodec_theses
        WHERE chercheur_id = %s
        ORDER BY annee DESC, created_at DESC
    """, (user["id"],))
    return theses or []

@app.post("/api/chercheur/theses")
def create_thesis(body: ThesisRequest, user: dict = Depends(get_current_user)):
    """Create a new thesis supervised by the current chercheur"""
    try:
        execute("""
            INSERT INTO larodec_theses (titre, annee, annee_premiere_inscription, sujet, chercheur_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (body.titre, body.annee, body.annee_premiere_inscription, body.sujet, user["id"]))
        
        _audit(user["id"], "CREATE_THESIS", "larodec_theses", detail=body.titre)
        
        return {"success": True, "message": "Thèse ajoutée avec succès"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/chercheur/theses/{thesis_id}")
def update_thesis(thesis_id: int, body: ThesisRequest, user: dict = Depends(get_current_user)):
    """Update a thesis (only if owned by current chercheur)"""
    try:
        # Check ownership
        thesis = query("""
            SELECT id FROM larodec_theses WHERE id = %s AND chercheur_id = %s
        """, (thesis_id, user["id"]), one=True)
        
        if not thesis:
            raise HTTPException(status_code=403, detail="Accès refusé")
        
        execute("""
            UPDATE larodec_theses
            SET titre = %s, annee = %s, annee_premiere_inscription = %s, sujet = %s
            WHERE id = %s
        """, (body.titre, body.annee, body.annee_premiere_inscription, body.sujet, thesis_id))
        
        _audit(user["id"], "UPDATE_THESIS", "larodec_theses", thesis_id, body.titre)
        
        return {"success": True, "message": "Thèse modifiée avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/chercheur/theses/{thesis_id}")
def delete_thesis(thesis_id: int, user: dict = Depends(get_current_user)):
    """Delete a thesis (only if owned by current chercheur)"""
    try:
        # Check ownership
        thesis = query("""
            SELECT id FROM larodec_theses WHERE id = %s AND chercheur_id = %s
        """, (thesis_id, user["id"]), one=True)
        
        if not thesis:
            raise HTTPException(status_code=403, detail="Accès refusé")
        
        execute("DELETE FROM larodec_theses WHERE id = %s", (thesis_id,))
        
        _audit(user["id"], "DELETE_THESIS", "larodec_theses", thesis_id)
        
        return {"success": True, "message": "Thèse supprimée avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
