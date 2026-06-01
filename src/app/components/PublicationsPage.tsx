import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, ArrowLeft, BookOpen, ChevronLeft, ChevronRight,
         ExternalLink, Copy, Check, X, User, Filter, Layers, FileText, Mic, BookMarked, Loader2 } from "lucide-react";
import logoLarodec from "../../imports/image-1.png";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicationWithScore {
  id: string | number;
  titre: string;
  score?: number;
  type_publication?: string;
  auteurs?: string;
  annee?: number;
  journal_ou_editeur?: string;
  doi?: string;
  url?: string;
  source_scraping?: string;
  indexation?: string;
  chercheur_nom?: string;
  citation_apa?: string;
}

interface SemanticSearchResponse {
  total: number;
  page: number;
  results: PublicationWithScore[];
  semantic: boolean;
  fallback_message?: string;
}

const BASE_PUBLIC = "http://localhost:3001";

const TYPE_FILTERS = [
  { key: "all",        label: "Toutes",              icon: Layers,     color: "blue"   },
  { key: "revue",      label: "Revues internationales", icon: FileText, color: "purple" },
  { key: "conference", label: "Actes de conférences", icon: Mic,       color: "cyan"   },
  { key: "workshop",   label: "Workshops",            icon: Filter,    color: "orange" },
  { key: "ouvrage",    label: "Ouvrages & Chapitres", icon: BookMarked,color: "green"  },
];

const SRC_COLORS: Record<string, string> = {
  "DBLP":          "bg-blue-50 text-blue-600 border-blue-200",
  "OpenAlex/WOS":  "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Scopus":        "bg-orange-50 text-orange-600 border-orange-200",
  "Google Scholar":"bg-red-50 text-red-600 border-red-200",
};

const TYPE_BADGE: Record<string, string> = {
  "revue":      "bg-purple-50 text-purple-700 border-purple-200",
  "conference": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "workshop":   "bg-orange-50 text-orange-700 border-orange-200",
  "ouvrage":    "bg-green-50 text-green-700 border-green-200",
};

function buildAPA(p: PublicationWithScore): string {
  const auteurs = p.auteurs || "";
  const annee   = p.annee || "s.d.";
  const titre   = p.titre || "";
  const journal = p.journal_ou_editeur || "";
  const doi     = p.doi || "";
  let ref = `${auteurs} (${annee}). ${titre}.`;
  if (journal) ref += ` *${journal}*.`;
  if (doi) ref += ` https://doi.org/${doi}`;
  return ref;
}

function PubModal({ pub, onClose }: { pub: PublicationWithScore; onClose: () => void }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const apa = pub.citation_apa || buildAPA(pub);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <BookOpen className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <h2 className="text-white font-bold text-sm leading-snug line-clamp-3">{pub.titre}</h2>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 p-1.5 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-2 flex-wrap">
            {pub.annee && <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">{pub.annee}</span>}
            {pub.source_scraping && (
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {pub.source_scraping}
              </span>
            )}
            {pub.indexation && <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">{pub.indexation}</span>}
          </div>
          {pub.journal_ou_editeur && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Journal / Venue</p>
              <p className="text-sm text-gray-700 italic">{pub.journal_ou_editeur}</p>
            </div>
          )}
          {pub.auteurs && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Auteurs</p>
              <p className="text-sm text-gray-700 leading-relaxed">{pub.auteurs}</p>
            </div>
          )}
          {pub.chercheur_nom && (
            <button
              onClick={() => { onClose(); navigate(`/public/researcher/${encodeURIComponent(pub.chercheur_nom)}`); }}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 hover:border-blue-300 transition-all group cursor-pointer">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-bold text-blue-700 group-hover:text-blue-800">{pub.chercheur_nom}</span>
                <span className="ml-2 text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">LARODEC</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Voir le profil <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          )}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Citation APA 7</p>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 text-sm text-gray-800 leading-relaxed border border-blue-100">
              <p dangerouslySetInnerHTML={{ __html: apa.replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap pt-1">
            <button onClick={() => { navigator.clipboard.writeText(apa); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier APA"}
            </button>
            {(pub.doi || pub.url) && (
              <a href={pub.doi ? `https://doi.org/${pub.doi}` : pub.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" /> Voir en ligne
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicationsPage() {
  const navigate = useNavigate();
  const [items, setItems]         = useState<PublicationWithScore[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [searching, setSearching] = useState(false); // spinner in search bar
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [chercheurInput, setChercheurInput] = useState("");
  const [debouncedChercheur, setDebouncedChercheur] = useState("");
  const [page, setPage]           = useState(0);
  const [selectedPub, setSelectedPub] = useState<PublicationWithScore | null>(null);
  const [isSemantic, setIsSemantic] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const LIMIT = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Debounce chercheur
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedChercheur(chercheurInput); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [chercheurInput]);

  const load = useCallback(() => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isFirstLoad = !debouncedSearch && !debouncedChercheur && typeFilter === "all" && page === 0;
    if (isFirstLoad) setLoading(true);
    else setSearching(true);

    setSearchError(null);
    setFallbackMessage(null);

    const body = {
      query: debouncedSearch,
      type: typeFilter !== "all" ? typeFilter : undefined,
      chercheur: debouncedChercheur || undefined,
      page,
      limit: LIMIT,
    };

    fetch(`${BASE_PUBLIC}/api/public/publications/search-semantic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<SemanticSearchResponse>;
      })
      .then(data => {
        setItems(data.results || []);
        setTotal(data.total || 0);
        setIsSemantic(data.semantic ?? false);
        setFallbackMessage(data.fallback_message ?? null);
      })
      .catch(err => {
        if (err.name === "AbortError") return;
        console.error(err);
        setSearchError("Erreur lors de la recherche. Veuillez réessayer.");
      })
      .finally(() => {
        setLoading(false);
        setSearching(false);
      });
  }, [debouncedSearch, typeFilter, debouncedChercheur, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilter = TYPE_FILTERS.find(f => f.key === typeFilter);

  function RelevanceBadge({ score, semantic }: { score?: number; semantic: boolean }) {
    if (!semantic || score === undefined || score >= 1.0) return null;
    if (score > 0.75) return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
        Très pertinent
      </span>
    );
    if (score >= 0.5) return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
        Pertinent
      </span>
    );
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-semibold">
        Possible
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-blue-500/30 blur-3xl animate-pulse" />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-blue-300/20 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
          {/* Floating dots pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-8 hover:bg-white/20 px-4 py-2 rounded-xl transition-all text-sm font-medium group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
          </button>

          <div className="flex items-center justify-between flex-wrap gap-8">
            {/* Logo + Title */}
            <div className="flex items-center gap-6">
              {/* Logo with glow effect */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl scale-110 animate-pulse" />
                <div className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/30 flex items-center justify-center shadow-2xl p-2">
                  <img src={logoLarodec} alt="LARODEC" className="w-full h-full object-contain drop-shadow-lg" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    LARODEC
                  </span>
                </div>
                <h1 className="text-5xl font-black tracking-tight leading-none mb-2">
                  Publications
                  <span className="block text-cyan-300">Scientifiques</span>
                </h1>
                <p className="text-blue-100 text-base font-medium">
                  Travaux de recherche du laboratoire LARODEC
                </p>
              </div>
            </div>

            {/* Stats cards */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20 shadow-lg hover:bg-white/20 transition-all">
                <BookOpen className="w-6 h-6 text-cyan-300" />
                <div>
                  <div className="text-3xl font-black leading-none">{total}</div>
                  <div className="text-blue-200 text-xs font-medium">publications</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Rechercher par titre, auteur, journal..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all font-medium" />
            {searching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            ) : search ? (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-6">
            {/* Type filter */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Type de publication</p>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map(f => {
                  const Icon = f.icon;
                  const isActive = typeFilter === f.key;
                  return (
                    <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(0); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? `bg-${f.color}-600 text-white shadow-md shadow-${f.color}-200`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chercheur input */}
            <div className="w-64">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Chercheur</p>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Nom du chercheur..."
                  value={chercheurInput} onChange={e => setChercheurInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all" />
                {chercheurInput && (
                  <button onClick={() => setChercheurInput("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filters summary */}
          {(typeFilter !== "all" || debouncedChercheur || debouncedSearch) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">Filtres actifs:</span>
              {typeFilter !== "all" && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${TYPE_BADGE[typeFilter] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {activeFilter?.label}
                </span>
              )}
              {debouncedChercheur && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" />{debouncedChercheur}
                </span>
              )}
              {debouncedSearch && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-semibold">
                  "{debouncedSearch}"
                </span>
              )}
              <button onClick={() => { setTypeFilter("all"); setChercheurInput(""); setSearch(""); }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold ml-1">
                Effacer tout
              </button>
            </div>
          )}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-gray-500 font-medium">
              <span className="font-bold text-gray-900 text-base">{total}</span> publication(s) trouvée(s)
              {isSemantic && debouncedSearch && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-semibold">
                  Recherche sémantique IA
                </span>
              )}
            </p>
            {fallbackMessage && (
              <p className="text-xs text-amber-600 mt-1 font-medium">{fallbackMessage}</p>
            )}
            {searchError && (
              <p className="text-xs text-red-500 mt-1 font-medium">{searchError}</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-1.5 shadow-sm">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 font-semibold px-1">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-100 rounded-full" />
                      <div className="h-5 w-20 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 opacity-40" />
            </div>
            <p className="text-lg font-semibold text-gray-500">Aucune publication trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((pub, i) => (
              <button key={pub.id ?? i} onClick={() => setSelectedPub(pub)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md group-hover:shadow-blue-200 transition-shadow">
                    {pub.annee || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-2">
                      {pub.titre}
                    </h3>
                    {pub.journal_ou_editeur && (
                      <p className="text-xs text-gray-500 italic mb-2 line-clamp-1">{pub.journal_ou_editeur}</p>
                    )}
                    <div className="flex gap-2 flex-wrap items-center">
                      {pub.source_scraping && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {pub.source_scraping}
                        </span>
                      )}
                      {pub.indexation && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-semibold">
                          {pub.indexation}
                        </span>
                      )}
                      {pub.chercheur_nom && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 font-medium">
                          <User className="w-3 h-3" />{pub.chercheur_nom}
                        </span>
                      )}
                      <RelevanceBadge score={pub.score} semantic={isSemantic} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page < 3 ? i : page - 2 + i;
                if (p >= totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${p === page ? "bg-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {p + 1}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedPub && <PubModal pub={selectedPub} onClose={() => setSelectedPub(null)} />}
    </div>
  );
}
