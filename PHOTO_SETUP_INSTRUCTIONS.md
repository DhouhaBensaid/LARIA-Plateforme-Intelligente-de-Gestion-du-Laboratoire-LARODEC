# 📸 Instructions pour Ajouter les Photos des Chercheurs

## ⚡ Résumé du Problème

L'erreur que vous avez reçue ("la colonne « url_photo » n'existe pas") signifie que la base de données n'a pas encore les colonnes nécessaires pour stocker les photos.

## ✅ Solution en 5 Étapes

### Étape 1: Configurer la Base de Données

Exécutez ce script **une seule fois** pour ajouter les colonnes de photos:

```bash
cd scholar_scraper
python setup_photo_columns.py
```

Vous verrez:
```
✅ Colonne url_photo ajoutée à enseignants_corps_a
✅ Colonne url_photo ajoutée à enseignants_corps_b
✅ Configuration terminée!
```

### Étape 2: Préparer les Photos

1. Collectez les photos réelles des chercheurs
2. Placez-les dans: `scholar_scraper/photos/`
3. Nommez-les: `prenom_nom.jpg`

**Exemples:**
- `latifa_ben_arfa_rabai.jpg`
- `rim_faiz.jpg`
- `zied_elouedi.jpg`

### Étape 3: Importer les Photos

Pour Corps A:
```bash
python import_photos_to_members.py batch ./photos/ a
```

Pour Corps B:
```bash
python import_photos_to_members.py batch ./photos/ b
```

### Étape 4: Vérifier

Voir qui a une photo:
```bash
python import_photos_to_members.py list a
```

### Étape 5: Reconstruire le Frontend

```bash
npm run build
```

## 📁 Fichiers Créés

- ✅ `setup_photo_columns.py` - Configure la base de données
- ✅ `add_photo_to_enseignants.sql` - Migration SQL
- ✅ `PHOTO_IMPORT_GUIDE.md` - Guide complet
- ✅ `photos/README.md` - Instructions dans le dossier photos

## 🎯 Prochaines Actions

1. Exécutez: `python setup_photo_columns.py`
2. Ajoutez vos photos dans `scholar_scraper/photos/`
3. Exécutez: `python import_photos_to_members.py batch ./photos/ a`
4. Exécutez: `npm run build`
5. Vérifiez sur: http://localhost:5173/annuaire

## 💡 Important

- Le backend doit être en cours d'exécution: `python -m uvicorn scholar_scraper.api:app --reload --port 3001`
- Les noms des fichiers doivent correspondre aux noms dans la base de données
- Les photos sont stockées en base64 dans la base de données

Consultez `scholar_scraper/PHOTO_IMPORT_GUIDE.md` pour plus de détails.
