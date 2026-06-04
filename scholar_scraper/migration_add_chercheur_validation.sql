-- Migration: Add chercheur validation columns to articles table
-- Date: 2026-06-02
-- Purpose: Allow chercheurs to confirm/reject publications assigned to them

ALTER TABLE articles ADD COLUMN IF NOT EXISTS validee_chercheur BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS rejetee_chercheur BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'en_attente';

-- Create index for filtering by validation status
CREATE INDEX IF NOT EXISTS idx_articles_validee ON articles(validee_chercheur);
CREATE INDEX IF NOT EXISTS idx_articles_rejetee ON articles(rejetee_chercheur);
CREATE INDEX IF NOT EXISTS idx_articles_statut ON articles(statut);

-- Update existing records to have consistent statut
UPDATE articles SET statut = 'en_attente' WHERE statut IS NULL;

COMMENT ON COLUMN articles.validee_chercheur IS 'TRUE if the chercheur confirmed this publication belongs to them';
COMMENT ON COLUMN articles.rejetee_chercheur IS 'TRUE if the chercheur rejected this publication as not theirs';
COMMENT ON COLUMN articles.statut IS 'Status: en_attente, valide, rejete';
