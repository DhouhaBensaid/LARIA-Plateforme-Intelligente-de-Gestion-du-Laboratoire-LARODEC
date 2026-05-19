-- =============================================================
-- Nettoyage des doublons dans la table articles
-- Stratégie : garder le MIN(id) pour chaque groupe de doublons
-- =============================================================

BEGIN;

-- 1. Doublons par DOI (même article, même DOI)
DELETE FROM articles
WHERE doi IS NOT NULL AND doi <> ''
  AND id NOT IN (
    SELECT MIN(id)
    FROM articles
    WHERE doi IS NOT NULL AND doi <> ''
    GROUP BY doi
  );

-- 2. Doublons par (chercheur_nom + titre) pour les articles sans DOI
DELETE FROM articles
WHERE (doi IS NULL OR doi = '')
  AND id NOT IN (
    SELECT MIN(id)
    FROM articles
    WHERE doi IS NULL OR doi = ''
    GROUP BY chercheur_nom, LOWER(TRIM(titre))
  );

-- 3. Résumé après nettoyage
SELECT
    'Total articles'          AS info, COUNT(*)::text AS valeur FROM articles
UNION ALL
SELECT
    'Articles avec DOI'       AS info, COUNT(*)::text FROM articles WHERE doi IS NOT NULL AND doi <> ''
UNION ALL
SELECT
    'Articles sans DOI'       AS info, COUNT(*)::text FROM articles WHERE doi IS NULL OR doi = ''
UNION ALL
SELECT
    'Chercheurs distincts'    AS info, COUNT(DISTINCT chercheur_nom)::text FROM articles;

COMMIT;
