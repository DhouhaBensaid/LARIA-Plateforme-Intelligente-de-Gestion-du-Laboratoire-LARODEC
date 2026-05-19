# Gestion Dynamique de l'Admin LARODEC

## Vue d'ensemble

Le système de gestion d'admin permet de changer automatiquement l'administrateur du laboratoire LARODEC lorsque la direction change. L'admin actuel est **Latifa Ben Arfa Rabai**.

## Format du Mot de Passe

Les mots de passe sont générés automatiquement selon le format:

```
larodec + nom + prenom (minuscules, sans espaces)
```

### Exemple
- **Nom**: BEN ARFA RABAI
- **Prénom**: LATIFA
- **Mot de passe généré**: `larodecbenarfaLatifa`

## Utilisation

### 1. Script Python - `manage_admin.py`

Gérer l'admin via la ligne de commande:

```bash
# Voir l'admin actuel
python manage_admin.py --get-admin

# Changer l'admin
python manage_admin.py --set-admin "BEN ARFA RABAI LATIFA"

# Lister tous les chercheurs
python manage_admin.py --list
```

### 2. Script de Seed - `seed_admin.py`

Initialiser la base de données avec l'admin par défaut:

```bash
python seed_admin.py
```

Cela crée:
- **Admin**: Latifa Ben Arfa Rabai (admin@larodec.tn)
- **Chercheur**: Latifa Ben Arfa Rabai (chercheur@larodec.tn)

### 3. API REST

#### Récupérer l'admin actuel
```bash
GET /api/admin/current
Authorization: Bearer <token>
```

Réponse:
```json
{
  "id": 1,
  "email": "admin@larodec.tn",
  "nom": "BEN ARFA RABAI",
  "prenom": "LATIFA",
  "grade": "Professeur"
}
```

#### Changer l'admin
```bash
POST /api/admin/change
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "BEN ARFA RABAI",
  "prenom": "LATIFA",
  "email": "admin@larodec.tn"
}
```

Réponse:
```json
{
  "success": true,
  "message": "Admin changé avec succès!",
  "email": "admin@larodec.tn",
  "password": "larodecbenarfaLatifa",
  "note": "Password contains: larodec + nom + prenom"
}
```

#### Lister les chercheurs disponibles
```bash
GET /api/admin/researchers
Authorization: Bearer <token>
```

### 4. Interface Web - `GestionAdmin.tsx`

Composant React pour gérer l'admin via l'interface web:

- Affiche l'admin actuel
- Permet de sélectionner un nouveau directeur/directrice
- Génère automatiquement le mot de passe
- Affiche le nouveau mot de passe après le changement

## Flux de Changement d'Admin

1. **Sélection**: Choisir un chercheur dans la liste
2. **Génération**: Le mot de passe est généré automatiquement
3. **Mise à jour**: 
   - Tous les autres admins perdent leur rôle
   - Le chercheur sélectionné devient admin
   - Un audit log est créé
4. **Confirmation**: Le nouveau mot de passe est affiché

## Sécurité

- Les mots de passe sont hachés avec bcrypt
- Seuls les admins peuvent changer l'admin
- Chaque changement est enregistré dans l'audit log
- Le format du mot de passe est prévisible mais sécurisé (contient le nom et prénom)

## Données Actuelles

### Admin Actuel
- **Nom**: BEN ARFA RABAI
- **Prénom**: LATIFA
- **Email**: admin@larodec.tn
- **Mot de passe**: larodecbenarfaLatifa
- **Grade**: Professeur

### Chercheurs Disponibles

Voir la liste complète avec:
```bash
python manage_admin.py --list
```

## Intégration avec la Direction

Lorsque la direction du laboratoire change:

1. Identifier le nouveau directeur/directrice
2. Utiliser l'une des méthodes ci-dessus pour changer l'admin
3. Le nouveau mot de passe est généré automatiquement
4. L'ancien admin perd ses droits d'administration

## Troubleshooting

### Erreur de connexion à la base de données
Vérifier les variables d'environnement dans `.env`:
```
DB_HOST=localhost
DB_NAME=larodec_db
DB_USER=postgres
DB_PASSWORD=...
DB_PORT=5432
```

### Mot de passe oublié
Générer un nouveau mot de passe:
```bash
python manage_admin.py --set-admin "NOM PRENOM"
```

### Aucun admin trouvé
Initialiser la base de données:
```bash
python seed_admin.py
```
