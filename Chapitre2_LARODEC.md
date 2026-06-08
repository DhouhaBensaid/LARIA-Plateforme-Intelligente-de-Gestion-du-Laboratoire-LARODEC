# Chapitre 2 – Analyse globale du besoin et préparation du Product Backlog

---

## Introduction

Le présent chapitre constitue le socle analytique et méthodologique sur lequel repose l'ensemble du développement de la plateforme LARODEC. Après avoir présenté dans le chapitre précédent le contexte institutionnel du laboratoire, les enjeux de sa transformation numérique et les objectifs généraux du projet, il convient désormais de procéder à une analyse rigoureuse et structurée des besoins. Cette démarche d'analyse, indissociable de toute approche agile sérieuse, vise à établir une compréhension partagée et documentée entre les parties prenantes avant toute décision de conception ou de développement.

Ce chapitre poursuit trois objectifs complémentaires. En premier lieu, il documente les processus métier existants au sein du laboratoire LARODEC afin d'identifier les dysfonctionnements, les lacunes organisationnelles et les opportunités d'amélioration que la plateforme numérique devra adresser. En second lieu, il formalise l'ensemble des besoins fonctionnels et non fonctionnels, organisés par profil utilisateur, qui guideront la conception du système. Enfin, il produit le Product Backlog préliminaire du projet, structuré selon la hiérarchie agile Thèmes → Epics → Features → User Stories, accompagné d'une priorisation rigoureuse selon la méthode MoSCoW.

Les livrables de ce chapitre — analyse du besoin, backlog structuré et matrice de priorisation — constituent les artefacts de référence pour la planification des sprints et l'organisation des itérations de développement présentées dans les chapitres suivants.

---

## 2.1 – Analyse des processus métier existants

### 2.1.1 – Description des processus actuels

Avant la mise en place de la plateforme numérique LARODEC, les activités scientifiques et administratives du laboratoire reposaient sur des pratiques manuelles, dispersées et peu outillées. L'analyse des processus existants a été conduite à partir d'entretiens avec les membres du laboratoire et de l'observation de leurs pratiques de travail quotidiennes. Sept processus métier critiques ont été identifiés et documentés ci-après.

---

**Processus 1 – Gestion des publications scientifiques**

*État actuel :* Les publications produites par les chercheurs du laboratoire sont consignées dans des fichiers bureautiques individuels (tableaux Excel, documents Word), sans base de données centralisée. Chaque chercheur maintient sa propre liste de publications, sans format standardisé ni système de validation croisée.

*Acteurs impliqués :* Chercheurs (Corps A et B), Doctorants, Direction du laboratoire.

*Limites et problèmes :*
- Absence de référentiel unique : les données sont dispersées sur les postes personnels des chercheurs.
- Risque élevé de doublons, d'incohérences ou de pertes de données lors des changements de poste.
- Impossible d'obtenir une vue consolidée et actualisée des publications du laboratoire en temps réel.
- La génération de rapports annuels nécessite une collecte manuelle longue et fastidieuse.
- Aucun mécanisme de validation ou de contrôle qualité des références bibliographiques.

---

**Processus 2 – Mise à jour du site web institutionnel**

*État actuel :* Le site web du laboratoire, lorsqu'il existe, présente un contenu majoritairement statique, mis à jour de façon ponctuelle et non systématique. L'ajout de nouvelles informations (actualités, publications, membres) nécessite l'intervention d'un responsable technique et ne peut pas être effectué directement par les membres du laboratoire.

*Acteurs impliqués :* Responsable informatique, Direction du laboratoire.

*Limites et problèmes :*
- Décalage permanent entre les informations affichées et la réalité du laboratoire.
- Dépendance à un intermédiaire technique pour toute mise à jour, même mineure.
- Absence d'interface de gestion de contenu accessible aux non-techniciens.
- Manque de visibilité internationale du laboratoire faute de contenu actualisé en anglais.

---

**Processus 3 – Organisation des événements scientifiques**

*État actuel :* La planification et la communication autour des séminaires, conférences et journées scientifiques sont gérées par messagerie électronique, affichage papier et communication orale. Il n'existe pas d'outil dédié à la gestion des événements.

*Acteurs impliqués :* Direction du laboratoire, Secrétariat, Chercheurs, Doctorants.

*Limites et problèmes :*
- Absence de calendrier centralisé et partagé des événements.
- Gestion des inscriptions inexistante ou réalisée manuellement par email.
- Risque de perte d'information pour les membres non présents lors des annonces.
- Impossibilité d'archiver les événements passés de manière consultable.

---

**Processus 4 – Gestion de l'annuaire des membres**

*État actuel :* La liste des membres du laboratoire (53 chercheurs, 32 doctorants) est maintenue dans un document interne non accessible au public, sans mise à jour régulière et sans informations de contact standardisées.

*Acteurs impliqués :* Direction du laboratoire, Secrétariat.

*Limites et problèmes :*
- Aucune visibilité externe sur la composition de l'équipe scientifique.
- Informations souvent incomplètes (absence de photo, de biographie, de liens académiques).
- Pas de lien entre les membres et leurs productions scientifiques (publications, thèses).
- Mise à jour laborieuse lors des arrivées, départs ou changements de statut.

---

**Processus 5 – Veille scientifique**

*État actuel :* Les chercheurs effectuent leur veille bibliographique de manière individuelle, en consultant directement les plateformes académiques (Google Scholar, Semantic Scholar, ResearchGate) sans outil d'agrégation ni de diffusion collective.

*Acteurs impliqués :* Chercheurs, Doctorants.

*Limites et problèmes :*
- Veille non mutualisée : chaque chercheur reduplique un effort qui pourrait être automatisé.
- Absence de filtrage par thématique de recherche propre au laboratoire.
- Pas de système d'alertes ou de notifications sur les nouvelles publications dans les domaines d'intérêt.
- Manque de capitalisation collective sur les tendances scientifiques émergentes.

---

**Processus 6 – Génération des CV et listes de publications**

*État actuel :* La production de CV académiques et de listes de publications à des fins de candidatures, de rapports ou d'évaluations est réalisée manuellement par chaque chercheur, sans modèle standardisé à l'échelle du laboratoire.

*Acteurs impliqués :* Chercheurs, Direction du laboratoire.

*Limites et problèmes :*
- Absence de template officiel LARODEC pour les CV.
- Temps considérable consacré à la mise en forme manuelle des documents.
- Hétérogénéité des formats produits, nuisant à l'image institutionnelle du laboratoire.
- Données dupliquées : chaque chercheur maintient ses informations dans de multiples fichiers.

---

**Processus 7 – Suivi de l'activité scientifique**

*État actuel :* Il n'existe aucun tableau de bord permettant à la direction ou aux chercheurs de visualiser en temps réel les indicateurs d'activité du laboratoire (nombre de publications par année, répartition par type, évolution des citations, etc.).

*Acteurs impliqués :* Direction du laboratoire, Chercheurs.

*Limites et problèmes :*
- Production des rapports d'activité annuels entièrement manuelle.
- Absence de métriques instantanées sur la productivité scientifique.
- Impossibilité d'identifier rapidement les tendances ou les axes sous-représentés.
- Difficulté à répondre aux demandes d'évaluation institutionnelle dans les délais.

---

### 2.1.2 – Tableau de synthèse des dysfonctionnements

**Tableau 2.1 – Synthèse des dysfonctionnements des processus métier existants**

| N° | Processus concerné | Dysfonctionnement principal | Impact | Criticité |
|----|-------------------|----------------------------|--------|-----------|
| D1 | Gestion des publications | Absence de base centralisée, doublons fréquents | Perte de données, rapports inexacts | Haute |
| D2 | Site web institutionnel | Contenu statique, mises à jour rares | Faible visibilité internationale | Haute |
| D3 | Événements scientifiques | Pas d'outil dédié, gestion par email | Perte d'information, faible participation | Moyenne |
| D4 | Annuaire des membres | Liste interne non consultable, incomplète | Aucune visibilité externe sur l'équipe | Haute |
| D5 | Veille scientifique | Veille individuelle non mutualisée | Effort dupliqué, manque d'intelligence collective | Moyenne |
| D6 | Génération des CV | Pas de template standardisé, saisie manuelle | Hétérogénéité, perte de temps | Moyenne |
| D7 | Suivi d'activité | Pas de tableau de bord, rapports manuels | Réactivité faible aux évaluations | Haute |

---

## 2.2 – Identification des besoins fonctionnels

L'analyse des processus existants et les échanges avec les parties prenantes ont permis d'identifier et de formaliser les besoins fonctionnels du système, organisés par profil utilisateur. Ces besoins constituent la base du Product Backlog.

### 2.2.1 – Besoins fonctionnels par profil

**Tableau 2.2 – Besoins fonctionnels du profil Visiteur (public non connecté)**

| ID | Profil | Description du besoin | Priorité |
|----|--------|----------------------|----------|
| BF-V01 | Visiteur | Consulter la présentation générale du laboratoire (historique, missions, axes de recherche) | Haute |
| BF-V02 | Visiteur | Naviguer dans l'annuaire public des membres avec recherche par nom ou axe | Haute |
| BF-V03 | Visiteur | Consulter les publications scientifiques du laboratoire avec filtres par année, type, auteur | Haute |
| BF-V04 | Visiteur | Utiliser la recherche sémantique pour trouver des publications par thématique | Moyenne |
| BF-V05 | Visiteur | Consulter les événements et actualités du laboratoire | Haute |
| BF-V06 | Visiteur | Accéder aux informations de contact et à la liste des partenaires | Moyenne |
| BF-V07 | Visiteur | Consulter la fiche publique d'un chercheur (profil, publications, thèses) | Haute |
| BF-V08 | Visiteur | Naviguer en français et en anglais (interface multilingue) | Haute |

---

**Tableau 2.3 – Besoins fonctionnels du profil Chercheur (membre connecté)**

| ID | Profil | Description du besoin | Priorité |
|----|--------|----------------------|----------|
| BF-C01 | Chercheur | S'authentifier de manière sécurisée sur la plateforme | Haute |
| BF-C02 | Chercheur | Gérer son profil personnel (informations, photo, biographie, liens ORCID/Scholar) | Haute |
| BF-C03 | Chercheur | Déposer manuellement une nouvelle publication (titre, auteurs, venue, DOI, type) | Haute |
| BF-C04 | Chercheur | Importer automatiquement ses publications depuis Google Scholar via scraping | Haute |
| BF-C05 | Chercheur | Suivre le statut de validation de ses publications soumises | Haute |
| BF-C06 | Chercheur | Générer et télécharger son CV académique au format DOCX (template LARODEC) | Haute |
| BF-C07 | Chercheur | Consulter et gérer ses thèses encadrées (titre, étudiant, statut, année) | Moyenne |
| BF-C08 | Chercheur | Consulter le module PulsAR pour la veille scientifique IA hebdomadaire | Haute |
| BF-C09 | Chercheur | Recevoir des recommandations IA de publications basées sur son profil de recherche | Moyenne |
| BF-C10 | Chercheur | S'inscrire à un événement scientifique depuis la plateforme | Moyenne |
| BF-C11 | Chercheur | Consulter un tableau de bord personnel avec ses statistiques de publication | Haute |
| BF-C12 | Chercheur | Modifier et supprimer ses publications enregistrées | Haute |

---

**Tableau 2.4 – Besoins fonctionnels du profil Administrateur**

| ID | Profil | Description du besoin | Priorité |
|----|--------|----------------------|----------|
| BF-A01 | Administrateur | Gérer les comptes membres (création, validation, suspension, suppression) | Haute |
| BF-A02 | Administrateur | Valider ou rejeter les publications soumises par les chercheurs | Haute |
| BF-A03 | Administrateur | Gérer les événements scientifiques (création, modification, publication) | Haute |
| BF-A04 | Administrateur | Consulter les statistiques globales du laboratoire (publications, membres, événements) | Haute |
| BF-A05 | Administrateur | Gérer les actualités et les annonces sur le site public | Moyenne |
| BF-A06 | Administrateur | Configurer les paramètres généraux de la plateforme | Faible |
| BF-A07 | Administrateur | Exporter les données du laboratoire (rapport d'activité, liste publications) | Moyenne |
| BF-A08 | Administrateur | Attribuer et modifier les rôles et permissions des membres | Haute |

---

## 2.3 – Identification des contraintes organisationnelles et réglementaires

### 2.3.1 – Contraintes organisationnelles

Le développement et le déploiement de la plateforme LARODEC s'inscrivent dans un cadre institutionnel qui impose plusieurs contraintes organisationnelles auxquelles le système doit se conformer.

**Hiérarchie académique :** Le laboratoire est structuré selon une organisation pyramidale comprenant la direction (Pr. Latifa Ben Arfa Rabai), les professeurs (Corps A), les maîtres assistants (Corps B), les post-doctorants, les doctorants et les membres associés. Le système doit refléter cette hiérarchie dans ses niveaux d'accès et de permission, sans pour autant créer de barrières inutiles à la collaboration scientifique.

**Multilinguisme :** Le laboratoire opère dans un environnement bilingue (français/anglais). L'interface de la plateforme doit être intégralement disponible dans les deux langues, avec une commutation fluide et sans rechargement de page. Les métadonnées scientifiques (titres de publications, résumés) peuvent être dans l'une ou l'autre langue selon les publications.

**Accessibilité multi-appareils :** Les chercheurs accèdent à la plateforme depuis des environnements hétérogènes (ordinateurs de bureau au laboratoire, ordinateurs portables personnels, tablettes et smartphones). La plateforme doit adopter une conception responsive garantissant une expérience utilisateur cohérente sur tous les formats d'écran.

**Disponibilité continue :** Le site public doit être accessible en permanence (24h/24, 7j/7), étant donné que les visiteurs et les partenaires internationaux se connectent depuis des fuseaux horaires différents. L'espace membre peut tolérer des fenêtres de maintenance planifiées, à condition que celles-ci soient communiquées aux utilisateurs.

### 2.3.2 – Contraintes techniques

**Compatibilité navigateurs :** La plateforme doit fonctionner de manière optimale sur les versions récentes des principaux navigateurs : Google Chrome, Mozilla Firefox, Microsoft Edge et Safari. Aucune dépendance à des plugins ou technologies propriétaires n'est admise.

**Performance :** Le temps de chargement des pages principales ne doit pas dépasser 3 secondes sur une connexion standard (20 Mbps). Les requêtes aux APIs d'intelligence artificielle peuvent disposer de délais de tolérance plus élevés, à condition d'afficher un indicateur de chargement explicite.

**Sécurité des données :** Les données personnelles des membres (informations de profil, coordonnées, mots de passe) doivent être protégées par des mécanismes de chiffrement appropriés. L'authentification doit reposer sur des tokens JWT avec des durées de validité limitées et un mécanisme de rafraîchissement sécurisé.

**Intégration APIs externes :** La plateforme intègre plusieurs services tiers — Semantic Scholar, ArXiv, Hugging Face et l'API Claude d'Anthropic — dont les limites de taux de requêtes (rate limits) doivent être respectées. Un mécanisme de mise en cache doit être prévu pour limiter les appels redondants.

### 2.3.3 – Contraintes réglementaires

**Droits d'auteur :** La plateforme ne doit pas héberger les fichiers complets des publications sous droit d'auteur sans accord explicite. Elle doit se limiter aux métadonnées bibliographiques (titre, auteurs, résumé, DOI) et proposer des liens vers les sources originales.

**Protection des données personnelles :** Conformément aux principes du Règlement Général sur la Protection des Données (RGPD) et aux lois tunisiennes applicables en matière de protection des données, la collecte et le traitement des données personnelles des membres doivent respecter les principes de minimisation, de consentement explicite et de droit à l'effacement.

**Accès ouvert :** Dans la mesure du possible, la plateforme doit favoriser la diffusion en accès ouvert des publications dont les auteurs détiennent les droits, conformément aux politiques de science ouverte encouragées par les institutions de tutelle.

---

## 2.4 – Définition des fonctionnalités du système

La plateforme LARODEC est organisée en cinq modules fonctionnels cohérents, chacun adressant un ensemble de besoins métier distincts.

**Tableau 2.5 – Modules fonctionnels de la plateforme LARODEC**

| Module | Description | Acteurs concernés | Fonctionnalités principales |
|--------|-------------|-------------------|-----------------------------|
| **Module 1 – Site Public** | Vitrine institutionnelle du laboratoire, accessible sans authentification | Visiteurs, Partenaires, Chercheurs externes | Page d'accueil animée, annuaire membres, publications avec recherche, événements, partenaires, contact |
| **Module 2 – Espace Membre** | Environnement privé de gestion pour les chercheurs authentifiés | Chercheurs (tous corps), Doctorants | Tableau de bord, dépôt publications, génération CV, gestion thèses, profil, événements |
| **Module 3 – Intelligence Artificielle** | Fonctionnalités avancées basées sur des modèles IA et le traitement automatique du langage | Chercheurs, Administrateur | PulsAR veille scientifique, recherche sémantique, scraping Google Scholar, recommandations |
| **Module 4 – Administration** | Interface de gestion et de supervision pour les administrateurs de la plateforme | Administrateur, Direction du labo | Gestion membres, validation publications, statistiques, configuration |
| **Module 5 – Identité Visuelle** | Charte graphique cohérente et éléments d'identité LARODEC intégrés dans l'interface | Tous les utilisateurs | Logo SVG animé, filigrane de fond, palette bleue institutionnelle, favicon |

### 2.4.1 – Détail du Module Site Public

Ce module constitue la face visible du laboratoire sur le web. Il comprend :
- Une **page d'accueil** avec animation typewriter sur le sous-titre, présentation des axes de recherche, statistiques clés (53 chercheurs, 881 publications), liste des événements récents, et accès rapide à l'espace membre.
- Un **annuaire des membres** avec fiches individuelles, filtres par corps et axe de recherche, et liens vers les profils publics.
- Une **page publications** avec liste paginée, filtres multi-critères (année, type, auteur, axe) et fonction de recherche sémantique.
- Une **page événements** présentant les actualités scientifiques passées et à venir.
- Une **page partenaires et liens utiles** référençant les collaborations institutionnelles et les ressources pour la recherche.

### 2.4.2 – Détail du Module Espace Membre

Ce module offre aux chercheurs un environnement personnalisé comprenant :
- Un **tableau de bord** avec indicateurs de publication personnels, publications récentes, et notifications.
- Un **gestionnaire de publications** avec formulaire de saisie manuelle et import automatisé depuis Google Scholar.
- Un **générateur de CV** produisant un document DOCX formaté selon le template officiel LARODEC.
- Un **gestionnaire de thèses** pour le suivi des travaux encadrés.
- Un **éditeur de profil** permettant la mise à jour des informations personnelles, de la photo et des identifiants académiques.

### 2.4.3 – Détail du Module Intelligence Artificielle

Ce module regroupe les fonctionnalités à plus haute valeur ajoutée technologique :
- **PulsAR** (Pulse Académique & Radar Scientifique) : agrégation en temps réel des publications récentes mondiales depuis Semantic Scholar, ArXiv et autres sources, organisées par thématique et présentées dans un widget interactif.
- **Recherche sémantique** : utilisation d'embeddings multilingues (modèle Hugging Face) pour permettre une recherche par sens plutôt que par mot-clé exact, avec score de pertinence affiché.
- **Scraping Google Scholar** : import automatisé des publications d'un chercheur depuis son profil Google Scholar, avec déduplication et validation avant intégration dans la base.
- **Recommandations IA** : suggestions de publications pertinentes basées sur le profil de recherche du chercheur connecté, générées via l'API Claude.

### 2.4.4 – Détail du Module Administration

Ce module offre à l'administrateur une vision globale et les outils de gouvernance de la plateforme :
- Tableau de bord administrateur avec KPIs globaux du laboratoire.
- Interface de gestion des comptes membres avec workflow de validation.
- Interface de validation des publications soumises (confirmation/rejet avec commentaire).
- Gestionnaire d'événements avec options de publication et d'archivage.
- Module d'export des données pour la génération de rapports d'activité annuels.

---

## 2.5 – Structuration du Product Backlog

### 2.5.1 – Architecture du Backlog

Conformément aux pratiques de l'ingénierie agile, le Product Backlog de la plateforme LARODEC est structuré selon une hiérarchie à quatre niveaux :

- **Thème** : domaine métier de haut niveau regroupant plusieurs epics partageant une finalité commune (ex. : Site Public, Espace Membre, Intelligence Artificielle, Administration).
- **Epic** : ensemble cohérent de fonctionnalités répondant à un objectif métier spécifique, trop vaste pour être réalisé en un seul sprint (ex. : Gestion des publications, Module PulsAR).
- **Feature** : fonctionnalité spécifique, décomposable en plusieurs user stories, réalisable en deux à trois sprints au maximum (ex. : Import Google Scholar, Génération CV DOCX).
- **User Story** : expression d'un besoin du point de vue de l'utilisateur final, suivant le format canonique : *"En tant que [rôle], je veux [action] afin de [bénéfice]."* Chaque user story est accompagnée d'une estimation en points de complexité (suite de Fibonacci : 1, 2, 3, 5, 8, 13) et d'une priorité.

Cette hiérarchie garantit une lisibilité optimale du backlog pour toutes les parties prenantes et facilite la planification des sprints.

### 2.5.2 – Product Backlog préliminaire

**Tableau 2.6 – Product Backlog préliminaire de la plateforme LARODEC**

| ID | Thème | Epic | Feature | User Story | Priorité | Estimation |
|----|-------|------|---------|-----------|----------|------------|
| US-001 | Site Public | 1.1 Présentation labo | Page d'accueil | En tant que visiteur, je veux voir une page d'accueil présentant le laboratoire afin de comprendre rapidement ses missions et axes de recherche. | Must Have | 5 |
| US-002 | Site Public | 1.1 Présentation labo | Axes de recherche | En tant que visiteur, je veux consulter les six axes de recherche du laboratoire afin d'identifier les domaines d'expertise scientifique. | Must Have | 3 |
| US-003 | Site Public | 1.1 Présentation labo | Filigrane animé | En tant que visiteur, je veux voir un logo LARODEC en filigrane discret en arrière-plan afin de percevoir une identité visuelle cohérente. | Should Have | 2 |
| US-004 | Site Public | 1.1 Présentation labo | Statistiques clés | En tant que visiteur, je veux voir les indicateurs clés du laboratoire (nombre de chercheurs, publications, conventions) afin d'évaluer son activité. | Must Have | 3 |
| US-005 | Site Public | 1.1 Présentation labo | Animation typewriter | En tant que visiteur, je veux voir un sous-titre animé décrivant les thématiques du laboratoire afin de saisir la diversité des recherches menées. | Should Have | 2 |
| US-006 | Site Public | 1.2 Annuaire membres | Liste membres | En tant que visiteur, je veux consulter la liste des membres du laboratoire afin de connaître la composition de l'équipe de recherche. | Must Have | 5 |
| US-007 | Site Public | 1.2 Annuaire membres | Fiche profil public | En tant que visiteur, je veux accéder à la fiche publique d'un chercheur (photo, grade, publications) afin d'en savoir plus sur ses travaux. | Must Have | 5 |
| US-008 | Site Public | 1.2 Annuaire membres | Recherche dans l'annuaire | En tant que visiteur, je veux filtrer les membres par corps, axe de recherche ou nom afin de trouver rapidement un chercheur spécifique. | Should Have | 3 |
| US-009 | Site Public | 1.3 Publications | Liste publications | En tant que visiteur, je veux consulter la liste paginée des publications du laboratoire afin d'explorer la production scientifique. | Must Have | 5 |
| US-010 | Site Public | 1.3 Publications | Filtres avancés | En tant que visiteur, je veux filtrer les publications par année, type, auteur ou axe afin de cibler les références qui m'intéressent. | Must Have | 5 |
| US-011 | Site Public | 1.3 Publications | Recherche sémantique | En tant que visiteur, je veux effectuer une recherche par mots-clés thématiques afin de trouver des publications pertinentes même sans connaître le titre exact. | Should Have | 8 |
| US-012 | Site Public | 1.3 Publications | Détail publication | En tant que visiteur, je veux voir le détail d'une publication (résumé, auteurs, DOI, citation APA) afin de pouvoir la référencer correctement. | Must Have | 3 |
| US-013 | Site Public | 1.4 Événements | Liste événements | En tant que visiteur, je veux consulter les événements scientifiques passés et à venir du laboratoire afin de suivre ses activités. | Must Have | 5 |
| US-014 | Site Public | 1.4 Événements | Détail événement | En tant que visiteur, je veux accéder à la page détaillée d'un événement (date, lieu, description) afin d'obtenir toutes les informations nécessaires. | Must Have | 3 |
| US-015 | Site Public | 1.4 Événements | Tri par date | En tant que visiteur, je veux que les événements soient triés avec les prochains événements en premier afin de repérer immédiatement les actualités. | Should Have | 2 |
| US-016 | Site Public | 1.5 Partenaires | Page partenaires | En tant que visiteur, je veux consulter la liste des partenaires institutionnels du laboratoire afin de connaître son réseau de collaborations. | Should Have | 3 |
| US-017 | Site Public | 1.5 Partenaires | Liens utiles | En tant que visiteur, je veux accéder à une liste de ressources scientifiques utiles (bases de données, portails) afin de faciliter ma recherche documentaire. | Could Have | 2 |
| US-018 | Site Public | 1.5 Partenaires | Contact | En tant que visiteur, je veux trouver les coordonnées du laboratoire (adresse, email, téléphone) afin de prendre contact avec l'équipe. | Must Have | 2 |
| US-019 | Espace Membre | 2.1 Authentification | Connexion | En tant que chercheur, je veux me connecter avec mon email et mon mot de passe afin d'accéder à mon espace personnel sécurisé. | Must Have | 3 |
| US-020 | Espace Membre | 2.1 Authentification | Inscription | En tant que nouveau membre, je veux créer un compte en renseignant mes informations académiques afin de rejoindre la plateforme du laboratoire. | Must Have | 5 |
| US-021 | Espace Membre | 2.1 Authentification | Mot de passe oublié | En tant que chercheur, je veux pouvoir réinitialiser mon mot de passe par email afin de ne pas perdre l'accès à mon compte. | Must Have | 3 |
| US-022 | Espace Membre | 2.2 Profil | Édition profil | En tant que chercheur, je veux modifier mes informations personnelles (grade, établissement, biographie) afin que mon profil reste à jour. | Must Have | 5 |
| US-023 | Espace Membre | 2.2 Profil | Photo de profil | En tant que chercheur, je veux téléverser et modifier ma photo de profil afin de personnaliser ma présentation sur la plateforme. | Should Have | 3 |
| US-024 | Espace Membre | 2.2 Profil | Liens académiques | En tant que chercheur, je veux renseigner mes identifiants ORCID, Google Scholar et ResearchGate afin de faciliter la mise en relation avec mes travaux. | Should Have | 2 |
| US-025 | Espace Membre | 2.3 Publications | Dépôt manuel | En tant que chercheur, je veux soumettre manuellement une publication en remplissant un formulaire structuré afin d'enrichir la base de publications du laboratoire. | Must Have | 5 |
| US-026 | Espace Membre | 2.3 Publications | Import Google Scholar | En tant que chercheur, je veux importer automatiquement mes publications depuis mon profil Google Scholar afin de gagner du temps et d'éviter la saisie manuelle. | Must Have | 13 |
| US-027 | Espace Membre | 2.3 Publications | Statut de validation | En tant que chercheur, je veux consulter le statut de chacune de mes publications soumises (en attente, validée, rejetée) afin de suivre leur traitement. | Must Have | 3 |
| US-028 | Espace Membre | 2.3 Publications | Modification publication | En tant que chercheur, je veux modifier une publication que j'ai déposée afin de corriger une erreur ou compléter des informations manquantes. | Must Have | 3 |
| US-029 | Espace Membre | 2.4 CV numérique | Génération DOCX | En tant que chercheur, je veux générer mon CV académique au format Word avec le template LARODEC afin de disposer d'un document standardisé et immédiatement utilisable. | Must Have | 8 |
| US-030 | Espace Membre | 2.4 CV numérique | Export PDF | En tant que chercheur, je veux exporter mon CV au format PDF afin de le transmettre facilement par email ou de le publier sur des plateformes académiques. | Should Have | 5 |
| US-031 | Espace Membre | 2.5 Tableau de bord | Statistiques personnelles | En tant que chercheur, je veux voir un résumé de mes publications (total, par type, par année) afin d'avoir une vision synthétique de ma production scientifique. | Must Have | 5 |
| US-032 | Espace Membre | 2.5 Tableau de bord | Publications récentes | En tant que chercheur, je veux voir mes dernières publications ajoutées sur mon tableau de bord afin d'en vérifier rapidement le contenu. | Should Have | 3 |
| US-033 | Espace Membre | 2.5 Tableau de bord | Notifications | En tant que chercheur, je veux recevoir des notifications lors de la validation ou du rejet d'une publication afin d'être informé en temps réel du traitement de mes soumissions. | Should Have | 5 |
| US-034 | Espace Membre | 2.5 Tableau de bord | Thèses encadrées | En tant que chercheur, je veux gérer la liste de mes thèses encadrées (titre, étudiant, statut, année) afin de maintenir un suivi académique complet. | Should Have | 5 |
| US-035 | Intelligence Artificielle | 3.1 PulsAR | Affichage articles récents | En tant que chercheur, je veux consulter les dernières publications mondiales dans les domaines du laboratoire afin de rester informé des avancées scientifiques récentes. | Must Have | 8 |
| US-036 | Intelligence Artificielle | 3.1 PulsAR | Onglets thématiques | En tant que chercheur, je veux naviguer entre les différentes thématiques de recherche dans PulsAR afin de filtrer les articles selon mes intérêts spécifiques. | Should Have | 5 |
| US-037 | Intelligence Artificielle | 3.1 PulsAR | Widget accueil | En tant que visiteur, je veux voir un aperçu des publications récentes sur la page d'accueil afin de percevoir immédiatement la dynamique scientifique du laboratoire. | Could Have | 5 |
| US-038 | Intelligence Artificielle | 3.2 Recherche sémantique | Embeddings multilingues | En tant que visiteur, je veux effectuer une recherche sémantique en français ou en anglais afin de trouver des publications pertinentes quelle que soit la langue de ma requête. | Should Have | 13 |
| US-039 | Intelligence Artificielle | 3.2 Recherche sémantique | Score de pertinence | En tant que visiteur, je veux que les résultats de recherche soient classés par score de pertinence afin d'identifier en priorité les publications les plus correspondantes. | Should Have | 8 |
| US-040 | Intelligence Artificielle | 3.2 Recherche sémantique | Fallback full-text | En tant que visiteur, je veux que le système bascule sur une recherche textuelle classique si la recherche sémantique ne retourne pas de résultats afin de toujours obtenir une réponse. | Must Have | 5 |
| US-041 | Intelligence Artificielle | 3.3 Import Scholar | Scraping profil Scholar | En tant que chercheur, je veux lancer un import depuis mon profil Google Scholar en fournissant son URL afin que mes publications soient automatiquement récupérées. | Must Have | 13 |
| US-042 | Intelligence Artificielle | 3.3 Import Scholar | Déduplication | En tant que chercheur, je veux que le système détecte automatiquement les publications déjà enregistrées lors d'un import Scholar afin d'éviter les doublons dans ma liste. | Must Have | 8 |
| US-043 | Intelligence Artificielle | 3.3 Import Scholar | Validation avant import | En tant que chercheur, je veux visualiser et sélectionner les publications à importer avant leur enregistrement définitif afin de garder le contrôle sur le contenu importé. | Must Have | 5 |
| US-044 | Administration | 4.1 Gestion membres | Validation comptes | En tant qu'administrateur, je veux valider ou rejeter les demandes d'inscription afin de contrôler l'accès à la plateforme et garantir l'intégrité de l'annuaire. | Must Have | 5 |
| US-045 | Administration | 4.1 Gestion membres | Gestion des rôles | En tant qu'administrateur, je veux modifier le rôle et les permissions d'un membre (chercheur, admin) afin d'adapter ses droits d'accès à sa fonction. | Must Have | 5 |
| US-046 | Administration | 4.2 Validation publications | Workflow validation | En tant qu'administrateur, je veux confirmer ou rejeter les publications soumises en ajoutant un commentaire afin de maintenir la qualité du référentiel scientifique. | Must Have | 5 |
| US-047 | Administration | 4.2 Validation publications | Notifications | En tant qu'administrateur, je veux être notifié lorsqu'une nouvelle publication est soumise afin de traiter les demandes dans les meilleurs délais. | Should Have | 3 |
| US-048 | Administration | 4.3 Statistiques labo | Tableau de bord admin | En tant qu'administrateur, je veux consulter un tableau de bord avec les indicateurs globaux du laboratoire (membres actifs, publications par année, événements) afin de piloter l'activité. | Must Have | 8 |
| US-049 | Administration | 4.3 Statistiques labo | Export données | En tant qu'administrateur, je veux exporter les données du laboratoire (publications, membres) au format CSV ou Excel afin de produire des rapports institutionnels. | Should Have | 5 |
| US-050 | Administration | 4.3 Statistiques labo | Gestion événements | En tant qu'administrateur, je veux créer, modifier et archiver des événements scientifiques afin de maintenir le calendrier du laboratoire à jour. | Must Have | 5 |

---

## 2.6 – Priorisation du backlog préliminaire

### 2.6.1 – Méthode MoSCoW

La priorisation du Product Backlog a été réalisée selon la méthode MoSCoW, qui classe les éléments en quatre catégories :

- **Must Have (M) :** Fonctionnalités indispensables sans lesquelles le produit n'est pas viable. Ces éléments doivent impérativement être livrés dans les premières versions.
- **Should Have (S) :** Fonctionnalités importantes qui apportent une valeur significative mais dont l'absence ne bloque pas le déploiement initial.
- **Could Have (C) :** Fonctionnalités souhaitables à moindre priorité, intégrées si le temps et les ressources le permettent.
- **Won't Have (W) :** Fonctionnalités explicitement exclues du périmètre de la version courante, pouvant être reconsidérées pour des versions futures.

### 2.6.2 – Tableau de priorisation par Epic

**Tableau 2.7 – Priorisation MoSCoW par Epic**

| Epic | Intitulé | Catégorie MoSCoW | Justification métier |
|------|----------|-----------------|----------------------|
| 1.1 | Présentation du laboratoire | Must Have | Constitue la vitrine principale du laboratoire ; indispensable à la visibilité institutionnelle. |
| 1.2 | Annuaire des membres | Must Have | Répondre au besoin de visibilité externe sur la composition de l'équipe ; demande forte de la direction. |
| 1.3 | Publications scientifiques | Must Have | Cœur de métier du laboratoire ; sans ce module, la plateforme n'a pas de raison d'être. |
| 1.4 | Actualités et événements | Must Have | Communication externe essentielle pour les partenaires et les membres. |
| 1.5 | Partenaires et contact | Should Have | Important pour la crédibilité institutionnelle, mais non bloquant pour le lancement. |
| 2.1 | Authentification | Must Have | Prérequis technique pour tout l'espace membre ; aucun autre module privé ne peut fonctionner sans lui. |
| 2.2 | Gestion du profil | Must Have | Chaque chercheur doit pouvoir maintenir son profil ; base de toutes les fonctionnalités personnalisées. |
| 2.3 | Gestion des publications | Must Have | Fonctionnalité centrale de l'espace membre ; résout le principal dysfonctionnement identifié (D1). |
| 2.4 | CV numérique | Must Have | Forte demande des chercheurs ; résout un problème concret de standardisation (D6). |
| 2.5 | Tableau de bord chercheur | Must Have | Indispensable à l'engagement des membres ; premier point d'entrée après connexion. |
| 3.1 | PulsAR Veille scientifique | Must Have | Fonctionnalité différenciante et hautement valorisée par les membres ; résout D5. |
| 3.2 | Recherche sémantique | Should Have | Valeur ajoutée significative, mais le module publications peut fonctionner avec une recherche textuelle. |
| 3.3 | Import Google Scholar | Must Have | Réduction majeure de la friction lors de l'onboarding des chercheurs sur la plateforme. |
| 4.1 | Gestion des membres (admin) | Must Have | Prérequis à l'ouverture de la plateforme ; contrôle de l'accès et de la qualité des données. |
| 4.2 | Validation des publications | Must Have | Garant de la qualité du référentiel scientifique ; workflow indispensable. |
| 4.3 | Statistiques laboratoire | Should Have | Utile pour le pilotage mais non bloquant pour le lancement ; peut être livré en sprint ultérieur. |

### 2.6.3 – Matrice valeur/complexité

La matrice ci-après classe les Epics selon deux axes : la **valeur métier** (impact sur les utilisateurs et réponse aux dysfonctionnements identifiés) et la **complexité de développement** (effort technique estimé). Cette analyse guide la séquence des sprints en priorisant les Epics à haute valeur et faible complexité.

**Tableau 2.8 – Matrice valeur métier / complexité de développement**

| Epic | Valeur métier | Complexité | Quadrant | Recommandation |
|------|--------------|------------|---------|----------------|
| 1.1 Présentation labo | Haute | Faible | ★ Quick Win | À livrer en Sprint 1 |
| 1.2 Annuaire membres | Haute | Moyenne | ◆ Prioritaire | Sprint 1-2 |
| 1.3 Publications | Haute | Haute | ▲ Investissement | Sprint 2-3 |
| 1.4 Événements | Haute | Faible | ★ Quick Win | Sprint 1 |
| 1.5 Partenaires/Contact | Moyenne | Faible | ★ Quick Win | Sprint 1 |
| 2.1 Authentification | Haute | Moyenne | ◆ Prioritaire | Sprint 1-2 |
| 2.2 Profil | Haute | Moyenne | ◆ Prioritaire | Sprint 2 |
| 2.3 Publications | Haute | Haute | ▲ Investissement | Sprint 3-4 |
| 2.4 CV numérique | Haute | Haute | ▲ Investissement | Sprint 4 |
| 2.5 Dashboard | Haute | Moyenne | ◆ Prioritaire | Sprint 3 |
| 3.1 PulsAR | Haute | Haute | ▲ Investissement | Sprint 5 |
| 3.2 Recherche sémantique | Moyenne | Très haute | ● Complexe | Sprint 6 |
| 3.3 Import Scholar | Haute | Très haute | ● Complexe | Sprint 4-5 |
| 4.1 Gestion membres | Haute | Faible | ★ Quick Win | Sprint 2 |
| 4.2 Validation publications | Haute | Moyenne | ◆ Prioritaire | Sprint 3 |
| 4.3 Statistiques admin | Moyenne | Moyenne | ◆ Prioritaire | Sprint 5 |

*Légende des quadrants :*
- **★ Quick Win :** haute valeur, faible complexité — à livrer en priorité absolue.
- **◆ Prioritaire :** haute valeur, complexité moyenne — planification dans les premiers sprints.
- **▲ Investissement :** haute valeur, haute complexité — effort justifié, planification rigoureuse nécessaire.
- **● Complexe :** valeur variable, très haute complexité — à traiter avec précaution, POC préalable recommandé.

---

## 2.7 – Livrables du chapitre

Ce chapitre a produit trois livrables structurants pour la suite du projet :

**Livrable 1 – Analyse du besoin métier**
La documentation complète des sept processus métier existants au sein du laboratoire LARODEC, accompagnée de l'identification de leurs dysfonctionnements (Tableau 2.1), de la formalisation de cinquante besoins fonctionnels organisés par profil utilisateur (Tableaux 2.2 à 2.4) et de la description des contraintes organisationnelles, techniques et réglementaires encadrant le développement.

**Livrable 2 – Product Backlog préliminaire structuré**
Un backlog hiérarchisé comprenant 4 thèmes, 16 epics, 38 features et 50 user stories au format standardisé, avec estimation en points de complexité (Tableau 2.6). Ce backlog constitue le référentiel de base pour la planification des sprints et sera affiné de manière incrémentale au cours du projet.

**Livrable 3 – Vision claire des priorités métier**
Une priorisation MoSCoW par Epic (Tableau 2.7) et une matrice valeur/complexité (Tableau 2.8) permettant d'identifier les séquences de développement optimales et de guider les décisions lors des cérémonies de planification de sprints.

---

## Conclusion

Ce chapitre a permis d'établir les fondations analytiques et documentaires du projet de développement de la plateforme LARODEC. L'examen des processus métier existants a mis en évidence sept dysfonctionnements majeurs caractérisés principalement par la dispersion des données, l'absence d'outils numériques dédiés et la sous-exploitation des technologies d'intelligence artificielle disponibles. La formalisation des besoins fonctionnels a conduit à l'identification de cinquante exigences couvrant trois profils utilisateurs distincts — visiteur, chercheur et administrateur —, complétées par un ensemble de contraintes organisationnelles, techniques et réglementaires qui encadrent le développement. Le Product Backlog préliminaire, structuré selon la hiérarchie agile Thèmes → Epics → Features → User Stories et priorisé selon la méthode MoSCoW, constitue désormais le référentiel de référence pour toutes les décisions de développement à venir.

Le chapitre suivant s'attachera à traduire ces besoins en décisions de conception architecturale, en définissant l'architecture technique de la plateforme, les diagrammes UML de cas d'utilisation et de séquence, ainsi que la modélisation de la base de données relationnelle qui supportera l'ensemble des fonctionnalités identifiées dans ce backlog.

---

*Document produit dans le cadre du Projet de Fin d'Études — Plateforme LARODEC*
*Institut Supérieur de Gestion de Tunis (ISG) — Université de Tunis — Juin 2026*
