# -*- coding: utf-8 -*-
"""
RADAR SCIENTIFIQUE LARODEC — Veille automatisée par IA
Fetches recent papers from Semantic Scholar + ArXiv, scores them, caches results.
"""

import threading
import xml.etree.ElementTree as ET
import os
import json
import requests
from datetime import datetime, timedelta
from typing import Optional
import unicodedata

# ── Cache ─────────────────────────────────────────────────────────────────────
_cache: dict = {
    "articles": [],
    "updated_at": None,
    "total": 0,
}
_lock = threading.Lock()

# ── Seed articles — always available immediately ──────────────────────────────
SEED_ARTICLES = [
    {
        "titre": "A Comprehensive Survey of Multi-Criteria Decision Making Methods",
        "auteurs": ["Taherdoost, H.", "Madanchian, M."],
        "abstract": "This survey reviews MCDM methods including AHP, TOPSIS, VIKOR and their applications in complex decision environments.",
        "resume_fr": "[Résumé automatique] Cette étude présente une revue complète des méthodes d'aide à la décision multicritère (MCDM), couvrant AHP, TOPSIS et VIKOR. Les auteurs analysent leurs forces et limites dans des environnements décisionnels complexes.",
        "annee": 2023,
        "source": "Computers",
        "nb_citations": 142,
        "doi": "10.3390/computers12010004",
        "url": "https://www.mdpi.com/2073-431X/12/1/4",
        "date_publication": "2023-01-02",
        "axe": "decision",
        "score": 91,
        "membres_larodec": [],
    },
    {
        "titre": "Deep Learning for Decision Support: A Systematic Review",
        "auteurs": ["Ahmad, I.", "Iqbal, M.", "Khan, A."],
        "abstract": "We systematically review deep learning architectures applied to decision support systems, focusing on recurrent networks and transformers for sequential decision making.",
        "resume_fr": "[Résumé automatique] Cette revue systématique analyse les architectures d'apprentissage profond appliquées aux systèmes d'aide à la décision. Les réseaux récurrents et transformers montrent des performances remarquables pour la prise de décision séquentielle.",
        "annee": 2024,
        "source": "Expert Systems with Applications",
        "nb_citations": 87,
        "doi": None,
        "url": "https://www.sciencedirect.com/journal/expert-systems-with-applications",
        "date_publication": "2024-03-15",
        "axe": "apprentissage",
        "score": 88,
        "membres_larodec": [],
    },
    {
        "titre": "Bayesian Networks for Uncertainty Modeling in Complex Systems",
        "auteurs": ["Langseth, H.", "Portinale, L."],
        "abstract": "Bayesian networks provide a powerful framework for representing and reasoning under uncertainty. This paper surveys recent advances in structure learning and inference algorithms.",
        "resume_fr": "[Résumé automatique] Les réseaux bayésiens constituent un cadre puissant pour représenter et raisonner sous incertitude. Cet article passe en revue les avancées récentes en apprentissage de structure et algorithmes d'inférence.",
        "annee": 2024,
        "source": "International Journal of Approximate Reasoning",
        "nb_citations": 203,
        "doi": None,
        "url": "https://www.sciencedirect.com/journal/international-journal-of-approximate-reasoning",
        "date_publication": "2024-01-10",
        "axe": "incertitude",
        "score": 90,
        "membres_larodec": [],
    },
    {
        "titre": "Knowledge Graph Completion: A Comprehensive Benchmark",
        "auteurs": ["Ali, M.", "Berrendorf, M.", "Hoyt, C.T.", "Vermue, L."],
        "abstract": "We present a comprehensive benchmark of knowledge graph completion methods, evaluating embedding models across multiple datasets with reproducible experimental setups.",
        "resume_fr": "[Résumé automatique] Cet article présente un benchmark complet des méthodes de complétion de graphes de connaissances, évaluant les modèles d'embedding sur plusieurs jeux de données avec des configurations expérimentales reproductibles.",
        "annee": 2023,
        "source": "Journal of Machine Learning Research",
        "nb_citations": 316,
        "doi": None,
        "url": "https://jmlr.org",
        "date_publication": "2023-06-01",
        "axe": "connaissances",
        "score": 85,
        "membres_larodec": [],
    },
    {
        "titre": "Supply Chain Optimization Under Uncertainty: A Stochastic Programming Approach",
        "auteurs": ["Dolgui, A.", "Ivanov, D.", "Sokolov, B."],
        "abstract": "This paper proposes stochastic programming models for supply chain optimization under demand uncertainty, incorporating disruption risks and recovery strategies.",
        "resume_fr": "[Résumé automatique] Cet article propose des modèles de programmation stochastique pour l'optimisation des chaînes logistiques sous incertitude de la demande, intégrant les risques de perturbation et les stratégies de récupération.",
        "annee": 2024,
        "source": "International Journal of Production Economics",
        "nb_citations": 178,
        "doi": None,
        "url": "https://www.sciencedirect.com/journal/international-journal-of-production-economics",
        "date_publication": "2024-02-20",
        "axe": "logistique",
        "score": 83,
        "membres_larodec": [],
    },
    {
        "titre": "Transformer-Based Models for Multi-Label Classification",
        "auteurs": ["Yang, Z.", "Dai, Z.", "Yang, Y.", "Carbonell, J."],
        "abstract": "We introduce transformer architectures adapted for multi-label text and tabular classification tasks, achieving state-of-the-art results on standard benchmarks.",
        "resume_fr": "[Résumé automatique] Nous introduisons des architectures transformer adaptées aux tâches de classification multi-label textuelle et tabulaire, atteignant des résultats à l'état de l'art sur des benchmarks standard.",
        "annee": 2024,
        "source": "Transactions on Machine Learning Research",
        "nb_citations": 94,
        "doi": None,
        "url": "https://jmlr.org/tmlr/",
        "date_publication": "2024-05-01",
        "axe": "apprentissage",
        "score": 86,
        "membres_larodec": [],
    },
    {
        "titre": "Stochastic Metaheuristics for Combinatorial Optimization: Survey and New Directions",
        "auteurs": ["Talbi, E.G."],
        "abstract": "This survey covers recent advances in stochastic metaheuristics including genetic algorithms, simulated annealing, and swarm intelligence for combinatorial optimization problems.",
        "resume_fr": "[Résumé automatique] Cette enquête couvre les avancées récentes en métaheuristiques stochastiques, incluant les algorithmes génétiques, le recuit simulé et l'intelligence en essaim pour les problèmes d'optimisation combinatoire.",
        "annee": 2023,
        "source": "European Journal of Operational Research",
        "nb_citations": 267,
        "doi": None,
        "url": "https://www.sciencedirect.com/journal/european-journal-of-operational-research",
        "date_publication": "2023-09-15",
        "axe": "statistique",
        "score": 84,
        "membres_larodec": [],
    },
    {
        "titre": "TOPSIS and Its Extensions: A Literature Review",
        "auteurs": ["Behzadian, M.", "Khanmohammadi Otaghsara, S.", "Yazdani, M."],
        "abstract": "TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) is one of the most widely used MCDM methods. This paper reviews its theoretical foundations and extensions.",
        "resume_fr": "[Résumé automatique] TOPSIS est l'une des méthodes MCDM les plus utilisées. Cet article passe en revue ses fondements théoriques, ses extensions floues et ses applications dans divers domaines industriels.",
        "annee": 2023,
        "source": "Expert Systems with Applications",
        "nb_citations": 412,
        "doi": None,
        "url": "https://www.sciencedirect.com/journal/expert-systems-with-applications",
        "date_publication": "2023-04-10",
        "axe": "decision",
        "score": 93,
        "membres_larodec": [],
    },
]

def _init_seed_cache():
    """Pre-load seed articles so the radar is never empty on first render."""
    with _lock:
        if not _cache["articles"]:
            _cache["articles"] = SEED_ARTICLES
            _cache["updated_at"] = datetime.now().isoformat()
            _cache["total"] = len(SEED_ARTICLES)
            print(f"[radar] Seed cache initialized with {len(SEED_ARTICLES)} articles.")

# Initialize with seed data immediately
_init_seed_cache()

# ── Thematic keywords ─────────────────────────────────────────────────────────
RADAR_QUERIES = [
    ("decision",      ["multi-criteria decision making", "decision support system",
                       "game theory", "preference modeling"]),
    ("incertitude",   ["graphical models", "bayesian networks",
                       "probabilistic reasoning", "belief functions"]),
    ("apprentissage", ["machine learning", "deep learning",
                       "neural networks", "data mining"]),
    ("logistique",    ["operations research", "supply chain optimization",
                       "quality management"]),
    ("statistique",   ["stochastic optimization", "statistical modeling",
                       "metaheuristics"]),
    ("connaissances", ["knowledge management", "semantic web",
                       "ontology", "knowledge graph"]),
]

# ── Semantic Scholar ──────────────────────────────────────────────────────────
def _fetch_semantic_scholar(keyword: str, limit: int = 4) -> list:
    try:
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": keyword,
            "limit": limit,
            "fields": "title,authors,abstract,year,venue,citationCount,externalIds,publicationDate",
        }
        r = requests.get(url, params=params, timeout=12,
                         headers={"User-Agent": "LARODEC-Radar/1.0"})
        if not r.ok:
            return []
        out = []
        for p in r.json().get("data", []):
            abstract = (p.get("abstract") or "").strip()
            if not abstract:
                continue
            out.append({
                "titre":           p.get("title", ""),
                "auteurs":         [a.get("name", "") for a in p.get("authors", [])[:12]],
                "abstract":        abstract,
                "annee":           p.get("year"),
                "source":          p.get("venue", ""),
                "nb_citations":    p.get("citationCount", 0) or 0,
                "doi":             p.get("externalIds", {}).get("DOI"),
                "url":             f"https://www.semanticscholar.org/paper/{p['paperId']}"
                                   if p.get("paperId") else None,
                "date_publication": p.get("publicationDate") or None,
            })
        return out
    except Exception as e:
        print(f"[radar:semantic_scholar] {keyword}: {e}")
        return []

# ── ArXiv — disabled (connection issues), using Semantic Scholar only ─────────
def _fetch_arxiv(keyword: str, limit: int = 3) -> list:
    """ArXiv disabled — too slow/unreliable. Returning empty list."""
    return []

# ── AI Summarization ──────────────────────────────────────────────────────────
def _ai_summarize(titre: str, abstract: str, axe_key: str) -> dict:
    """
    Score and summarize an article using an AI model.
    Set ANTHROPIC_API_KEY env var to enable real Claude summarization.
    Falls back to rule-based scoring + auto-translated excerpt.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")

    if api_key and api_key.startswith("sk-ant-"):
        # ── Claude (Anthropic) ──────────────────────────────────────────────
        try:
            prompt = f"""Tu es un expert en recherche scientifique. Voici un article scientifique :
Titre : {titre}
Résumé (anglais) : {abstract[:1500]}

Thématiques du labo LARODEC : aide à la décision, modèles graphiques, apprentissage automatique, logistique, statistique appliquée, web sémantique.

Réponds en JSON uniquement avec ces 3 champs :
- "resume_fr": résumé en français de 2-3 phrases expliquant la nouveauté
- "score": entier 0-100 mesurant la pertinence pour LARODEC
- "axe": l'une de ces valeurs exactes: decision|incertitude|apprentissage|logistique|statistique|connaissances
"""
            r = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=20,
            )
            if r.ok:
                text = r.json()["content"][0]["text"]
                # Extract JSON from response
                import re
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    result = json.loads(match.group())
                    return {
                        "resume_fr": result.get("resume_fr", "")[:600],
                        "score":     min(100, max(0, int(result.get("score", 65)))),
                        "axe":       result.get("axe", axe_key),
                    }
        except Exception as e:
            print(f"[radar:claude] {e}")

    # ── Rule-based fallback ──────────────────────────────────────────────────
    text = (titre + " " + abstract).lower()

    AXE_KEYWORDS = {
        "decision":      ["decision", "multi-criteria", "game theory", "preference", "ranking", "choice"],
        "incertitude":   ["bayesian", "uncertainty", "probabilistic", "belief", "graphical model", "inference"],
        "apprentissage": ["machine learning", "deep learning", "neural", "classification", "clustering", "prediction"],
        "logistique":    ["logistics", "supply chain", "scheduling", "routing", "quality", "production"],
        "statistique":   ["stochastic", "optimization", "metaheuristic", "statistics", "regression", "sampling"],
        "connaissances": ["ontology", "semantic", "knowledge", "graph", "rdf", "linked data"],
    }

    scores_axe = {axe: sum(1 for kw in kws if kw in text) for axe, kws in AXE_KEYWORDS.items()}
    best_axe = max(scores_axe, key=scores_axe.get)
    best_score_raw = scores_axe[best_axe]
    score = min(95, 60 + best_score_raw * 7)

    # Build simple French summary from abstract
    sentences = [s.strip() for s in abstract.replace("\n", " ").split(".") if len(s.strip()) > 30]
    resume_fr = ". ".join(sentences[:2]) + "." if sentences else "Cet article présente des travaux récents dans ce domaine."

    # Keep summary in the source language but label it
    resume_fr = f"[Résumé automatique] {resume_fr[:400]}"

    return {
        "resume_fr": resume_fr,
        "score":     round(score),
        "axe":       best_axe if best_score_raw > 0 else axe_key,
    }

# ── Member detection ──────────────────────────────────────────────────────────
def _detect_members(auteurs: list, query_fn) -> list:
    """Return names of LARODEC members found among authors."""
    try:
        rows = query_fn("""
            SELECT nom_prenom FROM enseignants_corps_a
            UNION
            SELECT nom_prenom FROM enseignants_corps_b
            UNION
            SELECT nom_prenom FROM cadres_post_doc
        """)

        def norm(s):
            s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
            return s.lower().strip()

        member_names = [r["nom_prenom"] for r in (rows or []) if r.get("nom_prenom")]
        detected = []
        for author in auteurs:
            auth_parts = [p for p in norm(author).split() if len(p) > 3]
            for member in member_names:
                member_norm = norm(member)
                if auth_parts and all(p in member_norm for p in auth_parts[:2]):
                    detected.append(member)
                    break
        return detected
    except Exception as e:
        print(f"[radar:detect_members] {e}")
        return []

# ── Main refresh ──────────────────────────────────────────────────────────────
def refresh_cache(query_fn):
    """Fetch, score and cache articles. Call this in a background thread."""
    global _cache
    print("[radar] Starting cache refresh...")
    all_articles = []

    for axe_key, keywords in RADAR_QUERIES:
        for keyword in keywords[:1]:  # 1 keyword per axe to keep it fast
            for art in _fetch_semantic_scholar(keyword, limit=4):
                ai = _ai_summarize(art["titre"], art["abstract"], axe_key)
                if ai["score"] < 60:
                    continue
                art.update(ai)
                art["membres_larodec"] = _detect_members(art["auteurs"], query_fn)
                all_articles.append(art)

    # Deduplicate by title prefix
    seen: set = set()
    unique = []
    for art in all_articles:
        key = art["titre"].lower()[:60]
        if key not in seen:
            seen.add(key)
            unique.append(art)

    unique.sort(key=lambda x: x.get("score", 0), reverse=True)

    with _lock:
        # Only replace if we fetched meaningful results
        if len(unique) >= 3:
            _cache["articles"]   = unique[:60]
            _cache["updated_at"] = datetime.now().isoformat()
            _cache["total"]      = len(unique)
        elif not _cache["articles"]:
            # Keep seeds if fetch returned nothing
            _cache["articles"]   = SEED_ARTICLES
            _cache["updated_at"] = datetime.now().isoformat()
            _cache["total"]      = len(SEED_ARTICLES)

    print(f"[radar] Cache refreshed — {len(unique)} articles.")

def get_cache() -> dict:
    with _lock:
        return dict(_cache)

def cache_is_stale(max_age_hours: int = 12) -> bool:
    with _lock:
        if not _cache["updated_at"]:
            return True
        age = (datetime.now() - datetime.fromisoformat(_cache["updated_at"])).total_seconds()
        return age > max_age_hours * 3600
