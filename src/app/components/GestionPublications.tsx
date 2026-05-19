import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, ExternalLink, Copy, Check,
         X, BookOpen, Filter, User, GraduationCap, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { articlesApi, researchersApi } from "../../lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAPA(p: any): string {
  const auteurs = p.auteurs || p.chercheur_nom || "";
  const annee   = p.annee || "s.d.";
  const titre   = p.titre || "";
  const journal = p.journal_ou_editeur || "";
  const doi     = p.doi || "";
  let ref = `${auteurs} (${annee}). ${titre}.`;
  if (journal) ref += ` *${journal}*.`;
  if (doi) ref += ` https://doi.org/${doi}`;
  return ref;
}

const CAT_COLORS: Record<string, string> = {
  "Corps A":  "bg-blue-100 text-blue-700",
  "Corps B":  "bg-indigo-100 text-indigo-700",
  "Post-Doc": "bg-orange-100 text-orange-700",
  "Doctorant":"bg-purple-100 text-purple-700",
  "Master Recherche": "bg-green-100 text-green-700",
  "Externe":  "bg-gray-100 text-gray-500",
};

const SRC_COLORS: Record<string, string> = {
  "DBLP":          "bg-blue-50 text-blue-600 border-blue-200",
  "OpenAlex/WOS":  "bg-green-50 text-green-600 border-green-200",
  "Scopus":        "bg-orange-50 text-orange-600 border-orange-200",
  "Google Scholar":"bg-red-50 text-red-600 border-red-200",
  "ResearchGate":  "bg-teal-50 text-teal-600 border-teal-200",
};

// ─── Researcher Profile Modal ─────────────────────────────────────────────────

function ResearcherModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>("publications");

  useEffect(() => {
    researchersApi.getProfile(name)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [name]);

  const p = data?.profile;
  const pubs = data?.publications || [];

  const sections = [
    { key: "publications", label: `Publications (${pubs.length})`, icon: BookOpen },
    { key: "cursus",       label: "Cursus universitaire",          icon: GraduationCap },
    { key: "domaines",     label: "Domaines de recherche",         icon: BookOpen },
    { key: "these",        label: "These de doctorat",             icon: GraduationCap },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
           onClick={e => e.stopPropagation()}>
        {/* Header bar */}
        <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold tracking-wide">{name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-blue-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          ) : (
            <>
              {/* Profile card */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-5">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {p?.url_photo ? (
                      <img src={p.url_photo} alt={name}
                        className="w-28 h-28 rounded-xl object-cover border-2 border-gray-200 shadow" />
                    ) : (
                      <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-200 shadow">
                        <User className="w-12 h-12 text-blue-500" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-700 mb-1">{name}</h3>
                    {p?.grade && (
                      <p className="text-gray-700 font-medium mb-0.5 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        {p.grade}
                      </p>
                    )}
                    {p?.etablissement && (
                      <p className="text-gray-600 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {p.etablissement}
                      </p>
                    )}
                    {p?.universite && (
                      <p className="text-gray-500 text-sm mt-0.5">{p.universite}</p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {p?.categorie && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[p.categorie] || CAT_COLORS["Externe"]}`}>
                          {p.categorie}
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {data?.nb_publications} publication{data?.nb_publications !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion sections */}
              <div className="divide-y divide-gray-100">
                {sections.map(sec => (
                  <div key={sec.key}>
                    <button
                      onClick={() => setOpenSection(openSection === sec.key ? null : sec.key)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                      <span className="font-medium text-sm">{sec.label}</span>
                      {openSection === sec.key
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {openSection === sec.key && (
                      <div className="px-6 py-4 bg-white">
                        {sec.key === "publications" ? (
                          pubs.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">Aucune publication enregistree</p>
                          ) : (
                            <div className="space-y-3">
                              {pubs.map((pub: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                                  <span className="flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded mt-0.5">
                                    {pub.annee}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{pub.titre}</p>
                                    {pub.journal_ou_editeur && (
                                      <p className="text-xs text-gray-500 italic mt-0.5">{pub.journal_ou_editeur}</p>
                                    )}
                                    <div className="flex gap-2 mt-1.5 flex-wrap">
                                      {pub.source_scraping && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded border ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                          {pub.source_scraping}
                                        </span>
                                      )}
                                      {pub.doi && (
                                        <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                                          onClick={e => e.stopPropagation()}
                                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
                                          <ExternalLink className="w-3 h-3" /> DOI
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-gray-400 py-4 text-center italic">
                            Information non disponible — a completer dans le profil
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Publication Detail Modal ─────────────────────────────────────────────────

function PubModal({ pub, onClose, onAuthorClick }: { pub: any; onClose: () => void; onAuthorClick: (name: string) => void }) {
  const [copied, setCopied] = useState(false);
  const apa = pub.citation_apa || buildAPA(pub);

  const handleCopy = () => {
    navigator.clipboard.writeText(apa).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Parse authors string into clickable chips
  // Authors can be separated by ";" or "," or " and "
  const parseAuthors = (str: string): string[] => {
    if (!str) return [];
    return str.split(/;|,| and /).map(a => a.trim()).filter(Boolean);
  };

  const authors = parseAuthors(pub.auteurs);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <h2 className="text-white font-bold text-sm leading-snug line-clamp-2">{pub.titre}</h2>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 p-1 hover:bg-blue-500 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {pub.annee && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{pub.annee}</span>}
            {pub.source_scraping && (
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {pub.source_scraping}
              </span>
            )}
            {pub.chercheur_categorie && pub.chercheur_categorie !== "Externe" && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[pub.chercheur_categorie] || ""}`}>
                {pub.chercheur_categorie}
              </span>
            )}
          </div>

          {/* Journal */}
          {pub.journal_ou_editeur && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Journal / Venue</p>
              <p className="text-sm text-gray-700 italic">{pub.journal_ou_editeur}</p>
            </div>
          )}

          {/* Authors — clickable chips */}
          {authors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Auteurs</p>
              <div className="flex flex-wrap gap-2">
                {authors.map((author, i) => (
                  <button key={i}
                    onClick={() => { onClose(); onAuthorClick(author); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-medium transition-colors border border-blue-200 hover:border-blue-300">
                    <User className="w-3 h-3" />
                    {author}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Cliquez sur un auteur pour voir son profil</p>
            </div>
          )}

          {/* APA Citation */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Citation APA 7</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed border border-gray-200">
              <p dangerouslySetInnerHTML={{ __html: apa.replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copie !" : "Copier la citation"}
            </button>
            {(pub.doi || pub.url) && (
              <a href={pub.doi ? `https://doi.org/${pub.doi}` : pub.url}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" /> Voir en ligne
              </a>
            )}
            {/* View researcher profile */}
            <button onClick={() => { onClose(); onAuthorClick(pub.chercheur_nom); }}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all ml-auto">
              <User className="w-4 h-4" /> Profil chercheur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PubSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GestionPublications() {
  const [search, setSearch]           = useState("");
  const [chercheur, setChercheur]     = useState("");
  const [annee, setAnnee]             = useState("");
  const [source, setSource]           = useState("Tous");
  const [page, setPage]               = useState(0);
  const [data, setData]               = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [stats, setStats]             = useState<any>(null);
  const [chercheurs, setChercheurs]   = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [selectedPub, setSelectedPub] = useState<any>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    Promise.all([articlesApi.getStats(), articlesApi.getChercheurs()])
      .then(([s, c]) => { setStats(s); setChercheurs(c); })
      .catch(console.error);
  }, []);

  const load = useCallback(() => {
    setIsLoading(true);
    articlesApi.getAll({
      search:    search || undefined,
      chercheur: chercheur || undefined,
      annee:     annee ? Number(annee) : undefined,
      source:    source !== "Tous" ? source : undefined,
      limit:     LIMIT,
      offset:    page * LIMIT,
    }).then(setData).catch(console.error).finally(() => setIsLoading(false));
  }, [search, chercheur, annee, source, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, chercheur, annee, source]);

  const totalPages = Math.ceil(data.total / LIMIT);
  const years = Array.from({ length: 6 }, (_, i) => 2026 - i);
  const sources = ["Tous", "DBLP", "OpenAlex/WOS", "Scopus", "Google Scholar", "ResearchGate"];
  const hasFilters = !!(chercheur || annee || source !== "Tous");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications Scientifiques</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.total.toLocaleString()} publications indexees — LARODEC
          </p>
        </div>
        <button onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            showFilters || hasFilters ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}>
          <Filter className="w-4 h-4" /> Filtres
          {hasFilters && <span className="w-2 h-2 bg-yellow-300 rounded-full" />}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total?.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total publications</p>
          </div>
          {(stats.par_source || []).slice(0, 3).map((s: any) => (
            <div key={s.source_scraping} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{Number(s.total).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.source_scraping || "Manuel"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher par titre, auteur, journal..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Chercheur</label>
            <select value={chercheur} onChange={e => setChercheur(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Tous les chercheurs</option>
              {chercheurs.map((c: any) => (
                <option key={c.chercheur_nom} value={c.chercheur_nom}>
                  {c.chercheur_nom} ({c.nb_pubs})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Annee</label>
            <select value={annee} onChange={e => setAnnee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Toutes les annees</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Source</label>
            <select value={source} onChange={e => setSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              {sources.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {chercheur && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {chercheur} <button onClick={() => setChercheur("")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {annee && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {annee} <button onClick={() => setAnnee("")}><X className="w-3 h-3" /></button>
            </span>
          )}
          {source !== "Tous" && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {source} <button onClick={() => setSource("Tous")}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={() => { setChercheur(""); setAnnee(""); setSource("Tous"); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline">Effacer tout</button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <PubSkeleton key={i} />)}</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">Aucune publication trouvee</p>
          <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((pub: any) => (
            <button key={pub.id} onClick={() => setSelectedPub(pub)}
              className="w-full bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all text-left group">
              <div className="flex items-start gap-4">
                {/* Year */}
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                  <span className="text-sm font-bold text-blue-700">{pub.annee || "—"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors mb-1">
                    {pub.titre}
                  </h3>
                  {pub.journal_ou_editeur && (
                    <p className="text-xs text-gray-500 italic mb-1.5 truncate">{pub.journal_ou_editeur}</p>
                  )}
                  {pub.auteurs && (
                    <p className="text-xs text-gray-400 truncate mb-2">{pub.auteurs}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {pub.chercheur_nom}
                    </span>
                    {pub.chercheur_categorie && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[pub.chercheur_categorie] || CAT_COLORS["Externe"]}`}>
                        {pub.chercheur_categorie}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {pub.source_scraping || "Manuel"}
                    </span>
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" /> DOI
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">APA</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, data.total)} sur {data.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg">
              {page + 1} / {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPub && (
        <PubModal
          pub={selectedPub}
          onClose={() => setSelectedPub(null)}
          onAuthorClick={name => setSelectedAuthor(name)}
        />
      )}
      {selectedAuthor && (
        <ResearcherModal
          name={selectedAuthor}
          onClose={() => setSelectedAuthor(null)}
        />
      )}
    </div>
  );
}
