import { useState, useEffect, useCallback } from "react";
import { Search, BookOpen, Loader2, ExternalLink, Copy, Check, X, User, ChevronLeft, ChevronRight } from "lucide-react";
import { ouvragesApi, researchersApi } from "../../lib/api";

function buildAPA(p) {
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

const CAT_COLORS = {
  "Corps A":  "bg-blue-100 text-blue-700",
  "Corps B":  "bg-indigo-100 text-indigo-700",
  "Post-Doc": "bg-orange-100 text-orange-700",
  "Doctorant":"bg-purple-100 text-purple-700",
  "Master":   "bg-green-100 text-green-700",
  "Externe":  "bg-gray-100 text-gray-500",
};

function APAModal({ pub, onClose, onAuthorClick }) {
  const [copied, setCopied] = useState(false);
  const apa = pub.citation_apa || buildAPA(pub);
  const handleCopy = () => {
    navigator.clipboard.writeText(apa).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const authors = (pub.auteurs || "").split(/;|,| and /).map(a => a.trim()).filter(Boolean);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <h2 className="text-white font-bold text-sm leading-snug line-clamp-2">{pub.titre}</h2>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 p-1 hover:bg-blue-500 rounded-lg"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {pub.annee && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{pub.annee}</span>}
            {pub.type_publication && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">{pub.type_publication}</span>}
            {pub.chercheur_categorie && pub.chercheur_categorie !== "Externe" && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[pub.chercheur_categorie] || ""}`}>{pub.chercheur_categorie}</span>
            )}
          </div>
          {pub.journal_ou_editeur && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Editeur / Venue</p>
              <p className="text-sm text-gray-700 italic">{pub.journal_ou_editeur}</p>
            </div>
          )}
          {authors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Auteurs</p>
              <div className="flex flex-wrap gap-2">
                {authors.map((author, i) => (
                  <button key={i} onClick={() => { onClose(); onAuthorClick(author); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-medium transition-colors border border-blue-200">
                    <User className="w-3 h-3" />{author}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Cliquez sur un auteur pour voir son profil</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Citation APA 7</p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed border border-gray-200">
              <p dangerouslySetInnerHTML={{ __html: apa.replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copie !" : "Copier la citation"}
            </button>
            {(pub.doi || pub.url) && (
              <a href={pub.doi ? `https://doi.org/${pub.doi}` : pub.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                <ExternalLink className="w-4 h-4" /> Voir en ligne
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearcherModal({ name, onClose }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    researchersApi.getProfile(name).then(setData).catch(console.error).finally(() => setIsLoading(false));
  }, [name]);
  const p = data?.profile;
  const pubs = data?.publications || [];
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold">{name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-blue-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
          ) : (
            <>
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-200 flex-shrink-0">
                  {p?.url_photo ? <img src={p.url_photo} alt={name} className="w-full h-full object-cover rounded-xl" /> : <User className="w-10 h-10 text-blue-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-700">{name}</h3>
                  {p?.grade && <p className="text-gray-700 font-medium text-sm">{p.grade}</p>}
                  {p?.etablissement && <p className="text-gray-500 text-sm">{p.etablissement}</p>}
                  {p?.categorie && <span className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[p.categorie] || CAT_COLORS["Externe"]}`}>{p.categorie}</span>}
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-3">Publications ({pubs.length})</h4>
              {pubs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucune publication enregistree</p>
              ) : (
                <div className="space-y-2">
                  {pubs.map((pub, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded flex-shrink-0">{pub.annee}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{pub.titre}</p>
                        {pub.journal_ou_editeur && <p className="text-xs text-gray-500 italic mt-0.5">{pub.journal_ou_editeur}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="flex gap-2 mt-2"><div className="h-5 w-20 bg-gray-100 rounded-full" /><div className="h-5 w-16 bg-gray-100 rounded-full" /></div>
        </div>
      </div>
    </div>
  );
}

export function GestionOuvrages() {
  const [activeTab, setActiveTab] = useState("book");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(0);
  const [data, setData]           = useState({ items: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPub, setSelectedPub]     = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const LIMIT = 20;

  const load = useCallback(() => {
    setIsLoading(true);
    ouvragesApi.getFromArticles({ type_filter: activeTab, search: search || undefined, limit: LIMIT, offset: page * LIMIT })
      .then(setData).catch(console.error).finally(() => setIsLoading(false));
  }, [activeTab, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [activeTab, search]);

  const totalPages = Math.ceil(data.total / LIMIT);
  const tabs = [
    { key: "book",    label: "Ouvrages (Livres)",     desc: "Livres et monographies" },
    { key: "chapter", label: "Chapitres d'ouvrage",   desc: "Chapitres dans des ouvrages collectifs" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ouvrages Scientifiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">{data.total} entree(s) — donnees reelles depuis la base</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 font-medium text-sm transition-all relative ${activeTab === tab.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
            {tab.label}
            {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher titre, auteur..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-500">Aucun {activeTab === "book" ? "ouvrage" : "chapitre"} trouve</p>
          <p className="text-sm mt-1 text-gray-400">Les types recherches : {activeTab === "book" ? "book, livre, books and theses" : "book-chapter, chapter, parts in books or collections"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((pub, idx) => (
            <button key={pub.id || idx} onClick={() => setSelectedPub(pub)}
              className="w-full bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all text-left group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                  <span className="text-sm font-bold text-blue-700">{pub.annee || "—"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors mb-1">{pub.titre}</h3>
                  {pub.journal_ou_editeur && <p className="text-xs text-gray-500 italic mb-1.5 truncate">{pub.journal_ou_editeur}</p>}
                  {pub.auteurs && <p className="text-xs text-gray-400 truncate mb-2">{pub.auteurs}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{pub.chercheur_nom}</span>
                    {pub.chercheur_categorie && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[pub.chercheur_categorie] || CAT_COLORS["Externe"]}`}>{pub.chercheur_categorie}</span>}
                    {pub.type_publication && <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">{pub.type_publication}</span>}
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">{page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, data.total)} sur {data.total}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {selectedPub && <APAModal pub={selectedPub} onClose={() => setSelectedPub(null)} onAuthorClick={name => { setSelectedPub(null); setSelectedAuthor(name); }} />}
      {selectedAuthor && <ResearcherModal name={selectedAuthor} onClose={() => setSelectedAuthor(null)} />}
    </div>
  );
}