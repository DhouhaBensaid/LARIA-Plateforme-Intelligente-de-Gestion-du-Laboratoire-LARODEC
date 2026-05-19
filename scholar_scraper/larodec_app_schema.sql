-- =============================================================
-- LARODEC APP TABLES (portal users, publications, events)
-- Run AFTER larodec_schema.sql
-- =============================================================

-- Users (portal accounts — separate from researcher registry)
CREATE TABLE IF NOT EXISTS larodec_users (
    id            SERIAL PRIMARY KEY,
    email         TEXT    NOT NULL UNIQUE,
    password      TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'chercheur',
    nom           TEXT    NOT NULL DEFAULT '',
    prenom        TEXT    NOT NULL DEFAULT '',
    cin           TEXT    NOT NULL DEFAULT '',
    etablissement TEXT    NOT NULL DEFAULT '',
    universite    TEXT    NOT NULL DEFAULT '',
    grade         TEXT    NOT NULL DEFAULT '',
    telephone     TEXT    DEFAULT NULL,
    photo         BYTEA   DEFAULT NULL,
    photo_filename TEXT   DEFAULT NULL,
    google_scholar_url TEXT DEFAULT NULL,
    orcid         TEXT    DEFAULT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Publications (managed via portal)
CREATE TABLE IF NOT EXISTS larodec_publications (
    id            SERIAL PRIMARY KEY,
    titre         TEXT    NOT NULL,
    journal       TEXT    NOT NULL DEFAULT '',
    annee         INT     NOT NULL DEFAULT 0,
    indexation    TEXT    NOT NULL DEFAULT '',
    auteurs       TEXT    NOT NULL DEFAULT '',
    impact_factor REAL    NOT NULL DEFAULT 0,
    chercheur_id  INT     REFERENCES larodec_users(id) ON DELETE SET NULL,
    statut        TEXT    NOT NULL DEFAULT 'en_attente',
    doi           TEXT    DEFAULT NULL,
    source        TEXT    NOT NULL DEFAULT 'manuel',
    abstract      TEXT    DEFAULT NULL,
    citations     INT     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_larodec_pub_doi
    ON larodec_publications(doi) WHERE doi IS NOT NULL AND doi <> '';

-- Événements
CREATE TABLE IF NOT EXISTS larodec_evenements (
    id          SERIAL PRIMARY KEY,
    titre       TEXT    NOT NULL,
    type        TEXT    NOT NULL DEFAULT 'Séminaire',
    date        TEXT    NOT NULL DEFAULT '',
    lieu        TEXT    NOT NULL DEFAULT '',
    description TEXT    NOT NULL DEFAULT '',
    statut      TEXT    NOT NULL DEFAULT 'en_attente',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Thèses
CREATE TABLE IF NOT EXISTS larodec_theses (
    id           SERIAL PRIMARY KEY,
    titre        TEXT    NOT NULL,
    etudiant     TEXT    NOT NULL DEFAULT '',
    type         TEXT    NOT NULL DEFAULT 'Thèse',
    annee        INT     NOT NULL DEFAULT 0,
    statut       TEXT    NOT NULL DEFAULT 'En cours',
    directeur_id INT     REFERENCES larodec_users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Conventions
CREATE TABLE IF NOT EXISTS larodec_conventions (
    id          SERIAL PRIMARY KEY,
    titre       TEXT    NOT NULL,
    partenaire  TEXT    NOT NULL DEFAULT '',
    date_debut  TEXT    NOT NULL DEFAULT '',
    date_fin    TEXT    NOT NULL DEFAULT '',
    type        TEXT    NOT NULL DEFAULT 'Recherche',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS larodec_audit (
    id         SERIAL PRIMARY KEY,
    user_id    INT     REFERENCES larodec_users(id),
    action     TEXT    NOT NULL,
    entity     TEXT    NOT NULL,
    entity_id  INT,
    detail     TEXT    DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user (password: admin123)
-- Hash generated with: python -c "import bcrypt; print(bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode())"
-- Run this after installing requirements: pip install bcrypt
-- Then update the hash below with the output
INSERT INTO larodec_users (email, password, role, nom, prenom, cin, etablissement, universite, grade)
VALUES (
    'admin@larodec.tn',
    'REPLACE_WITH_BCRYPT_HASH',
    'admin', 'LARODEC', 'Admin', '00000000', 'ISG Tunis', 'Université de Tunis', 'Professeur'
) ON CONFLICT (email) DO NOTHING;
