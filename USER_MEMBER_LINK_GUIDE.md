# 🔗 Guide: Lier les Utilisateurs aux Membres

## 📋 Problème

Vous avez deux types de données:
1. **Utilisateurs** (`larodec_users`) - Comptes pour se connecter au portail
2. **Membres** (`enseignants_corps_a`, `enseignants_corps_b`, etc.) - Base de données des chercheurs

**Exemples:**
- **Latifa Ben Arfa Rabai** a un compte utilisateur ET un enregistrement dans `enseignants_corps_a`
- **Rim Faiz** a un compte utilisateur ET un enregistrement dans `enseignants_corps_a`
- **Dhouha Bensaid** a SEULEMENT un enregistrement dans `enseignants_corps_a` (pas de compte)

## ✅ Solution

Créer une liaison entre les deux tables pour:
- Afficher la photo du membre sur le profil utilisateur
- Synchroniser les informations (grade, établissement, etc.)
- Permettre aux utilisateurs de gérer leur profil public

## 🚀 Étapes d'Installation

### Étape 1: Configurer les Colonnes de Liaison

```bash
cd scholar_scraper
python setup_user_member_link.py
```

Cela ajoute deux colonnes à `larodec_users`:
- `member_table` - Nom de la table du membre (ex: "enseignants_corps_a")
- `member_id` - ID du membre dans sa table

### Étape 2: Lier les Utilisateurs Existants

```bash
python link_users_to_members.py
```

Le script va:
1. Chercher tous les utilisateurs sans liaison
2. Trouver leur enregistrement dans les tables de membres
3. Créer la liaison automatiquement

**Résultat attendu:**
```
=== Liaison de Latifa BEN ARFA RABAI (latifa.rabai@isg.rnu.tn) ===
  ✅ Membre trouvé dans enseignants_corps_a
     ID: 1
     Nom: LATIFA BEN ARFA RABAI
     Grade: Professeur
  ✅ Liaison créée!

=== Liaison de Rim FAIZ (rim.faiz@ihec.rnu.tn) ===
  ✅ Membre trouvé dans enseignants_corps_a
     ID: 10
     Nom: RIM FAIZ
     Grade: Maître de Conférences
  ✅ Liaison créée!

✅ 2/2 utilisateur(s) lié(s) avec succès
```

### Étape 3: Vérifier les Liaisons

```bash
python link_users_to_members.py list
```

Affiche tous les utilisateurs liés:
```
Utilisateurs liés aux membres
============================================================

👤 Latifa BEN ARFA RABAI (latifa.rabai@isg.rnu.tn)
   → enseignants_corps_a (ID: 1)

👤 Rim FAIZ (rim.faiz@ihec.rnu.tn)
   → enseignants_corps_a (ID: 10)
```

## 🔧 Commandes Utiles

### Lier un utilisateur spécifique

```bash
python link_users_to_members.py link latifa.rabai@isg.rnu.tn
```

### Lier tous les utilisateurs

```bash
python link_users_to_members.py
```

### Afficher les liaisons

```bash
python link_users_to_members.py list
```

## 📊 Comment Ça Marche

### Avant la Liaison

```
larodec_users                    enseignants_corps_a
┌─────────────────┐             ┌──────────────────────┐
│ id: 1           │             │ id: 1                │
│ email: latifa@  │             │ nom_prenom: LATIFA   │
│ nom: BEN ARFA   │             │ grade: Professeur    │
│ prenom: Latifa  │             │ url_photo: [data]    │
│ photo: NULL     │             └──────────────────────┘
└─────────────────┘
     ❌ Pas de lien
```

### Après la Liaison

```
larodec_users                    enseignants_corps_a
┌─────────────────┐             ┌──────────────────────┐
│ id: 1           │────────────>│ id: 1                │
│ email: latifa@  │ member_id=1 │ nom_prenom: LATIFA   │
│ nom: BEN ARFA   │ table=corps_a│ grade: Professeur   │
│ prenom: Latifa  │             │ url_photo: [data]    │
│ member_table: ──┘             └──────────────────────┘
│ member_id: 1    │
└─────────────────┘
     ✅ Lié!
```

## 🎯 Avantages

1. **Photos Unifiées**: La photo du membre s'affiche sur le profil utilisateur
2. **Synchronisation**: Les infos (grade, établissement) sont synchronisées
3. **Gestion Simplifiée**: Un seul endroit pour gérer les données
4. **Flexibilité**: Les membres sans compte restent visibles dans l'annuaire

## 📝 Inscription de Nouveaux Utilisateurs

Quand un nouveau chercheur s'inscrit:

1. **Il crée son compte** avec email, nom, prénom, grade
2. **Le système cherche automatiquement** son enregistrement dans les tables de membres
3. **Si trouvé**: Liaison automatique + récupération de la photo
4. **Si non trouvé**: Création d'un nouvel enregistrement dans la table appropriée selon le grade

### Exemple de Flux d'Inscription

```python
# Lors de l'inscription
user_data = {
    "email": "nouveau@isg.rnu.tn",
    "nom": "NOUVEAU",
    "prenom": "Chercheur",
    "grade": "Maître Assistant"  # → Corps B
}

# 1. Créer le compte utilisateur
user_id = create_user(user_data)

# 2. Chercher dans les tables de membres
member = find_member(user_data["nom"], user_data["prenom"])

if member:
    # 3a. Lier au membre existant
    link_user_to_member(user_id, member["table"], member["id"])
else:
    # 3b. Créer un nouvel enregistrement
    table = get_table_by_grade(user_data["grade"])  # "enseignants_corps_b"
    member_id = create_member(table, user_data)
    link_user_to_member(user_id, table, member_id)
```

## 🔍 Dépannage

### Erreur: "Membre non trouvé"

**Cause**: Le nom dans `larodec_users` ne correspond pas exactement au nom dans les tables de membres

**Solution**: Vérifiez les noms:
```bash
# Dans larodec_users
SELECT nom, prenom FROM larodec_users WHERE email = 'email@example.com';

# Dans enseignants_corps_a
SELECT nom_prenom FROM enseignants_corps_a;
```

Ajustez les noms pour qu'ils correspondent exactement.

### Liaison Manuelle

Si le script automatique ne trouve pas le membre:

```sql
-- Trouver l'ID du membre
SELECT id, nom_prenom FROM enseignants_corps_a WHERE nom_prenom LIKE '%NOM%';

-- Lier manuellement
UPDATE larodec_users 
SET member_table = 'enseignants_corps_a', member_id = 1
WHERE email = 'email@example.com';
```

## 📁 Fichiers Créés

- ✅ `setup_user_member_link.py` - Configure les colonnes
- ✅ `link_users_to_members.py` - Lie les utilisateurs
- ✅ `add_member_link_column.sql` - Migration SQL
- ✅ `USER_MEMBER_LINK_GUIDE.md` - Ce guide

## 🎯 Prochaines Étapes

1. ✅ Exécutez `python setup_user_member_link.py`
2. ✅ Exécutez `python link_users_to_members.py`
3. ✅ Vérifiez avec `python link_users_to_members.py list`
4. ✅ Testez l'affichage des photos sur le site

## 💡 Notes Importantes

- Les membres sans compte utilisateur restent visibles dans l'annuaire public
- Les utilisateurs liés peuvent voir et modifier leur profil
- Les photos sont stockées dans les tables de membres, pas dans `larodec_users`
- La liaison est bidirectionnelle: user → member et member → user
