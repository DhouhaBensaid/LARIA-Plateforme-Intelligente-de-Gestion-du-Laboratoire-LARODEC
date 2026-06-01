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

# --- Sentence-Transformers (optional — graceful fallback if not installed) ----
import logging as _logging
import json as _json

try:
    from sentence_transformers import SentenceTransformer as _SentenceTransformer
    import numpy as _np
    _ST_AVAILABLE = True
except ImportError:
    _logging.warning("[semantic] sentence-transformers not installed — falling back to TF-IDF search")
    _ST_AVAILABLE = False

_embedding_model = None

def _get_embedding_model():
    """Load the model once and cache it."""
    global _embedding_model
    if not _ST_AVAILABLE:
        return None
    if _embedding_model is None:
        _embedding_model = _SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _cosine_similarity(a, b) -> float:
    """Cosine similarity between two numpy vectors."""
    norm_a = _np.linalg.norm(a)
    norm_b = _np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(_np.dot(a, b) / (norm_a * norm_b))


def _pub_text(row: dict) -> str:
    """Build the text to embed for a publication row."""
    parts = [row.get("titre") or "", row.get("auteurs") or ""]
    return " ".join(p for p in parts if p).strip()


def _generate_embedding_for_pub(row: dict):
    """Generate and persist embedding for a single article row. Returns True on success."""
    model = _get_embedding_model()
    if model is None:
        return False
    text = _pub_text(row)
    if not text:
        return False
    try:
        vec = model.encode(text, convert_to_numpy=True)
        execute("UPDATE articles SET embedding = %s WHERE id = %s",
                (_json.dumps(vec.tolist()), row["id"]))
        return True
    except Exception as e:
        _logging.warning(f"[semantic] embedding failed for id={row.get('id')}: {e}")
        return False


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
    """Access token — 30 minutes."""
    payload = {
        "id"   : user_id,
        "email": email,
        "role" : role,
        "type" : "access",
        "exp"  : datetime.utcnow() + timedelta(minutes=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def make_refresh_token(user_id: int, email: str, role: str) -> str:
    """Refresh token — 7 days."""
    payload = {
        "id"   : user_id,
        "email": email,
        "role" : role,
        "type" : "refresh",
        "exp"  : datetime.utcnow() + timedelta(days=7),
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

class RefreshRequest(BaseModel):
    refresh_token: str
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
    access  = make_token(row["id"], row["email"], row["role"])
    refresh = make_refresh_token(row["id"], row["email"], row["role"])
    return {
        "token": access,           # backward compat
        "access_token": access,
        "refresh_token": refresh,
        "user": clean_user_data(row),
    }


@app.post("/api/auth/refresh")
def refresh_token(body: RefreshRequest):
    """Exchange a valid refresh_token for a new access_token + refresh_token (rotation)."""
    try:
        payload = jwt.decode(body.refresh_token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Refresh token invalide")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token type invalide")

    user_id = payload["id"]
    row = query("SELECT id, email, role FROM larodec_users WHERE id = %s", (user_id,), one=True)
    if not row:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    new_access  = make_token(row["id"], row["email"], row["role"])
    new_refresh = make_refresh_token(row["id"], row["email"], row["role"])
    return {"access_token": new_access, "refresh_token": new_refresh}


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
            # Include url_photo and is_directeur for corps_a and corps_b
            if has_dates:
                date_cols = ", COALESCE(url_photo, '') as url_photo, COALESCE(date_debut::text, '') as date_debut, COALESCE(date_fin::text, '') as date_fin, FALSE as is_directeur"
            elif table in ("enseignants_corps_a", "enseignants_corps_b"):
                date_cols = ", COALESCE(url_photo, '') as url_photo, '' as date_debut, '' as date_fin, COALESCE(is_directeur, FALSE) as is_directeur"
            elif table == "cadres_post_doc":
                date_cols = ", COALESCE(url_photo, '') as url_photo, '' as date_debut, '' as date_fin, FALSE as is_directeur"
            else:
                date_cols = ", '' as url_photo, '' as date_debut, '' as date_fin, FALSE as is_directeur"
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
            # Sort by grade priority then name (wrap in subquery to use alias)
            sql = f"SELECT * FROM ({sql}) AS sub ORDER BY is_directeur DESC, CASE COALESCE(grade, '') WHEN 'Professeur' THEN 1 WHEN 'Maitre de Conferences' THEN 2 WHEN 'Maître de Conférences' THEN 2 WHEN 'Maitre Assistant' THEN 3 WHEN 'Maître Assistant' THEN 3 WHEN 'Assistant Doctorant' THEN 4 WHEN 'Assistant' THEN 5 ELSE 6 END, nom_prenom"
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
        profile = {"nom_prenom": nom_prenom, "grade": "", "etablissement": "", "universite": "", "n_cin": ""}
        categorie = "Externe"

    profile["categorie"] = categorie

    # Enrich with contact info from larodec_users using member_id
    try:
        if profile.get("id"):
            user = query("""
                SELECT email, telephone, orcid, google_scholar_url
                FROM larodec_users
                WHERE member_id = %s
                LIMIT 1
            """, (profile["id"],), one=True)
            if user:
                profile["email"] = user.get("email", "")
                profile["telephone"] = user.get("telephone", "")
                profile["orcid"] = user.get("orcid", "")
                profile["google_scholar_url"] = user.get("google_scholar_url", "")
    except Exception as e:
        print(f"[profile contact] {e}")

    # Get all publications for this researcher
    pubs = query("""
        SELECT titre, auteurs, journal_ou_editeur, annee, doi, url,
               source_scraping, citation_apa, type_publication, indexation,
               volume, numero, pages
        FROM articles
        WHERE UPPER(TRIM(chercheur_nom)) = %s
        ORDER BY annee DESC
        LIMIT 100
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


@app.put("/api/researchers/set-directeur/{table}/{member_id}")
def set_directeur(table: str, member_id: int, _: dict = Depends(require_admin)):
    """Set a member as directeur (admin only). Removes previous directeur first."""
    allowed_tables = ["enseignants_corps_a", "enseignants_corps_b"]
    if table not in allowed_tables:
        raise HTTPException(status_code=400, detail="Table non autorisée")
    try:
        # Remove all existing directeurs
        for t in allowed_tables:
            execute(f"UPDATE {t} SET is_directeur = FALSE WHERE is_directeur = TRUE")
        # Set new directeur
        execute(f"UPDATE {table} SET is_directeur = TRUE WHERE id = %s", (member_id,))
        row = query(f"SELECT nom_prenom FROM {table} WHERE id = %s", (member_id,), one=True)
        return {"success": True, "directeur": row["nom_prenom"] if row else ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/researchers/directeur")
def get_directeur(_: dict = Depends(get_current_user)):
    """Get current directeur."""
    for table in ["enseignants_corps_a", "enseignants_corps_b"]:
        try:
            row = query(f"SELECT id, nom_prenom, grade FROM {table} WHERE is_directeur = TRUE LIMIT 1", one=True)
            if row:
                return {"table": table, "id": row["id"], "nom_prenom": row["nom_prenom"], "grade": row["grade"]}
        except Exception:
            pass
    return None


# ===============================================================================
# ARTICLES (real scraped data from `articles` table)
# ===============================================================================

@app.get("/api/articles")
def get_articles(
    chercheur: Optional[str] = None,
    annee: Optional[int] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    type_filter: Optional[str] = None,
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
    if type_filter:
        types = [t.strip() for t in type_filter.split(",") if t.strip()]
        if types:
            placeholders = ",".join(["%s"] * len(types))
            sql += f" AND LOWER(a.type_publication) IN ({placeholders})"
            params += [t.lower() for t in types]
    sql += " ORDER BY a.annee DESC, a.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    rows = query(sql, params)

    count_sql = """
        SELECT COUNT(*) as c FROM articles a WHERE 1=1
    """
    count_params: list = []
    if chercheur:
        count_sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"; count_params.append(chercheur)
    if annee:
        count_sql += " AND a.annee = %s"; count_params.append(annee)
    if search:
        count_sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        count_params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    if type_filter:
        types = [t.strip() for t in type_filter.split(",") if t.strip()]
        if types:
            placeholders = ",".join(["%s"] * len(types))
            count_sql += f" AND LOWER(a.type_publication) IN ({placeholders})"
            count_params += [t.lower() for t in types]
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


class ValidateChercheurRequest(BaseModel):
    validee_chercheur: Optional[bool] = None
    rejetee_chercheur: Optional[bool] = None


@app.put("/api/articles/{article_id}/validate-chercheur")
def validate_article_chercheur(
    article_id: int,
    body: ValidateChercheurRequest,
    user: dict = Depends(get_current_user),
):
    """Chercheur confirms or rejects an article as belonging to them."""
    # Verify the article belongs to this user
    row = query("SELECT id, chercheur_nom FROM articles WHERE id = %s", (article_id,), one=True)
    if not row:
        raise HTTPException(status_code=404, detail="Article introuvable")

    if body.validee_chercheur:
        execute(
            "UPDATE articles SET validee_chercheur = TRUE, rejetee_chercheur = FALSE WHERE id = %s",
            (article_id,)
        )
    elif body.rejetee_chercheur:
        execute(
            "UPDATE articles SET rejetee_chercheur = TRUE, validee_chercheur = FALSE WHERE id = %s",
            (article_id,)
        )
    return {"success": True}



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
    
    # Validate that the author is a LARODEC member
    name_upper = name.upper().strip()
    is_member = False
    for table in ["enseignants_corps_a", "enseignants_corps_b", "cadres_post_doc", "doctorants", "etudiants_master_recherche"]:
        try:
            row = query(f"SELECT id FROM {table} WHERE UPPER(TRIM(nom_prenom)) = %s", (name_upper,), one=True)
            if row:
                is_member = True
                break
        except Exception:
            pass
    
    if not is_member:
        # Try partial match
        for table in ["enseignants_corps_a", "enseignants_corps_b", "cadres_post_doc"]:
            try:
                row = query(f"SELECT id FROM {table} WHERE UPPER(TRIM(nom_prenom)) LIKE %s", (f"%{name_upper}%",), one=True)
                if row:
                    is_member = True
                    break
            except Exception:
                pass
    
    if not is_member:
        raise HTTPException(status_code=400, detail=f"'{name}' n'est pas un membre LARODEC enregistré dans la base de données.")
    
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
    
    # Filtrer: garder seulement les articles où le chercheur est bien dans les auteurs
    import unicodedata
    def norm(s):
        if not s: return ""
        s = s.lower().strip()
        s = unicodedata.normalize("NFD", s)
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        return " ".join("".join(c if c.isalpha() or c.isspace() else " " for c in s).split())
    
    name_norm = norm(name)
    name_parts = [p for p in name_norm.split() if len(p) > 2]
    
    validated = []
    for a in unique:
        auteurs_norm = norm(a.get("auteurs", ""))
        matches = sum(1 for p in name_parts if p in auteurs_norm)
        if matches >= min(2, len(name_parts)):
            validated.append(a)
    
    unique = validated

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


def _author_in_article(chercheur_nom: str, auteurs: str) -> bool:
    """Vérifie strictement que le chercheur est bien dans les auteurs."""
    import unicodedata
    def norm(s):
        if not s: return ""
        s = s.lower().strip()
        s = unicodedata.normalize("NFD", s)
        s = "".join(c for c in s if unicodedata.category(c) != "Mn")
        return " ".join("".join(c if c.isalpha() or c.isspace() else " " for c in s).split())
    
    chercheur_norm = norm(chercheur_nom)
    auteurs_norm = norm(auteurs)
    parts = [p for p in chercheur_norm.split() if len(p) > 2]
    if not parts: return False
    matches = sum(1 for p in parts if p in auteurs_norm)
    return matches >= min(2, len(parts))


@app.post("/api/scraper/auto")
def scraper_auto(_: dict = Depends(require_admin)):
    """Auto-scrape all researchers from the DB — only members present in the registry."""
    researchers = []
    for table in ["enseignants_corps_a", "enseignants_corps_b"]:
        try:
            rows = query(f"SELECT nom_prenom FROM {table}")
            researchers.extend([r["nom_prenom"] for r in rows])
        except Exception:
            pass

    summary = []
    for nom_complet in researchers[:10]:
        nom_upper = nom_complet.strip().upper()
        parts  = nom_complet.strip().split()
        prenom = parts[-1] if len(parts) > 1 else parts[0]
        nom    = " ".join(parts[:-1]) if len(parts) > 1 else parts[0]
        try:
            arts     = scrape_dblp(nom_complet)
            arts    += scrape_openalex(prenom, nom)
            unique   = deduplicate(arts)
            imported = 0
            skipped  = 0
            for a in unique:
                # Validation stricte: le chercheur doit être dans les auteurs
                if not _author_in_article(nom_complet, a.get("auteurs", "")):
                    skipped += 1
                    continue
                doi = (a.get("doi") or "").strip() or None
                if doi:
                    exists = query("SELECT id FROM articles WHERE doi=%s", (doi,), one=True)
                    if exists:
                        continue
                try:
                    execute("""
                        INSERT INTO articles
                            (chercheur_nom, titre, journal_ou_editeur, annee, indexation, auteurs,
                             doi, url, citation_apa, source_scraping, type_publication)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (doi) WHERE doi IS NOT NULL AND doi <> '' DO NOTHING
                    """, (nom_upper, a.get("titre",""), a.get("venue",""), a.get("annee",0),
                          a.get("indexation",""), a.get("auteurs",""),
                          doi, a.get("url",""), "",
                          a.get("source","scraper"), a.get("type_publication","")))
                    imported += 1
                except Exception:
                    pass
            summary.append({"chercheur": nom_complet, "imported": imported, "skipped": skipped})
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

@app.get("/api/admin/theses")
def get_all_theses(_: dict = Depends(require_admin)):
    """Get all theses from all researchers for admin view"""
    theses = query("""
        SELECT t.id, t.titre, t.annee, t.annee_premiere_inscription, t.sujet,
               t.chercheur_id, t.created_at,
               u.nom, u.prenom, u.grade
        FROM larodec_theses t
        LEFT JOIN larodec_users u ON u.id = t.chercheur_id
        ORDER BY t.annee DESC, t.created_at DESC
    """)
    return theses or []

@app.delete("/api/admin/theses/{thesis_id}")
def admin_delete_thesis(thesis_id: int, user: dict = Depends(require_admin)):
    execute("DELETE FROM larodec_theses WHERE id = %s", (thesis_id,))
    _audit(user["id"], "DELETE_THESIS", "larodec_theses", thesis_id)
    return {"success": True}

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
    ouvrages_n = 0  # larodec_ouvrages table may not exist — count from articles instead
    try:
        ouvrages_n = count("SELECT COUNT(*) FROM articles WHERE annee=%s AND LOWER(type_publication) IN ('book','books and theses','editorship','livre')", (annee,))
    except Exception:
        ouvrages_n = 0

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
    masters_list = query("SELECT nom_prenom, n_cin, etablissement, universite FROM etudiants_master_recherche ORDER BY nom_prenom")
    post_doc_list = query("SELECT grade, nom_prenom, n_cin, etablissement, universite FROM cadres_post_doc ORDER BY nom_prenom")

    # Publications for the year — all types
    pubs_list = query("""
        SELECT titre, auteurs, journal_ou_editeur, annee, doi, source_scraping, indexation, type_publication
        FROM articles WHERE annee=%s ORDER BY chercheur_nom, titre
    """, (annee,))

    # Ouvrages (books) — from articles table
    ouvrages_list = []
    try:
        ouvrages_list = query("""
            SELECT titre, auteurs, journal_ou_editeur, annee
            FROM articles WHERE annee=%s AND LOWER(type_publication) IN ('book','books and theses','editorship','livre')
            ORDER BY titre
        """, (annee,))
    except Exception:
        ouvrages_list = []

    # Chapitres
    chapitres_list = []
    try:
        chapitres_list = query("""
            SELECT titre, auteurs, journal_ou_editeur, annee
            FROM articles WHERE annee=%s AND LOWER(type_publication) IN ('book-chapter','chapter','parts in books or collections')
            ORDER BY titre
        """, (annee,))
    except Exception:
        chapitres_list = []

    # Thèses
    theses_list = []
    try:
        theses_list = query("SELECT * FROM larodec_theses WHERE annee=%s ORDER BY titre", (annee,)) if _table_exists("larodec_theses") else []
    except Exception:
        theses_list = []

    # Habilitations
    habilitations_list = []

    # Events for the year
    evenements_list = query("SELECT * FROM larodec_evenements WHERE statut='valide' AND date LIKE %s ORDER BY date", (f"{annee}%",))

    # Conventions for the year
    conventions_list = query("SELECT * FROM larodec_conventions WHERE annee=%s ORDER BY created_at", (annee,))

    # Counts
    articles_chapitres_n = 0
    try:
        articles_chapitres_n = count("SELECT COUNT(*) FROM articles WHERE annee=%s AND LOWER(type_publication) IN ('conference and workshop papers','inproceedings','book-chapter','chapter','parts in books or collections')", (annee,))
    except Exception:
        articles_chapitres_n = 0
    masteres_n = 0
    habilitations_n = 0

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
            "articles_chapitres": articles_chapitres_n,
            "masteres": masteres_n,
            "habilitations": habilitations_n,
            "par_source": par_source,
        },
        "ouverture": {
            "seminaires": seminaires_n,
            "conventions": conventions_n,
            "projets_internationaux": 0,
        },
        "listes": {
            "publications": pubs_list,
            "ouvrages": ouvrages_list,
            "chapitres": chapitres_list,
            "theses": theses_list,
            "habilitations": habilitations_list,
            "chercheurs_a": chercheurs_a,
            "chercheurs_b": chercheurs_b,
            "doctorants": doctorants_list,
            "masters": masters_list,
            "post_doc": post_doc_list,
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


@app.get("/api/public/articles")
def public_articles(
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    chercheur: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """Public articles endpoint — no auth required."""
    # Type filter mapping
    type_conditions = ""
    if type_filter == "revue":
        type_conditions = " AND LOWER(a.type_publication) IN ('journal articles','article','review','letter')"
    elif type_filter == "conference":
        type_conditions = " AND LOWER(a.type_publication) IN ('conference and workshop papers','conference paper','inproceedings')"
    elif type_filter == "workshop":
        type_conditions = " AND LOWER(a.type_publication) LIKE '%workshop%'"
    elif type_filter == "ouvrage":
        type_conditions = " AND LOWER(a.type_publication) IN ('book-chapter','book chapter','chapter','parts in books or collections','books and theses','book','editorship')"

    sql = f"""
        SELECT a.id, a.chercheur_nom, a.titre, a.journal_ou_editeur, a.annee,
               a.auteurs, a.doi, a.url, a.source_scraping, a.indexation,
               a.type_publication, a.citation_apa
        FROM articles a
        WHERE 1=1 {type_conditions}
    """
    params: list = []
    if chercheur:
        sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"; params.append(chercheur)
    if search:
        sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    sql += " ORDER BY a.annee DESC, a.id DESC LIMIT %s OFFSET %s"
    params += [limit, offset]
    rows = query(sql, params)

    count_sql = f"SELECT COUNT(*) as c FROM articles a WHERE 1=1 {type_conditions}"
    count_params: list = []
    if chercheur:
        count_sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"; count_params.append(chercheur)
    if search:
        count_sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        count_params += [f"%{search.lower()}%", f"%{search.lower()}%", f"%{search.lower()}%"]
    total = list(query(count_sql, count_params, one=True).values())[0]

    return {"items": rows, "total": total}


@app.get("/api/public/articles/chercheurs")
def public_articles_chercheurs():
    """Distinct researcher names with articles — no auth required."""
    rows = query("""
        SELECT DISTINCT chercheur_nom, COUNT(*) as nb
        FROM articles
        GROUP BY chercheur_nom
        ORDER BY chercheur_nom
    """)
    return rows or []


@app.get("/api/public/researchers")
def public_researchers(categorie: Optional[str] = None):
    """Public list of researchers for the homepage — no auth required."""
    results = []

    # Mapping member_table → categorie
    TABLE_TO_CAT = {
        "enseignants_corps_a":        "Corps A",
        "enseignants_corps_b":        "Corps B",
        "doctorants":                 "Doctorant",
        "etudiants_master_recherche": "Master Recherche",
        "cadres_post_doc":            "Post-Doc",
    }

    # D'abord, récupérer les utilisateurs avec leurs infos ET leur grade depuis les tables de membres
    try:
        user_sql = """
            SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.photo, 
                   CONCAT(u.prenom, ' ', u.nom) as nom_prenom,
                   u.member_table, u.member_id
            FROM larodec_users u
            WHERE u.role IN ('chercheur', 'admin+chercheur')
            ORDER BY u.nom, u.prenom
        """
        users = query(user_sql)
        for user in users:
            member_table = user.get('member_table') or ''
            user_cat = TABLE_TO_CAT.get(member_table, 'Corps A')

            # Appliquer le filtre categorie aux utilisateurs aussi
            if categorie and user_cat != categorie:
                continue

            if user.get('member_id') and member_table:
                member_id = user['member_id']
                member_sql = f"""
                    SELECT grade, url_photo 
                    FROM {member_table} 
                    WHERE id = %s
                """
                member_info = query(member_sql, (member_id,), one=True)
                grade = member_info.get('grade', 'Chercheur') if member_info else 'Chercheur'
                has_photo = member_info and member_info.get('url_photo')
            else:
                grade = 'Chercheur'
                member_id = user['id']
                has_photo = False

            results.append({
                'id': member_id,
                'nom_prenom': user['nom_prenom'],
                'grade': grade,
                'categorie': user_cat,
                'table_source': member_table or 'larodec_users',
                'url_photo': '',
                'email': user.get('email', ''),
                'telephone': user.get('telephone', '')
            })
    except Exception as e:
        print(f"[public_researchers] larodec_users: {e}")
    
    # Ensuite, récupérer les membres des tables (SAUF ceux qui ont déjà un compte utilisateur)
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
            # Exclure les membres qui ont déjà un compte utilisateur
            sql = f"""
                SELECT m.id, m.nom_prenom,
                       {grade_col},
                       '{cat}' as categorie,
                       '{table}' as table_source
                       {date_cols}
                FROM {table} m
                WHERE NOT EXISTS (
                    SELECT 1 FROM larodec_users u 
                    WHERE u.member_table = '{table}' AND u.member_id = m.id
                )
                ORDER BY m.nom_prenom
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
                   u.member_table, u.member_id
            FROM larodec_users u
            WHERE LOWER(CONCAT(u.prenom, ' ', u.nom)) = LOWER(%s)
            AND u.role IN ('chercheur', 'admin+chercheur')
            LIMIT 1
        """
        user = query(user_sql, (nom_prenom,), one=True)
        if user:
            # Si l'utilisateur est lié à un membre, récupérer les infos du membre
            if user.get('member_id') and user.get('member_table'):
                member_table = user['member_table']
                member_id = user['member_id']
                
                # Récupérer le grade et la photo depuis la table du membre
                member_sql = f"""
                    SELECT grade, url_photo 
                    FROM {member_table} 
                    WHERE id = %s
                """
                member_info = query(member_sql, (member_id,), one=True)
                
                grade = member_info.get('grade', 'Chercheur') if member_info else 'Chercheur'
            else:
                grade = 'Chercheur'
                member_id = user['id']
            
            return {
                'id': member_id,  # Utiliser member_id pour la photo
                'nom_prenom': user['nom_prenom'],
                'grade': grade,
                'categorie': 'Utilisateur',
                'table_source': user.get('member_table', 'larodec_users'),
                'url_photo': '',
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
    """Get publications for a researcher — no auth required. Searches both articles and larodec_publications."""
    results = []
    nom_upper = nom_prenom.strip().upper()
    
    try:
        # 1. Chercher dans la table articles (publications scrapées)
        rows = query("""
            SELECT titre, auteurs, journal_ou_editeur as journal, annee, doi, url,
                   source_scraping as source, citation_apa, type_publication as type_publication,
                   indexation, NULL as impact_factor
            FROM articles
            WHERE UPPER(TRIM(chercheur_nom)) = %s
            ORDER BY annee DESC
        """, (nom_upper,))
        results.extend(rows or [])
    except Exception as e:
        print(f"[public_researcher_publications] articles: {e}")
    
    try:
        # 2. Chercher dans larodec_publications (publications manuelles validées)
        rows = query("""
            SELECT p.titre, p.auteurs, p.journal, p.annee, p.doi, NULL as url,
                   p.source, NULL as citation_apa, NULL as type_publication,
                   p.indexation, p.impact_factor
            FROM larodec_publications p
            LEFT JOIN larodec_users u ON p.chercheur_id = u.id
            WHERE p.statut = 'valide' AND (
                UPPER(TRIM(u.nom || ' ' || u.prenom)) = %s OR
                UPPER(TRIM(CONCAT(u.prenom, ' ', u.nom))) = %s OR
                LOWER(p.auteurs) LIKE LOWER(%s)
            )
            ORDER BY p.annee DESC
        """, (nom_upper, nom_upper, f"%{nom_prenom}%"))
        results.extend(rows or [])
    except Exception as e:
        print(f"[public_researcher_publications] larodec_publications: {e}")
    
    # Dédupliquer par titre
    seen = set()
    unique = []
    for r in results:
        key = (r.get('titre') or '').lower().strip()[:80]
        if key and key not in seen:
            seen.add(key)
            unique.append(r)
    
    return unique


@app.get("/api/public/researcher-photo/{researcher_id}")
def get_researcher_photo(researcher_id: int, table: Optional[str] = None):
    """Get researcher's photo. Pass ?table=enseignants_corps_b to specify table."""
    try:
        import base64
        
        allowed = ["enseignants_corps_a", "enseignants_corps_b", "cadres_post_doc"]
        
        # If table specified, search only there
        if table and table in allowed:
            tables_to_search = [table]
        else:
            tables_to_search = ["enseignants_corps_a", "enseignants_corps_b", "cadres_post_doc"]
        
        row = None
        for t in tables_to_search:
            try:
                r = query(f"SELECT url_photo FROM {t} WHERE id = %s", (researcher_id,), one=True)
                if r and r.get("url_photo"):
                    row = r
                    break
            except Exception:
                continue
        
        if not row or not row.get("url_photo"):
            raise HTTPException(status_code=404, detail="Photo not found")
        
        photo_data = row.get("url_photo")
        
        if isinstance(photo_data, bytes):
            b64_data = base64.b64encode(photo_data).decode('utf-8')
            return {"photo_url": f"data:image/jpeg;base64,{b64_data}"}
        
        if isinstance(photo_data, str):
            if photo_data.startswith('data:'):
                return {"photo_url": photo_data}
            else:
                try:
                    base64.b64decode(photo_data)
                    return {"photo_url": f"data:image/jpeg;base64,{photo_data}"}
                except:
                    return {"photo_url": photo_data}
        
        raise HTTPException(status_code=500, detail="Invalid photo data format")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_researcher_photo] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


# ===============================================================================
# AI — SEMANTIC SEARCH & RECOMMENDATIONS
# ===============================================================================

import math
import re as _re


def _tokenize(text: str) -> list:
    """Simple tokenizer: lowercase, remove accents, split on non-alpha."""
    if not text:
        return []
    text = unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode("ascii").lower()
    return [w for w in _re.split(r"[^a-z0-9]+", text) if len(w) > 2]


def _tfidf_score(query_tokens: list, doc_tokens: list, corpus_df: dict, n_docs: int) -> float:
    """Compute a simple TF-IDF cosine similarity between query and document."""
    if not query_tokens or not doc_tokens:
        return 0.0
    doc_freq: dict = {}
    for t in doc_tokens:
        doc_freq[t] = doc_freq.get(t, 0) + 1
    doc_len = len(doc_tokens)
    score = 0.0
    for t in set(query_tokens):
        tf  = doc_freq.get(t, 0) / doc_len if doc_len else 0
        df  = corpus_df.get(t, 1)
        idf = math.log((n_docs + 1) / (df + 1)) + 1
        score += tf * idf
    return score


# ── Helpers shared by semantic endpoints ──────────────────────────────────────

def _type_sql_condition(type_filter: str | None) -> str:
    if type_filter == "revue":
        return " AND LOWER(a.type_publication) IN ('journal articles','article','review','letter')"
    elif type_filter == "conference":
        return " AND LOWER(a.type_publication) IN ('conference and workshop papers','conference paper','inproceedings')"
    elif type_filter == "workshop":
        return " AND LOWER(a.type_publication) LIKE '%workshop%'"
    elif type_filter == "ouvrage":
        return " AND LOWER(a.type_publication) IN ('book-chapter','book chapter','chapter','parts in books or collections','books and theses','book','editorship')"
    return ""


def _ilike_fallback(query_text: str, type_filter, chercheur, page: int, limit: int) -> dict:
    """Classic ILIKE search used as fallback."""
    type_conditions = _type_sql_condition(type_filter)
    sql = f"""
        SELECT a.id, a.chercheur_nom, a.titre, a.journal_ou_editeur, a.annee,
               a.auteurs, a.doi, a.url, a.source_scraping, a.indexation,
               a.type_publication, a.citation_apa
        FROM articles a
        WHERE 1=1 {type_conditions}
    """
    params: list = []
    if chercheur:
        sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"; params.append(chercheur)
    if query_text:
        sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        kw = f"%{query_text.lower()}%"
        params += [kw, kw, kw]
    sql += " ORDER BY a.annee DESC, a.id DESC LIMIT %s OFFSET %s"
    params += [limit, page * limit]
    rows = query(sql, params)

    count_sql = f"SELECT COUNT(*) as c FROM articles a WHERE 1=1 {type_conditions}"
    count_params: list = []
    if chercheur:
        count_sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"; count_params.append(chercheur)
    if query_text:
        count_sql += " AND (LOWER(a.titre) LIKE %s OR LOWER(a.auteurs) LIKE %s OR LOWER(a.chercheur_nom) LIKE %s)"
        kw = f"%{query_text.lower()}%"
        count_params += [kw, kw, kw]
    total = list(query(count_sql, count_params, one=True).values())[0]
    return {"total": total, "page": page, "results": [dict(r) for r in (rows or [])], "semantic": False}


# ── Public semantic search endpoint (no auth required) ────────────────────────

class PublicSemanticSearchRequest(BaseModel):
    query: str
    type: Optional[str] = None
    chercheur: Optional[str] = None
    page: int = 0
    limit: int = 20


@app.post("/api/public/publications/search-semantic")
def public_semantic_search(body: PublicSemanticSearchRequest):
    """
    Vector-based semantic search over public articles.
    Falls back to ILIKE if sentence-transformers unavailable or query < 3 words.
    """
    query_text = body.query.strip()
    words = query_text.split()

    # Short query or model unavailable → ILIKE fallback
    if len(words) < 3 or not _ST_AVAILABLE:
        return _ilike_fallback(query_text, body.type, body.chercheur, body.page, body.limit)

    try:
        model = _get_embedding_model()
        if model is None:
            return _ilike_fallback(query_text, body.type, body.chercheur, body.page, body.limit)

        q_vec = model.encode(query_text, convert_to_numpy=True)

        type_conditions = _type_sql_condition(body.type)
        sql = f"""
            SELECT a.id, a.chercheur_nom, a.titre, a.journal_ou_editeur, a.annee,
                   a.auteurs, a.doi, a.url, a.source_scraping, a.indexation,
                   a.type_publication, a.citation_apa, a.embedding
            FROM articles a
            WHERE a.embedding IS NOT NULL {type_conditions}
        """
        params: list = []
        if body.chercheur:
            sql += " AND UPPER(TRIM(a.chercheur_nom)) = UPPER(TRIM(%s))"
            params.append(body.chercheur)

        rows = query(sql, params)

        if not rows:
            return _ilike_fallback(query_text, body.type, body.chercheur, body.page, body.limit)

        THRESHOLD = 0.3
        scored = []
        for row in rows:
            try:
                p_vec = _np.array(_json.loads(row["embedding"]), dtype=_np.float32)
                score = _cosine_similarity(q_vec, p_vec)
                if score >= THRESHOLD:
                    r = {k: v for k, v in row.items() if k != "embedding"}
                    r["score"] = round(score, 4)
                    scored.append(r)
            except Exception:
                continue

        if not scored:
            result = _ilike_fallback(query_text, body.type, body.chercheur, body.page, body.limit)
            result["fallback_message"] = "Aucun résultat sémantique — affichage des résultats textuels"
            return result

        scored.sort(key=lambda x: x["score"], reverse=True)
        total = len(scored)
        start = body.page * body.limit
        page_results = scored[start: start + body.limit]

        return {"total": total, "page": body.page, "results": page_results, "semantic": True}

    except Exception as e:
        _logging.warning(f"[semantic search] error: {e}")
        return _ilike_fallback(query_text, body.type, body.chercheur, body.page, body.limit)


# ── Admin: generate embeddings for all publications ───────────────────────────

@app.post("/api/admin/publications/generate-embeddings")
def generate_embeddings(_: dict = Depends(require_admin)):
    """Generate and store embeddings for all articles that don't have one yet."""
    if not _ST_AVAILABLE:
        raise HTTPException(status_code=503, detail="sentence-transformers non installé")

    rows = query("""
        SELECT id, titre, auteurs FROM articles
        WHERE embedding IS NULL AND titre IS NOT NULL AND titre <> ''
    """)
    if not rows:
        return {"generated": 0, "message": "Tous les embeddings sont déjà générés"}

    model = _get_embedding_model()
    texts = [_pub_text(dict(r)) for r in rows]
    ids   = [r["id"] for r in rows]

    try:
        vecs = model.encode(texts, batch_size=64, show_progress_bar=False, convert_to_numpy=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'encodage: {e}")

    conn = get_conn()
    cur  = conn.cursor()
    count = 0
    for article_id, vec in zip(ids, vecs):
        try:
            cur.execute("UPDATE articles SET embedding = %s WHERE id = %s",
                        (_json.dumps(vec.tolist()), article_id))
            count += 1
        except Exception:
            pass
    conn.commit()
    conn.close()

    return {"generated": count, "message": f"{count} embeddings générés avec succès"}


# ── Internal helper: auto-generate embedding after article insert/update ──────

def _auto_embed(article_id: int):
    """Called after any article create/update to keep embeddings fresh."""
    if not _ST_AVAILABLE:
        return
    try:
        row = query("SELECT id, titre, auteurs FROM articles WHERE id = %s", (article_id,), one=True)
        if row:
            _generate_embedding_for_pub(dict(row))
    except Exception as e:
        _logging.warning(f"[auto_embed] id={article_id}: {e}")


# ── Legacy authenticated semantic search (kept for backward compat) ───────────

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10
    chercheur: Optional[str] = None


class AIRecommendationRequest(BaseModel):
    chercheur: str
    publications: List[dict] = []


@app.post("/api/ai/semantic-search")
def semantic_search(body: SemanticSearchRequest, user: dict = Depends(get_current_user)):
    """
    Semantic search over the articles table using TF-IDF scoring.
    Falls back to keyword search if no results above threshold.
    """
    query_text = body.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Requête vide")

    query_tokens = _tokenize(query_text)

    sql = """
        SELECT id, titre, auteurs, journal_ou_editeur, annee, doi, url,
               source_scraping, indexation, type_publication, chercheur_nom
        FROM articles
        WHERE titre IS NOT NULL AND titre <> ''
        ORDER BY annee DESC
        LIMIT 2000
    """
    params: list = []
    if body.chercheur:
        sql = sql.replace("WHERE titre IS NOT NULL AND titre <> ''",
                          "WHERE titre IS NOT NULL AND titre <> '' AND UPPER(TRIM(chercheur_nom)) = UPPER(TRIM(%s))")
        params.append(body.chercheur)

    rows = query(sql, params)
    if not rows:
        return {"results": [], "total": 0}

    corpus_df: dict = {}
    docs = []
    for row in rows:
        tokens = _tokenize((row.get("titre") or "") + " " + (row.get("auteurs") or "") + " " + (row.get("journal_ou_editeur") or ""))
        docs.append(tokens)
        for t in set(tokens):
            corpus_df[t] = corpus_df.get(t, 0) + 1

    n_docs = len(docs)
    scored = []
    for i, (row, doc_tokens) in enumerate(zip(rows, docs)):
        score = _tfidf_score(query_tokens, doc_tokens, corpus_df, n_docs)
        if score > 0:
            scored.append((score, dict(row)))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:body.limit]
    max_score = top[0][0] if top else 1.0
    results = []
    for score, row in top:
        row["score"] = round(score / max_score, 3) if max_score > 0 else 0
        results.append(row)

    if not results:
        like_sql = """
            SELECT id, titre, auteurs, journal_ou_editeur, annee, doi, url,
                   source_scraping, indexation, type_publication, chercheur_nom
            FROM articles
            WHERE LOWER(titre) LIKE %s OR LOWER(auteurs) LIKE %s
            ORDER BY annee DESC
            LIMIT %s
        """
        kw = f"%{query_text.lower()}%"
        fallback = query(like_sql, (kw, kw, body.limit))
        results = [dict(r) | {"score": 0.5} for r in (fallback or [])]

    return {"results": results, "total": len(results)}


@app.post("/api/ai/recommendations")
def ai_recommendations(body: AIRecommendationRequest, user: dict = Depends(get_current_user)):
    """
    Generate AI-powered publication recommendations based on researcher's profile.
    Uses TF-IDF keyword extraction + similarity matching against lab publications.
    """
    chercheur = body.chercheur.strip()
    my_pubs   = body.publications  # list of dicts from frontend

    if not my_pubs:
        # Load from DB if not provided
        rows = query("""
            SELECT titre, auteurs, journal_ou_editeur, annee, doi, url
            FROM articles
            WHERE UPPER(TRIM(chercheur_nom)) = UPPER(TRIM(%s))
            ORDER BY annee DESC LIMIT 50
        """, (chercheur,))
        my_pubs = [dict(r) for r in (rows or [])]

    if not my_pubs:
        return {"recommendations": [], "summary": "Aucune publication trouvée pour générer des recommandations."}

    # Build researcher profile tokens
    profile_text = " ".join(
        (p.get("titre") or "") + " " + (p.get("journal_ou_editeur") or "")
        for p in my_pubs
    )
    profile_tokens = _tokenize(profile_text)

    # Keyword frequency for profile summary
    kw_freq: dict = {}
    stopwords = {"the","of","a","an","and","in","for","on","with","to","is","are",
                 "based","using","via","approach","method","new","novel","towards",
                 "de","du","des","le","la","les","un","une","et","en","pour","par"}
    for t in profile_tokens:
        if t not in stopwords and len(t) > 3:
            kw_freq[t] = kw_freq.get(t, 0) + 1
    top_kws = sorted(kw_freq.items(), key=lambda x: x[1], reverse=True)[:8]
    summary = (
        f"Votre profil de recherche couvre principalement : "
        + ", ".join(kw for kw, _ in top_kws)
        + f". Basé sur {len(my_pubs)} publications analysées."
    ) if top_kws else "Profil en cours de construction."

    # Find similar publications from other researchers in the lab
    other_pubs = query("""
        SELECT id, titre, auteurs, journal_ou_editeur, annee, doi, url, chercheur_nom
        FROM articles
        WHERE UPPER(TRIM(chercheur_nom)) != UPPER(TRIM(%s))
          AND titre IS NOT NULL AND titre <> ''
        ORDER BY annee DESC
        LIMIT 1000
    """, (chercheur,))

    if not other_pubs:
        return {"recommendations": [], "summary": summary}

    # Build corpus DF
    corpus_df: dict = {}
    docs = []
    for row in other_pubs:
        tokens = _tokenize((row.get("titre") or "") + " " + (row.get("journal_ou_editeur") or ""))
        docs.append(tokens)
        for t in set(tokens):
            corpus_df[t] = corpus_df.get(t, 0) + 1

    n_docs = len(docs)

    # Score each candidate against researcher profile
    scored = []
    for i, (row, doc_tokens) in enumerate(zip(other_pubs, docs)):
        score = _tfidf_score(profile_tokens, doc_tokens, corpus_df, n_docs)
        if score > 0:
            scored.append((score, dict(row)))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:10]
    max_score = top[0][0] if top else 1.0

    recommendations = []
    for score, row in top:
        norm_score = round(score / max_score, 3) if max_score > 0 else 0
        # Generate a reason based on shared keywords
        doc_tokens = _tokenize((row.get("titre") or "") + " " + (row.get("journal_ou_editeur") or ""))
        shared = [t for t in set(profile_tokens) & set(doc_tokens) if t not in stopwords and len(t) > 3][:3]
        raison = (
            f"Thématique similaire à vos travaux ({', '.join(shared)})" if shared
            else "Domaine de recherche connexe au vôtre"
        )
        recommendations.append({
            "titre"  : row.get("titre", ""),
            "auteurs": row.get("auteurs", ""),
            "annee"  : row.get("annee"),
            "journal": row.get("journal_ou_editeur", ""),
            "doi"    : row.get("doi", ""),
            "url"    : row.get("url", ""),
            "raison" : raison,
            "score"  : norm_score,
        })

    return {"recommendations": recommendations, "summary": summary}


@app.get("/api/ai/keywords/{chercheur_nom}")
def get_researcher_keywords(chercheur_nom: str, _: dict = Depends(get_current_user)):
    """Extract top keywords from a researcher's publications."""
    rows = query("""
        SELECT titre, journal_ou_editeur
        FROM articles
        WHERE UPPER(TRIM(chercheur_nom)) = UPPER(TRIM(%s))
        LIMIT 100
    """, (chercheur_nom.upper(),))

    if not rows:
        return {"keywords": []}

    stopwords = {"the","of","a","an","and","in","for","on","with","to","is","are",
                 "based","using","via","approach","method","new","novel","towards",
                 "de","du","des","le","la","les","un","une","et","en","pour","par"}
    freq: dict = {}
    for row in rows:
        tokens = _tokenize((row.get("titre") or "") + " " + (row.get("journal_ou_editeur") or ""))
        for t in tokens:
            if t not in stopwords and len(t) > 3:
                freq[t] = freq.get(t, 0) + 1

    top = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:20]
    return {"keywords": [{"word": w, "count": c} for w, c in top]}


# ── AI Suggestions endpoint ────────────────────────────────────────────────────

class AISuggestionsRequest(BaseModel):
    chercheur: str
    publications: List[dict] = []


@app.post("/api/ai/suggestions")
def ai_suggestions(body: AISuggestionsRequest, user: dict = Depends(get_current_user)):
    """
    Generate personalised suggestions (conferences, journals, collaborators)
    based on the researcher's publication keywords.
    Uses local TF-IDF logic — no external AI call required.
    """
    chercheur = body.chercheur.strip()
    my_pubs   = body.publications

    if not my_pubs:
        rows = query("""
            SELECT titre, journal_ou_editeur, type_publication
            FROM articles
            WHERE UPPER(TRIM(chercheur_nom)) = UPPER(TRIM(%s))
            ORDER BY annee DESC LIMIT 50
        """, (chercheur,))
        my_pubs = [dict(r) for r in (rows or [])]

    if not my_pubs:
        return {"conferences": [], "journals": [], "collaborators": []}

    # Extract top keywords from researcher's publications
    stopwords = {"the","of","a","an","and","in","for","on","with","to","is","are",
                 "based","using","via","approach","method","new","novel","towards",
                 "de","du","des","le","la","les","un","une","et","en","pour","par","sur"}
    freq: dict = {}
    for p in my_pubs:
        tokens = _tokenize((p.get("titre") or "") + " " + (p.get("journal_ou_editeur") or ""))
        for t in tokens:
            if t not in stopwords and len(t) > 3:
                freq[t] = freq.get(t, 0) + 1

    top_kws = [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:10]]

    # ── Conferences (static knowledge base keyed by domain keywords) ──────────
    CONF_DB = [
        {"name": "ENASE – Evaluation of Novel Approaches to Software Engineering",
         "url": "https://enase.scitevents.org", "deadline": "Novembre",
         "keywords": ["software","engineering","quality","metrics","security","ontology"]},
        {"name": "ICSEA – International Conference on Software Engineering Advances",
         "url": "https://www.iaria.org/conferences/ICSEA.html", "deadline": "Octobre",
         "keywords": ["software","engineering","agile","project","management","testing"]},
        {"name": "IEEE S&P – Symposium on Security and Privacy",
         "url": "https://www.ieee-security.org/TC/SP2025/", "deadline": "Septembre",
         "keywords": ["security","privacy","cryptography","risk","vulnerability","cyber"]},
        {"name": "ICPM – International Conference on Process Mining",
         "url": "https://icpmconference.org", "deadline": "Juin",
         "keywords": ["process","mining","workflow","data","analytics","business"]},
        {"name": "IJCAI – International Joint Conference on AI",
         "url": "https://www.ijcai.org", "deadline": "Janvier",
         "keywords": ["intelligence","learning","machine","neural","classification","reasoning"]},
        {"name": "CAISE – Conference on Advanced Information Systems Engineering",
         "url": "https://caise.info", "deadline": "Décembre",
         "keywords": ["information","systems","modeling","requirements","enterprise","data"]},
        {"name": "RDAAPS – Reconciling Data Analytics, Automation, Privacy and Security",
         "url": "https://rdaaps.ieee.org", "deadline": "Mars",
         "keywords": ["data","analytics","privacy","security","automation","cloud"]},
        {"name": "ICCA – International Computing Conference in Arabic",
         "url": "https://icca.info", "deadline": "Septembre",
         "keywords": ["arabic","computing","nlp","language","information","systems"]},
    ]

    # ── Journals ──────────────────────────────────────────────────────────────
    JOURNAL_DB = [
        {"name": "Knowledge and Information Systems", "publisher": "Springer",
         "url": "https://link.springer.com/journal/10115",
         "keywords": ["knowledge","information","systems","ontology","mining","data"]},
        {"name": "International Journal of Information Security", "publisher": "Springer",
         "url": "https://link.springer.com/journal/10207",
         "keywords": ["security","privacy","risk","cryptography","vulnerability","cyber"]},
        {"name": "Journal of Systems and Software", "publisher": "Elsevier",
         "url": "https://www.sciencedirect.com/journal/journal-of-systems-and-software",
         "keywords": ["software","systems","engineering","testing","quality","metrics"]},
        {"name": "Information and Software Technology", "publisher": "Elsevier",
         "url": "https://www.sciencedirect.com/journal/information-and-software-technology",
         "keywords": ["software","technology","agile","project","management","process"]},
        {"name": "IEEE Transactions on Software Engineering", "publisher": "IEEE",
         "url": "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=32",
         "keywords": ["software","engineering","reliability","testing","formal","verification"]},
        {"name": "Computers & Security", "publisher": "Elsevier",
         "url": "https://www.sciencedirect.com/journal/computers-and-security",
         "keywords": ["security","intrusion","detection","malware","network","cyber"]},
        {"name": "International Journal of Project Organisation and Management", "publisher": "Inderscience",
         "url": "https://www.inderscience.com/jhome.php?jcode=ijpom",
         "keywords": ["project","management","organisation","risk","decision","planning"]},
        {"name": "Scientific Programming", "publisher": "Hindawi/Wiley",
         "url": "https://www.hindawi.com/journals/sp/",
         "keywords": ["programming","software","redundancy","metrics","reliability","defect"]},
    ]

    def score_item(item_keywords: list) -> float:
        return sum(1 for kw in top_kws if any(kw in ik for ik in item_keywords))

    # Score and pick top conferences
    conf_scored = sorted(CONF_DB, key=lambda c: score_item(c["keywords"]), reverse=True)
    conferences = []
    for c in conf_scored[:4]:
        matched = [kw for kw in top_kws if any(kw in ik for ik in c["keywords"])][:3]
        reason  = f"Parce que vous publiez sur : {', '.join(matched)}" if matched else "Domaine connexe à vos travaux"
        conferences.append({"name": c["name"], "url": c["url"], "reason": reason, "deadline": c.get("deadline","")})

    # Score and pick top journals
    jour_scored = sorted(JOURNAL_DB, key=lambda j: score_item(j["keywords"]), reverse=True)
    journals = []
    for j in jour_scored[:4]:
        matched = [kw for kw in top_kws if any(kw in ik for ik in j["keywords"])][:3]
        reason  = f"Parce que vous publiez sur : {', '.join(matched)}" if matched else "Revue indexée dans votre domaine"
        journals.append({"name": j["name"], "publisher": j["publisher"], "url": j["url"], "reason": reason})

    # ── Collaborators: other LARODEC researchers with similar keywords ────────
    other_researchers = query("""
        SELECT DISTINCT a.chercheur_nom,
               STRING_AGG(a.titre, ' ') as all_titles
        FROM articles a
        WHERE UPPER(TRIM(a.chercheur_nom)) != UPPER(TRIM(%s))
          AND a.titre IS NOT NULL
        GROUP BY a.chercheur_nom
        HAVING COUNT(a.id) >= 2
        LIMIT 50
    """, (chercheur,))

    collaborators = []
    for r in (other_researchers or []):
        r_tokens = _tokenize(r.get("all_titles") or "")
        r_freq: dict = {}
        for t in r_tokens:
            if t not in stopwords and len(t) > 3:
                r_freq[t] = r_freq.get(t, 0) + 1
        r_kws   = {w for w, _ in sorted(r_freq.items(), key=lambda x: x[1], reverse=True)[:15]}
        common  = [kw for kw in top_kws if kw in r_kws]
        if len(common) >= 2:
            collaborators.append({
                "name": r["chercheur_nom"],
                "commonThemes": common[:5],
            })

    collaborators.sort(key=lambda x: len(x["commonThemes"]), reverse=True)

    return {
        "conferences":   conferences,
        "journals":      journals,
        "collaborators": collaborators[:6],
    }
