# Dossier des Photos des Chercheurs

Ce dossier contient les photos des chercheurs du laboratoire LARODEC.

## Comment ajouter les photos

### Format de nommage des fichiers

Nommez vos fichiers photos selon ce format:

```
prenom_nom.jpg
```

**Exemples:**
- `latifa_ben_arfa_rabai.jpg`
- `rim_faiz.jpg`
- `zied_elouedi.jpg`
- `olfa_harrabi.jpg`

### Formats acceptés

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

### Étapes pour importer les photos

**IMPORTANT: Première fois seulement**

1. **Configurez les colonnes de photos dans la base de données:**

   ```bash
   python setup_photo_columns.py
   ```

   Cela ajoutera les colonnes `url_photo` aux tables `enseignants_corps_a` et `enseignants_corps_b`.

2. **Placez vos fichiers photos dans ce dossier** (`scholar_scraper/photos/`)

3. **Exécutez le script d'import:**

   Pour les Corps A:
   ```bash
   python import_photos_to_members.py batch ./photos/ a
   ```

   Pour les Corps B:
   ```bash
   python import_photos_to_members.py batch ./photos/ b
   ```

4. **Vérifiez les résultats** - Le script affichera le nombre de photos importées

### Ajouter une photo individuellement

Si vous voulez ajouter une seule photo:

```bash
python import_photos_to_members.py add "Ben Arfa Rabai" "Latifa" ./photos/latifa_ben_arfa_rabai.jpg a
```

### Lister les chercheurs sans photo

Pour voir qui n'a pas encore de photo:

```bash
python import_photos_to_members.py list a
```

ou pour Corps B:

```bash
python import_photos_to_members.py list b
```

## Notes importantes

- Les noms doivent correspondre exactement à ceux dans la base de données
- La recherche n'est pas sensible à la casse (majuscules/minuscules)
- Les accents sont importants (é, è, ê, etc.)
- Les photos sont stockées directement dans la base de données en format binaire

## Exemple de structure

```
scholar_scraper/
├── photos/
│   ├── latifa_ben_arfa_rabai.jpg
│   ├── rim_faiz.jpg
│   ├── zied_elouedi.jpg
│   ├── olfa_harrabi.jpg
│   └── README.md (ce fichier)
├── import_photos_to_members.py
└── ...
```

## Besoin d'aide?

Si vous avez des erreurs, vérifiez:
1. Le format du nom du fichier
2. Que le chercheur existe dans la base de données
3. Que le fichier image est valide
4. Que vous utilisez le bon corps (a ou b)
