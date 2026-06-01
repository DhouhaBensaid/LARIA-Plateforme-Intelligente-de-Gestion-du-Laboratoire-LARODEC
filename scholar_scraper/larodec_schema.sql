-- =============================================================
-- LARODEC DATABASE SCHEMA
-- PostgreSQL | UTF8 | Created 2025
-- =============================================================

-- Create database (run as superuser if needed)
-- CREATE DATABASE larodec_db ENCODING 'UTF8';

-- =============================================================
-- TABLE 1: enseignants_corps_a
-- =============================================================
CREATE TABLE IF NOT EXISTS enseignants_corps_a (
    id            SERIAL PRIMARY KEY,
    grade         VARCHAR(100),
    nom_prenom    VARCHAR(150),
    n_cin         VARCHAR(20) UNIQUE NOT NULL,
    etablissement VARCHAR(200),
    universite    VARCHAR(150),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corps_a_universite ON enseignants_corps_a(universite);

-- =============================================================
-- TABLE 2: enseignants_corps_b
-- =============================================================
CREATE TABLE IF NOT EXISTS enseignants_corps_b (
    id            SERIAL PRIMARY KEY,
    grade         VARCHAR(100),
    nom_prenom    VARCHAR(150),
    n_cin         VARCHAR(20) UNIQUE NOT NULL,
    etablissement VARCHAR(200),
    universite    VARCHAR(150),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corps_b_universite ON enseignants_corps_b(universite);

-- =============================================================
-- TABLE 3: doctorants
-- =============================================================
CREATE TABLE IF NOT EXISTS doctorants (
    id            SERIAL PRIMARY KEY,
    nom_prenom    VARCHAR(150),
    n_cin         VARCHAR(20) UNIQUE NOT NULL,
    etablissement VARCHAR(200),
    universite    VARCHAR(150),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctorants_universite ON doctorants(universite);

-- =============================================================
-- TABLE 4: etudiants_master_recherche
-- =============================================================
CREATE TABLE IF NOT EXISTS etudiants_master_recherche (
    id            SERIAL PRIMARY KEY,
    nom_prenom    VARCHAR(150),
    n_cin         VARCHAR(20) UNIQUE NOT NULL,
    etablissement VARCHAR(200),
    universite    VARCHAR(150),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_universite ON etudiants_master_recherche(universite);

-- =============================================================
-- TABLE 5: cadres_post_doc
-- =============================================================
CREATE TABLE IF NOT EXISTS cadres_post_doc (
    id            SERIAL PRIMARY KEY,
    grade         VARCHAR(100),
    nom_prenom    VARCHAR(150),
    n_cin         VARCHAR(20) UNIQUE NOT NULL,
    etablissement VARCHAR(200),
    universite    VARCHAR(150),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_postdoc_universite ON cadres_post_doc(universite);

-- =============================================================
-- TABLE 6: articles
-- =============================================================
CREATE TABLE IF NOT EXISTS articles (
    id                  SERIAL PRIMARY KEY,
    chercheur_nom       VARCHAR(150) NOT NULL,
    chercheur_table     VARCHAR(50),
    titre               TEXT NOT NULL,
    auteurs             TEXT,
    journal_ou_editeur  VARCHAR(300),
    annee               INT,
    volume              VARCHAR(50),
    numero              VARCHAR(50),
    pages               VARCHAR(50),
    doi                 VARCHAR(200),
    url                 TEXT,
    indexation          VARCHAR(50),
    type_publication    VARCHAR(50),
    citation_apa        TEXT NOT NULL,
    source_scraping     VARCHAR(100),
    scraped_at          TIMESTAMP DEFAULT NOW(),
    created_at          TIMESTAMP DEFAULT NOW(),
    embedding           TEXT  -- JSON-serialized float32 vector (all-MiniLM-L6-v2, dim=384)
);

CREATE INDEX IF NOT EXISTS idx_articles_chercheur ON articles(chercheur_nom);
CREATE INDEX IF NOT EXISTS idx_articles_doi       ON articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_annee     ON articles(annee);
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_doi_unique ON articles(doi) WHERE doi IS NOT NULL AND doi <> '';

-- =============================================================
-- TABLE 7: chercheur_articles (junction)
-- =============================================================
CREATE TABLE IF NOT EXISTS chercheur_articles (
    id              SERIAL PRIMARY KEY,
    article_id      INT REFERENCES articles(id) ON DELETE CASCADE,
    n_cin           VARCHAR(20),
    chercheur_table VARCHAR(50),
    role            VARCHAR(50) DEFAULT 'auteur',
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_article ON chercheur_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_ca_cin     ON chercheur_articles(n_cin);

-- =============================================================
-- VIEW: v_effectifs_larodec
-- =============================================================
CREATE OR REPLACE VIEW v_effectifs_larodec AS
SELECT 'corps_a'    AS categorie, COUNT(*) AS effectif FROM enseignants_corps_a
UNION ALL
SELECT 'corps_b'    AS categorie, COUNT(*) AS effectif FROM enseignants_corps_b
UNION ALL
SELECT 'doctorants' AS categorie, COUNT(*) AS effectif FROM doctorants
UNION ALL
SELECT 'etudiants'  AS categorie, COUNT(*) AS effectif FROM etudiants_master_recherche
UNION ALL
SELECT 'cadres'     AS categorie, COUNT(*) AS effectif FROM cadres_post_doc;

-- =============================================================
-- MIGRATION: add embedding column to existing databases
-- Run once if upgrading from a version without semantic search
-- =============================================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding TEXT;
