import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, ExternalLink, Copy, Check,
  X, BookOpen, User, Building2, ChevronDown, ChevronUp,
  TrendingUp, Database, Globe, BookMarked, Presentation,
} from "lucide-react";
import { articlesApi, researchersApi } from "../../lib/api";

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_ACTIVE_CLASS: Record<string, string> = {
  all:         "bg-blue-600 text-white shadow-sm",
  revues:      "bg-emerald-600 text-white shadow-sm",
  conferences: "bg-violet-600 text-white shadow-sm",
  ouvrages:    "bg-amber-600 text-white shadow-sm",
};

const CAT_CONFIG: Record<string, {
  label: string; icon: React.ElementType; color: string;
  gradient: string; description?: string; badge?: string;
  typeFilter: string[] | null;
}> = {
  all: {
    label: "Toutes les publications", icon: BookOpen, color: "blue",
    gradient: "from-blue-600 to-cyan-600", typeFilter: null,
  },
  revues: {
    label: "Revues Internationales", icon: Globe, color: "emerald",
    gradient: "from-emerald-600 to-teal-600",
    description: "Articles publiés dans des revues à comité de lecture indexées",
    badge: "JCR · Scopus · WOS",
    typeFilter: ["journal-article", "article", "Article"],
  },
  conferences: {
    label: "Actes de Conférences & Workshops", icon: Presentation, color: "violet",
    gradient: "from-violet-600 to-purple-600",
    description: "Communications dans des conférences et workshops internationaux",
    badge: "IEEE · ACM · Springer",
    typeFilter: ["inproceedings", "conference paper", "Conference Paper", "paper-conference"],
  },
  ouvrages: {
    label: "Ouvrages & Chapitres d'Ouvrages", icon: BookMarked, color: "amber",
    gradient: "from-amber-600 to-orange-600",
    description: "Livres, chapitres de livres et ouvrages collectifs",
    badge: "Books · Chapters",
    typeFilter: ["book", "book-chapter", "book_chapter", "Books and Theses", "Editorship", "Parts in Books or Collections", "chapter", "livre"],
  },
};

// ─── Pub type detection ───────────────────────────────────────────────────────
function getPubCategory(pub: any): "revues" | "conferences" | "ouvrages" | "other" {
  const type = (pub.type_publication || "").toLowerCase();
  if (["book", "book-chapter", "chapter", "livre", "editorship"].some(t => type.includes(t))) return "ouvrages";
  if (["inproceedings", "conference", "paper-conference", "workshop"].some(t => type.includes(t))) return "conferences";
  if (["journal", "article", "review"].some(t => type.includes(t))) return "revues";
  return "other";
}

const PUB_STYLES = {
  revues:      { band: "from-emerald-500 to-teal-500",  badge: "Revue",       badgeClass: "bg-emerald-100 text-emerald-700" },
  conferences: { band: "from-violet-500 to-purple-500", badge: "Conférence",  badgeClass: "bg-violet-100 text-violet-700"  },
  ouvrages:    { band: "from-amber-500 to-orange-500",  badge: "Ouvrage",     badgeClass: "bg-amber-100 text-amber-700"    },
  other:       { band: "from-slate-400 to-slate-500",   badge: "Publication", badgeClass: "bg-gray-100 text-gray-600"      },
};

const SRC_COLORS: Record<string, string> = {
  "DBLP":          "bg-blue-50 text-blue-600 border-blue-200",
  "OpenAlex/WOS":  "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Scopus":        "bg-orange-50 text-orange-600 border-orange-200",
  "Google Scholar":"bg-red-50 text-red-600 border-red-200",
  "ResearchGate":  "bg-teal-50 text-teal-600 border-teal-200",
};

const CAT_COLORS: Record<string, string> = {
  "Corps A":  "bg-purple-100 text-purple-700",
  "Corps B":  "bg-blue-100 text-blue-700",
  "Post-Doc": "bg-orange-100 text-orange-700",
  "Doctorant":"bg-indigo-100 text-indigo-700",
  "Master Recherche": "bg-green-100 text-green-700",
  "Externe":  "bg-gray-100 text-gray-500",
};

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PubSkeleton() {
  return (
    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
      className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Researcher Modal ─────────────────────────────────────────────────────────
function ResearcherModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openPubs, setOpenPubs] = useState(true);

  useEffect(() => {
    researchersApi.getProfile(name).then(setData).catch(console.error).finally(() => setIsLoading(false));
  }, [name]);

  const p = data?.profile;
  const pubs = data?.publications || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">{name[0]}</div>
            <div>
              <h2 className="font-bold">{name}</h2>
              {p?.grade && <p className="text-blue-100 text-xs">{p.grade}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-white">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                    {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
                    {p?.grade && <p className="text-blue-600 font-semibold text-sm mb-1">{p.grade}</p>}
                    {p?.etablissement && (
                      <p className="text-gray-600 text-sm flex items-center gap-1.5 mb-0.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />{p.etablissement}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {p?.categorie && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[p.categorie] || CAT_COLORS["Externe"]}`}>{p.categorie}</span>
                      )}
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {data?.nb_publications} publication{data?.nb_publications !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <button onClick={() => setOpenPubs(o => !o)}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl mb-4 hover:from-blue-700 hover:to-cyan-700 transition-all">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-semibold text-sm">Publications ({pubs.length})</span>
                  </div>
                  {openPubs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openPubs && (
                  pubs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Aucune publication enregistrée</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pubs.map((pub: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                          <span className="flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg mt-0.5">{pub.annee}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{pub.titre}</p>
                            {pub.journal_ou_editeur && <p className="text-xs text-gray-500 italic mt-0.5">{pub.journal_ou_editeur}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Pub Modal ────────────────────────────────────────────────────────────────
function PubModal({ pub, labMembers, onClose, onAuthorClick }: {
  pub: any; labMembers: Set<string>; onClose: () => void; onAuthorClick: (name: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const apa = pub.citation_apa || buildAPA(pub);

  const handleCopy = () => {
    navigator.clipboard.writeText(apa).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const parseAuthors = (str: string): string[] => {
    if (!str) return [];
    return str.split(/;|,| and /).map((a: string) => a.trim()).filter(Boolean);
  };

  const isLabMember = (author: string): boolean => {
    if (!author || author.length < 3) return false;
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim();
    const authorNorm = norm(author);
    const authorParts = authorNorm.split(/\s+/).filter(p => p.length > 2);
    for (const member of labMembers) {
      const memberNorm = norm(member);
      const memberParts = memberNorm.split(/\s+/).filter(p => p.length > 2);
      if (memberNorm === authorNorm) return true;
      const authorMatchCount = authorParts.filter(ap => memberParts.includes(ap)).length;
      const memberMatchCount = memberParts.filter(mp => authorParts.includes(mp)).length;
      if (authorMatchCount >= 2 && memberMatchCount >= 2) return true;
    }
    return false;
  };

  const authors = parseAuthors(pub.auteurs);
  const pubCat = getPubCategory(pub);
  const style = PUB_STYLES[pubCat];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className={`bg-gradient-to-r ${style.band} px-6 py-5 flex items-start justify-between`}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <BookOpen className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <h2 className="text-white font-bold text-sm leading-snug line-clamp-3">{pub.titre}</h2>
          </div>
          <button onClick={onClose} className="ml-3 flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${style.badgeClass}`}>{style.badge}</span>
            {pub.annee && <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{pub.annee}</span>}
            {pub.source_scraping && (
              <span className={`text-xs px-3 py-1 rounded-full border font-medium ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {pub.source_scraping}
              </span>
            )}
            {pub.indexation && <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">{pub.indexation}</span>}
          </div>
          {pub.journal_ou_editeur && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Journal / Venue</p>
              <p className="text-sm text-gray-700 italic">{pub.journal_ou_editeur}</p>
            </div>
          )}
          {authors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Auteurs</p>
              <div className="flex flex-wrap gap-2">
                {authors.map((author, i) => {
                  const inLab = isLabMember(author);
                  return inLab ? (
                    <button key={i} onClick={() => { onClose(); onAuthorClick(author); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold transition-all shadow-sm">
                      <User className="w-3 h-3" />{author}
                      <span className="text-blue-200 text-xs">LARODEC</span>
                    </button>
                  ) : (
                    <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs">{author}</span>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Citation APA 7</p>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed border border-blue-100">
              <p dangerouslySetInnerHTML={{ __html: apa.replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            </div>
          </div>
          <div className="flex gap-3 pt-1 flex-wrap">
            <button onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier APA"}
            </button>
            {(pub.doi || pub.url) && (
              <a href={pub.doi ? `https://doi.org/${pub.doi}` : pub.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" /> Voir en ligne
              </a>
            )}
            <button onClick={() => { onClose(); onAuthorClick(pub.chercheur_nom); }}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all ml-auto">
              <User className="w-4 h-4" /> Profil chercheur
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function GestionPublications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = (searchParams.get("cat") || "all") as keyof typeof CAT_CONFIG;

  const [items, setItems]         = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage]           = useState(0);
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPub, setSelectedPub]         = useState<any | null>(null);
  const [selectedAuthor, setSelectedAuthor]   = useState<string | null>(null);
  const [labMembers, setLabMembers]           = useState<Set<string>>(new Set());
  const [stats, setStats]         = useState<any>(null);
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when category changes
  useEffect(() => { setPage(0); }, [cat]);

  useEffect(() => {
    researchersApi.getAll().then(data => {
      setLabMembers(new Set((data || []).map((r: any) => r.nom_prenom)));
    }).catch(console.error);
    articlesApi.getStats().then(setStats).catch(console.error);
  }, []);

  const load = useCallback(() => {
    setIsLoading(true);
    const config = CAT_CONFIG[cat] || CAT_CONFIG.all;
    articlesApi.getAll({
      search:      debouncedSearch || undefined,
      limit:       LIMIT,
      offset:      page * LIMIT,
      type_filter: config.typeFilter ? config.typeFilter.join(",") : undefined,
    })
      .then(res => { setItems(res.items || []); setTotal(res.total || 0); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, page, cat]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const config = CAT_CONFIG[cat] || CAT_CONFIG.all;
  const Icon = config.icon;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Hero ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cat}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
          className={`relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br ${config.gradient} p-7`}
        >
          <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
                <Icon className="w-7 h-7 text-white" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">LARODEC — Publications</p>
                <h1 className="text-2xl font-black text-white">{config.label}</h1>
                {config.description && <p className="text-white/70 text-xs mt-0.5">{config.description}</p>}
              </motion.div>
            </div>
            <div className="flex items-center gap-3">
              {config.badge && (
                <span className="px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-full border border-white/30">{config.badge}</span>
              )}
              <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="px-4 py-2 bg-white/25 text-white text-sm font-bold rounded-xl border border-white/30">
                {total.toLocaleString()} publications
              </motion.span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Category tabs ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {Object.entries(CAT_CONFIG).map(([key, cfg]) => {
          const CfgIcon = cfg.icon;
          const isActive = cat === key;
          return (
            <motion.button key={key}
              onClick={() => { setSearchParams(key === "all" ? {} : { cat: key }); setPage(0); }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? CAT_ACTIVE_CLASS[key] || "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}>
              <CfgIcon className="w-4 h-4" />
              {cfg.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── Stats bar ── */}
      {stats && cat === "all" && (
        <div className="flex gap-3 flex-wrap mb-5">
          {[
            { icon: Database,   label: "Total",      value: stats.total,                                                                    colorClass: "bg-blue-50 text-blue-700 border-blue-100"   },
            { icon: TrendingUp, label: "WOS/Scopus", value: (stats.by_source?.["OpenAlex/WOS"] || 0) + (stats.by_source?.["Scopus"] || 0), colorClass: "bg-purple-50 text-purple-700 border-purple-100" },
            { icon: Globe,      label: "DBLP",       value: stats.by_source?.["DBLP"] || 0,                                                colorClass: "bg-cyan-50 text-cyan-700 border-cyan-100"   },
          ].map(({ icon: SIcon, label, value, colorClass }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${colorClass}`}>
              <SIcon className="w-4 h-4" /><span>{value} {label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative mb-5 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher titre, auteur, journal..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Count + pagination top ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{total} publication(s)</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-600 font-medium">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <PubSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucune publication trouvée</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {items.map((pub, i) => {
            const pubCat = getPubCategory(pub);
            const style = PUB_STYLES[pubCat];
            return (
              <motion.div key={pub.id ?? i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                onClick={() => setSelectedPub(pub)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group transition-all"
              >
                <div className="flex gap-4 p-5">
                  <div className={`w-1 rounded-full bg-gradient-to-b ${style.band} flex-shrink-0`} />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.band} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                    {pub.annee || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-1.5">
                      {pub.titre}
                    </h3>
                    {pub.journal_ou_editeur && (
                      <p className="text-xs text-gray-500 italic mb-2 line-clamp-1">{pub.journal_ou_editeur}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.badgeClass}`}>{style.badge}</span>
                      {pub.source_scraping && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SRC_COLORS[pub.source_scraping] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {pub.source_scraping}
                        </span>
                      )}
                      {pub.chercheur_nom && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1">
                          <User className="w-3 h-3" />{pub.chercheur_nom}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Pagination bottom ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-all">
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedPub && (
          <PubModal pub={selectedPub} labMembers={labMembers} onClose={() => setSelectedPub(null)}
            onAuthorClick={name => { setSelectedPub(null); setSelectedAuthor(name); }} />
        )}
        {selectedAuthor && (
          <ResearcherModal name={selectedAuthor} onClose={() => setSelectedAuthor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
