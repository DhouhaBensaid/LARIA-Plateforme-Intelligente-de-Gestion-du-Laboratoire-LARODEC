import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search, ArrowLeft, BookOpen, ChevronLeft, ChevronRight,
  ExternalLink, Copy, Check, X, User, Layers, FileText, Mic, BookMarked,
  Loader2, Calendar, SlidersHorizontal, Sparkles,
} from "lucide-react";
import { BackgroundLogo } from "./BackgroundLogo";

/* ─── Types ──────────────────────────────────────────────────────────────── */
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
  total: number; page: number;
  results: PublicationWithScore[];
  semantic: boolean; fallback_message?: string;
}

const BASE = "http://localhost:3001";
const LIMIT = 20;
const YEAR_MIN = 1990;
const YEAR_MAX = new Date().getFullYear();

/* ─── Constants ──────────────────────────────────────────────────────────── */
const TYPE_FILTERS = [
  { key: "all",        label: "Toutes",                 icon: Layers,    },
  { key: "revue",      label: "Revues",                 icon: FileText,  },
  { key: "conference", label: "Conférences",            icon: Mic,       },
  { key: "workshop",   label: "Workshops",              icon: SlidersHorizontal },
  { key: "ouvrage",    label: "Ouvrages",               icon: BookMarked },
];

const SRC_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  "DBLP":          { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  "OpenAlex/WOS":  { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  "Scopus":        { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  "Google Scholar":{ bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  "revue":      { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" },
  "conference": { bg: "#ECFEFF", color: "#0E7490", border: "#A5F3FC" },
  "workshop":   { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  "ouvrage":    { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
};

/* ─── APA builder ────────────────────────────────────────────────────────── */
function buildAPA(p: PublicationWithScore) {
  let ref = `${p.auteurs || ""} (${p.annee || "s.d."}). ${p.titre || ""}.`;
  if (p.journal_ou_editeur) ref += ` *${p.journal_ou_editeur}*.`;
  if (p.doi) ref += ` https://doi.org/${p.doi}`;
  return ref;
}

/* ─── Pill badge ─────────────────────────────────────────────────────────── */
function Pill({ bg, color, border, children }: { bg:string; color:string; border:string; children:React.ReactNode }) {
  return (
    <span style={{ background:bg, color, border:`1px solid ${border}`, fontSize:11, padding:"2px 8px", borderRadius:999, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}>
      {children}
    </span>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function PubModal({ pub, onClose }: { pub: PublicationWithScore; onClose: () => void }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const apa = pub.citation_apa || buildAPA(pub);
  const link = pub.doi ? `https://doi.org/${pub.doi}` : pub.url;
  const ts = pub.type_publication?.toLowerCase();
  const tStyle = ts && TYPE_STYLE[ts] ? TYPE_STYLE[ts] : { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
        style={{ animation: "modal-in 0.2s cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1A1A4E 0%, #1A73E8 100%)", padding: "20px 24px" }}
          className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: 8, flexShrink: 0 }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              {pub.annee && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{pub.annee}</span>}
              <h2 className="text-white font-bold text-sm leading-snug mt-0.5 line-clamp-2">{pub.titre}</h2>
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.15)" }} onMouseEnter={e => (e.currentTarget.style.background="rgba(255,255,255,0.25)")} onMouseLeave={e => (e.currentTarget.style.background="rgba(255,255,255,0.15)")}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "65vh" }}>
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {pub.annee && <Pill bg="#EEF4FF" color="#1A73E8" border="#BFDBFE">{pub.annee}</Pill>}
            {ts && TYPE_STYLE[ts] && <Pill {...tStyle}>{pub.type_publication}</Pill>}
            {pub.source_scraping && SRC_STYLE[pub.source_scraping] && <Pill {...SRC_STYLE[pub.source_scraping]}>{pub.source_scraping}</Pill>}
            {pub.indexation && <Pill bg="#F5F3FF" color="#7C3AED" border="#DDD6FE">{pub.indexation}</Pill>}
          </div>

          {/* Journal */}
          {pub.journal_ou_editeur && (
            <div style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Journal / Venue</p>
              <p style={{ fontSize: 13, color: "#374151", fontStyle: "italic" }}>{pub.journal_ou_editeur}</p>
            </div>
          )}

          {/* Auteurs */}
          {pub.auteurs && (
            <div style={{ background: "#F8FAFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Auteurs</p>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{pub.auteurs}</p>
            </div>
          )}

          {/* Chercheur link */}
          {pub.chercheur_nom && (
            <button onClick={() => { onClose(); navigate(`/public/researcher/${encodeURIComponent(pub.chercheur_nom!)}`); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group"
              style={{ background: "#EEF4FF", border: "1px solid #BFDBFE", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#DBEAFE"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF4FF"; }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1A73E8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A73E8" }}>{pub.chercheur_nom}</span>
                <span style={{ fontSize: 11, color: "#64748B", marginLeft: 8 }}>Membre LARODEC</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1A73E8" }} />
            </button>
          )}

          {/* APA */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Citation APA 7</p>
            <div style={{ background: "linear-gradient(135deg, #EEF4FF, #F0FDFA)", border: "1px solid #BFDBFE", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 13, color: "#1E293B", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: apa.replace(/\*(.*?)\*/g, "<em>$1</em>") }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={() => { navigator.clipboard.writeText(apa); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: copied ? "#16A34A" : "#1A73E8", color: "white", border: "none", cursor: "pointer" }}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier APA"}
            </button>
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: "1px solid #E2E8F0", color: "#374151", textDecoration: "none", background: "white" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAFF"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}>
                <ExternalLink className="w-4 h-4" /> Voir en ligne
              </a>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes modal-in{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

/* ─── Publication card ───────────────────────────────────────────────────── */
function PubCard({ pub, index, isSemantic, onClick }: { pub: PublicationWithScore; index: number; isSemantic: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const ts = pub.type_publication?.toLowerCase();
  const tStyle = ts && TYPE_STYLE[ts];
  const sStyle = pub.source_scraping && SRC_STYLE[pub.source_scraping];
  const link = pub.doi ? `https://doi.org/${pub.doi}` : pub.url;
  const pct = isSemantic && pub.score !== undefined && pub.score < 1.0 ? Math.round(pub.score * 100) : null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left"
      style={{
        display: "block", background: "white", borderRadius: 14,
        border: `1px solid ${hovered ? "#BFDBFE" : "#F1F5F9"}`,
        boxShadow: hovered ? "0 8px 24px rgba(26,115,232,0.10)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.18s ease",
        padding: "16px 20px",
        animation: `fade-up 0.3s ease-out ${index * 30}ms both`,
        cursor: "pointer",
      }}>
      <div className="flex gap-4 items-start">

        {/* Year badge */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, #1A1A4E, #1A73E8)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(26,115,232,0.25)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "white", lineHeight: 1 }}>
            {pub.annee ? String(pub.annee).slice(2) : "?"}
          </span>
          {pub.annee && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", lineHeight: 1, marginTop: 1 }}>
            {String(pub.annee).slice(0, 2)}
          </span>}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: hovered ? "#1A73E8" : "#0F172A", lineHeight: 1.45, marginBottom: 4, transition: "color 0.15s" }}
            className="line-clamp-2">
            {pub.titre}
          </h3>

          {/* Journal */}
          {pub.journal_ou_editeur && (
            <p style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginBottom: 8 }} className="line-clamp-1">
              {pub.journal_ou_editeur}
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {tStyle && <Pill {...tStyle}>{pub.type_publication}</Pill>}
            {sStyle && <Pill {...SRC_STYLE[pub.source_scraping!]}>{pub.source_scraping}</Pill>}
            {pub.indexation && <Pill bg="#F5F3FF" color="#7C3AED" border="#DDD6FE">{pub.indexation}</Pill>}
            {pub.chercheur_nom && (
              <Pill bg="#EEF4FF" color="#1A73E8" border="#BFDBFE">
                <User style={{ width: 10, height: 10 }} />{pub.chercheur_nom}
              </Pill>
            )}
            {pct !== null && (
              <Pill bg={pct>=75?"#F0FDF4":pct>=50?"#EEF4FF":"#F8FAFF"} color={pct>=75?"#16A34A":pct>=50?"#1A73E8":"#64748B"} border={pct>=75?"#BBF7D0":pct>=50?"#BFDBFE":"#E2E8F0"}>
                <Sparkles style={{ width: 10, height: 10 }} />{pct}%
              </Pill>
            )}
          </div>

          {/* Pertinence bar */}
          {pct !== null && (
            <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #1A73E8, #0891B2)", borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
          )}
        </div>

        {/* Arrow + link */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: hovered ? "#EEF4FF" : "#F8FAFF", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
            <ChevronRight style={{ width: 16, height: 16, color: hovered ? "#1A73E8" : "#CBD5E1" }} />
          </div>
          {link && hovered && (
            <span style={{ fontSize: 11, color: "#1A73E8", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              <ExternalLink style={{ width: 10, height: 10 }} />Lire
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export function PublicationsPage() {
  const navigate = useNavigate();
  const [items, setItems]       = useState<PublicationWithScore[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);
  const [search, setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [chercheurInput, setChercheurInput] = useState("");
  const [debouncedChercheur, setDebouncedChercheur] = useState("");
  const [yearFrom, setYearFrom] = useState(YEAR_MIN);
  const [yearTo, setYearTo]     = useState(YEAR_MAX);
  const [showYears, setShowYears] = useState(false);
  const [page, setPage]         = useState(0);
  const [selectedPub, setSelectedPub] = useState<PublicationWithScore | null>(null);
  const [isSemantic, setIsSemantic] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 380); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const t = setTimeout(() => { setDebouncedChercheur(chercheurInput); setPage(0); }, 380); return () => clearTimeout(t); }, [chercheurInput]);

  const load = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    if (!debouncedSearch && !debouncedChercheur && typeFilter === "all" && page === 0) setLoading(true);
    else setSearching(true);
    setSearchError(null); setFallbackMessage(null);
    const body = {
      query: debouncedSearch,
      type: typeFilter !== "all" ? typeFilter : undefined,
      chercheur: debouncedChercheur || undefined,
      year_from: yearFrom > YEAR_MIN ? yearFrom : undefined,
      year_to: yearTo < YEAR_MAX ? yearTo : undefined,
      page, limit: LIMIT,
    };
    fetch(`${BASE}/api/public/publications/search-semantic`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body), signal:ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<SemanticSearchResponse>; })
      .then(d => { setItems(d.results||[]); setTotal(d.total||0); setIsSemantic(d.semantic??false); setFallbackMessage(d.fallback_message??null); })
      .catch(err => {
        if (err.name === "AbortError") return;
        fetch(`${BASE}/api/public/publications/search-semantic`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ query:"", page:0, limit:LIMIT }) })
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.results?.length > 0) { setItems(d.results); setTotal(d.total||0); setIsSemantic(false); setFallbackMessage("Voici les dernières publications disponibles."); } else setSearchError("Impossible de charger les publications pour le moment."); })
          .catch(() => setSearchError("Impossible de charger les publications pour le moment."));
      })
      .finally(() => { setLoading(false); setSearching(false); });
  }, [debouncedSearch, typeFilter, debouncedChercheur, yearFrom, yearTo, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = typeFilter !== "all" || debouncedChercheur || debouncedSearch;
  const yearsActive = yearFrom > YEAR_MIN || yearTo < YEAR_MAX;

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFF" }}>
      <BackgroundLogo size={320} opacity={0.08} rotate={-12} top={40} right={-40} />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1A73E8 100%)" }}>
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage:"radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize:"28px 28px" }} />
        {/* Glow orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20" style={{ background:"radial-gradient(circle, #60A5FA, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-15" style={{ background:"radial-gradient(circle, #34D399, transparent 70%)" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-8 text-sm font-medium group"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "7px 14px", color: "rgba(255,255,255,0.85)", cursor: "pointer" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Retour à l'accueil
          </button>

          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              {/* LARODEC radar logo */}
              <div style={{ width: 68, height: 68, borderRadius: 18, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg viewBox="0 0 44 44" fill="none" style={{ width:40, height:40 }}>
                  <circle cx="22" cy="22" r="16" stroke="white" strokeWidth="2.2"/>
                  <circle cx="22" cy="22" r="9"  stroke="white" strokeWidth="1.8"/>
                  <circle cx="22" cy="22" r="3"  fill="white"/>
                  <line x1="25.5" y1="22" x2="38" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="33"   y1="17" x2="38" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                  <line x1="33"   y1="27" x2="38" y2="22" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>LARODEC — ISG Tunis</div>
                <h1 style={{ fontSize:"clamp(32px,5vw,48px)", fontWeight:900, color:"white", letterSpacing:"-0.03em", lineHeight:1.05, margin:0 }}>
                  Publications<br/>
                  <span style={{ background:"linear-gradient(90deg, #60A5FA, #34D399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Scientifiques</span>
                </h1>
                <p style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginTop:6, fontWeight:400 }}>
                  Travaux de recherche du laboratoire LARODEC
                </p>
              </div>
            </div>

            {/* Counter */}
            <div style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:16, padding:"14px 24px", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(96,165,250,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <BookOpen className="w-5 h-5" style={{ color:"#93C5FD" }} />
              </div>
              <div>
                <div style={{ fontSize:30, fontWeight:900, color:"white", lineHeight:1 }}>{total || "—"}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:500, marginTop:2 }}>publications</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="max-w-6xl mx-auto px-6" style={{ marginTop: -20, position: "relative", zIndex: 10 }}>
        <div style={{ background:"white", borderRadius:18, boxShadow:"0 4px 32px rgba(0,0,0,0.08)", border:"1px solid #F1F5F9", padding:"20px 24px" }}>

          {/* Search bar */}
          <div style={{ position:"relative", marginBottom:16 }}>
            <Search style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:18, height:18, color:"#94A3B8" }} />
            <input
              type="text"
              placeholder="Rechercher par concept, titre, auteur, journal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", paddingLeft:44, paddingRight:44, paddingTop:12, paddingBottom:12, border:"1.5px solid #E2E8F0", borderRadius:12, fontSize:14, fontWeight:500, color:"#0F172A", outline:"none", background:"#F8FAFF", transition:"border 0.15s, background 0.15s", boxSizing:"border-box" }}
              onFocus={e => { e.target.style.borderColor="#1A73E8"; e.target.style.background="white"; }}
              onBlur={e => { e.target.style.borderColor="#E2E8F0"; e.target.style.background="#F8FAFF"; }}
            />
            {searching
              ? <Loader2 style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", width:16, height:16, color:"#1A73E8", animation:"spin 1s linear infinite" }} />
              : search
                ? <button onClick={() => setSearch("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex" }}><X style={{ width:16, height:16 }} /></button>
                : null
            }
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Type pills */}
            <div className="flex-1 min-w-0">
              <p style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Type</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map(f => {
                  const Icon = f.icon; const isA = typeFilter === f.key;
                  return (
                    <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(0); }}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:700, border:"none", cursor:"pointer", transition:"all 0.15s",
                        background: isA ? "#1A73E8" : "#F1F5F9", color: isA ? "white" : "#475569",
                        boxShadow: isA ? "0 2px 8px rgba(26,115,232,0.3)" : "none" }}>
                      <Icon style={{ width:12, height:12 }} />{f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chercheur */}
            <div style={{ width: 220 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Chercheur</p>
              <div style={{ position:"relative" }}>
                <User style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"#94A3B8" }} />
                <input
                  type="text" placeholder="Nom..." value={chercheurInput} onChange={e => setChercheurInput(e.target.value)}
                  style={{ width:"100%", paddingLeft:32, paddingRight:chercheurInput?28:10, paddingTop:8, paddingBottom:8, border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:13, outline:"none", background:"#F8FAFF", transition:"border 0.15s", boxSizing:"border-box" }}
                  onFocus={e => e.target.style.borderColor="#1A73E8"} onBlur={e => e.target.style.borderColor="#E2E8F0"}
                />
                {chercheurInput && <button onClick={() => setChercheurInput("")} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", display:"flex" }}><X style={{ width:13, height:13 }} /></button>}
              </div>
            </div>

            {/* Year toggle */}
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Période</p>
              <button onClick={() => setShowYears(v => !v)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, fontSize:12, fontWeight:700, border:`1.5px solid ${showYears||yearsActive?"#1A73E8":"#E2E8F0"}`, background:showYears||yearsActive?"#EEF4FF":"#F8FAFF", color:showYears||yearsActive?"#1A73E8":"#475569", cursor:"pointer" }}>
                <Calendar style={{ width:13, height:13 }} />
                {yearsActive ? `${yearFrom} – ${yearTo}` : "Toutes années"}
                <SlidersHorizontal style={{ width:12, height:12 }} />
              </button>
            </div>
          </div>

          {/* Year slider expanded */}
          {showYears && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #F1F5F9" }}>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <label style={{ fontSize:11, color:"#94A3B8" }}>De</label>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1A73E8" }}>{yearFrom}</span>
                  </div>
                  <input type="range" min={YEAR_MIN} max={yearTo-1} value={yearFrom} onChange={e => { setYearFrom(+e.target.value); setPage(0); }} className="w-full accent-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <label style={{ fontSize:11, color:"#94A3B8" }}>À</label>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1A73E8" }}>{yearTo}</span>
                  </div>
                  <input type="range" min={yearFrom+1} max={YEAR_MAX} value={yearTo} onChange={e => { setYearTo(+e.target.value); setPage(0); }} className="w-full accent-blue-600" />
                </div>
                <button onClick={() => { setYearFrom(YEAR_MIN); setYearTo(YEAR_MAX); }} style={{ fontSize:12, color:"#EF4444", fontWeight:600, background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap", marginTop:16 }}>Réinitialiser</button>
              </div>
            </div>
          )}

          {/* Active filters */}
          {hasFilters && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #F1F5F9", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>Filtres actifs :</span>
              {typeFilter !== "all" && <Pill bg="#EEF4FF" color="#1A73E8" border="#BFDBFE">{TYPE_FILTERS.find(f=>f.key===typeFilter)?.label}</Pill>}
              {debouncedChercheur && <Pill bg="#F0FDF4" color="#15803D" border="#BBF7D0"><User style={{width:10,height:10}}/>{debouncedChercheur}</Pill>}
              {debouncedSearch && <Pill bg="#F1F5F9" color="#475569" border="#CBD5E1">"{debouncedSearch}"</Pill>}
              <button onClick={() => { setTypeFilter("all"); setChercheurInput(""); setSearch(""); }} style={{ fontSize:11, color:"#EF4444", fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>Tout effacer</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Results bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
          <div>
            <span style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{total}</span>
            <span style={{ fontSize:14, color:"#64748B", fontWeight:400 }}> publication{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}</span>
            {isSemantic && debouncedSearch && (
              <span style={{ marginLeft:8, fontSize:11, fontWeight:700, color:"#7C3AED", background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:999, padding:"2px 10px", display:"inline-flex", alignItems:"center", gap:4 }}>
                <Sparkles style={{ width:10, height:10 }} />Recherche IA
              </span>
            )}
            {fallbackMessage && <p style={{ fontSize:12, color:"#D97706", marginTop:4 }}>{fallbackMessage}</p>}
            {searchError && <p style={{ fontSize:12, color:"#DC2626", marginTop:4 }}>{searchError}</p>}
          </div>
          {totalPages > 1 && (
            <div style={{ display:"flex", alignItems:"center", gap:4, background:"white", border:"1px solid #E2E8F0", borderRadius:10, padding:"4px 8px" }}>
              <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                style={{ padding:4, borderRadius:6, border:"none", background:"none", cursor:"pointer", color:"#374151", opacity:page===0?0.3:1 }}>
                <ChevronLeft style={{ width:16, height:16 }} />
              </button>
              <span style={{ fontSize:13, fontWeight:600, color:"#374151", padding:"0 6px" }}>{page+1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                style={{ padding:4, borderRadius:6, border:"none", background:"none", cursor:"pointer", color:"#374151", opacity:page>=totalPages-1?0.3:1 }}>
                <ChevronRight style={{ width:16, height:16 }} />
              </button>
            </div>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({length:6}).map((_,i) => (
              <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid #F1F5F9", padding:"16px 20px", animation:"pulse 1.5s ease-in-out infinite" }}>
                <div style={{ display:"flex", gap:16 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:"#E2E8F0", flexShrink:0 }} />
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ height:14, borderRadius:8, background:"#E2E8F0", width:"70%" }} />
                    <div style={{ height:12, borderRadius:6, background:"#F1F5F9", width:"45%" }} />
                    <div style={{ display:"flex", gap:6 }}>
                      <div style={{ height:20, width:64, borderRadius:999, background:"#F1F5F9" }} />
                      <div style={{ height:20, width:80, borderRadius:999, background:"#F1F5F9" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 24px" }}>
            <div style={{ width:72, height:72, borderRadius:20, background:"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <BookOpen style={{ width:32, height:32, color:"#CBD5E1" }} />
            </div>
            <p style={{ fontSize:16, fontWeight:700, color:"#475569", marginBottom:4 }}>Aucune publication trouvée</p>
            <p style={{ fontSize:13, color:"#94A3B8" }}>Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((pub, i) => <PubCard key={pub.id ?? i} pub={pub} index={i} isSemantic={isSemantic} onClick={() => setSelectedPub(pub)} />)}
          </div>
        )}

        {/* Pagination bottom */}
        {totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:24 }}>
            <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{ background:"white", borderColor:"#E2E8F0", color:"#374151", cursor:"pointer", opacity:page===0?0.4:1 }}>
              <ChevronLeft style={{ width:15, height:15 }} />Précédent
            </button>
            <div style={{ display:"flex", gap:4 }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page < 3 ? i : page - 2 + i;
                if (p >= totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width:36, height:36, borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:"none", transition:"all 0.15s",
                      background: p===page ? "#1A73E8" : "white", color: p===page ? "white" : "#374151",
                      boxShadow: p===page ? "0 2px 8px rgba(26,115,232,0.3)" : "0 1px 3px rgba(0,0,0,0.06)" }}>
                    {p+1}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{ background:"white", borderColor:"#E2E8F0", color:"#374151", cursor:"pointer", opacity:page>=totalPages-1?0.4:1 }}>
              Suivant<ChevronRight style={{ width:15, height:15 }} />
            </button>
          </div>
        )}
      </div>

      {selectedPub && <PubModal pub={selectedPub} onClose={() => setSelectedPub(null)} />}

      <style>{`
        @keyframes spin { from{transform:translateY(-50%) rotate(0deg)} to{transform:translateY(-50%) rotate(360deg)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  );
}
