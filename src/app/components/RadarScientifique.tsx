import { useState, useEffect, useRef } from "react";
import { Radio, ExternalLink, RefreshCw, Clock, Bell, BellOff, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { getToken } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RadarArticle {
  titre: string; resume_fr: string; auteurs: string[];
  source: string; annee: number | null; date_publication: string | null;
  url: string | null; doi: string | null; axe: string;
  score: number; nb_citations: number; membres_larodec: string[];
}
export interface RadarCache { articles: RadarArticle[]; updated_at: string; total: number; }
export const API = "http://localhost:3001";

export const AXES = [
  { key: "tous",          label: "Tous"                      },
  { key: "decision",      label: "Aide à la décision"        },
  { key: "incertitude",   label: "Modèles graphiques"        },
  { key: "apprentissage", label: "Apprentissage automatique" },
  { key: "logistique",    label: "Logistique & Qualité"      },
  { key: "statistique",   label: "Statistique Appliquée"     },
  { key: "connaissances", label: "Web sémantique"            },
];

const AXE_COLORS: Record<string, string> = {
  decision: "#1A73E8", incertitude: "#7C3AED", apprentissage: "#059669",
  logistique: "#D97706", statistique: "#DC2626", connaissances: "#0891B2",
};

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#1A73E8" : "#0891B2";
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: "#E2E8F0" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, #93C5FD)`, transition: "width 0.7s ease" }} />
      </div>
      <span className="tabular-nums font-semibold" style={{ fontSize: 11, color: "#94A3B8", minWidth: 24 }}>{score}%</span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-2 py-3 border-b" style={{ borderColor: "#F1F5F9" }}>
      <div className="flex gap-1.5"><div className="h-4 rounded-full w-20" style={{ background: "#EEF4FF" }} /><div className="h-4 rounded-full w-10" style={{ background: "#F1F5F9" }} /></div>
      <div className="h-3.5 rounded w-full" style={{ background: "#F1F5F9" }} />
      <div className="h-3.5 rounded w-4/5" style={{ background: "#F1F5F9" }} />
      <div className="h-3 rounded w-2/3" style={{ background: "#F8FAFF" }} />
      <div className="h-1 rounded-full w-full mt-1" style={{ background: "#E2E8F0" }} />
    </div>
  );
}

// ── Compact article card ──────────────────────────────────────────────────────
export function ArticleCardCompact({ article, delay, isLast }: { article: RadarArticle; delay: number; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const link = article.doi ? `https://doi.org/${article.doi}` : article.url || null;
  const axeColor = AXE_COLORS[article.axe] || "#1A73E8";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="transition-all duration-200"
      style={{
        borderBottom: isLast ? "none" : "1px solid #F1F5F9",
        padding: "12px 0",
        animation: `lar-fade-up 0.4s ease-out ${delay}ms both`,
      }}
    >
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        <span className="px-2 py-0.5 rounded-full font-bold" style={{ fontSize: 11, background: axeColor + "15", color: axeColor }}>
          {AXES.find(a => a.key === article.axe)?.label || article.axe}
        </span>
        {article.annee && (
          <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B" }}>
            {article.annee}
          </span>
        )}
        {article.nb_citations > 0 && (
          <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 11, background: article.nb_citations > 100 ? "#EEF4FF" : "#F1F5F9", color: article.nb_citations > 100 ? "#1A73E8" : "#64748B" }}>
            {article.nb_citations} cit.
          </span>
        )}
      </div>

      {/* Title */}
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="block font-bold leading-snug line-clamp-2 mb-1.5 transition-colors"
          style={{ fontSize: 13, color: hovered ? "#1A73E8" : "#1A1A4E" }}>
          {article.titre}
          {hovered && <ExternalLink className="w-3 h-3 inline ml-1 opacity-70" />}
        </a>
      ) : (
        <p className="font-bold leading-snug line-clamp-2 mb-1.5" style={{ fontSize: 13, color: "#1A1A4E" }}>{article.titre}</p>
      )}

      {/* Summary */}
      <p className="leading-relaxed line-clamp-2 mb-1" style={{ fontSize: 12, color: "#64748B" }}>{(article.resume_fr || "").replace(/^\[Résumé automatique\]\s*/i, "")}</p>

      {/* Source */}
      {article.source && (
        <p className="truncate italic mb-0.5" style={{ fontSize: 11, color: "#94A3B8" }}>{article.source}</p>
      )}

      {/* Score + read link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1"><ScoreBar score={article.score} /></div>
        {hovered && link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 font-semibold transition-all"
            style={{ fontSize: 11, color: "#1A73E8" }}>
            Lire →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Full article card (standalone page) ───────────────────────────────────────
function ArticleCardFull({ article, delay, members }: { article: RadarArticle; delay: number; members: Record<string, string> }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const link = article.doi ? `https://doi.org/${article.doi}` : article.url || null;
  const axeColor = AXE_COLORS[article.axe] || "#1A73E8";

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-xl p-5 transition-all duration-200"
      style={{
        borderLeft: `3px solid ${axeColor}`,
        border: `1px solid ${hovered ? "#BFDBFE" : "#E2E8F0"}`,
        borderLeftWidth: 3, borderLeftColor: axeColor,
        boxShadow: hovered ? "0 4px 16px rgba(26,115,232,0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
        animation: `lar-fade-up 0.4s ease-out ${delay}ms both`,
      }}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="px-2 py-0.5 rounded-full font-bold" style={{ fontSize: 11, background: axeColor + "15", color: axeColor }}>
          {AXES.find(a => a.key === article.axe)?.label || article.axe}
        </span>
        {article.annee && <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B" }}>{article.annee}</span>}
        {article.nb_citations > 0 && <span className="px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: 11, background: article.nb_citations > 100 ? "#EEF4FF" : "#F1F5F9", color: article.nb_citations > 100 ? "#1A73E8" : "#64748B" }}>{article.nb_citations} citations</span>}
        {article.membres_larodec.length > 0 && <span className="px-2 py-0.5 rounded-full font-bold" style={{ fontSize: 11, background: "#EEF4FF", color: "#1A73E8" }}>Membre LARODEC</span>}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="block font-bold leading-snug line-clamp-2 mb-2 transition-colors"
          style={{ fontSize: 14, color: hovered ? "#1A73E8" : "#1A1A4E" }}>
          {article.titre}{hovered && <ExternalLink className="w-3 h-3 inline ml-1 opacity-70" />}
        </a>
      ) : <p className="font-bold leading-snug mb-2 line-clamp-2" style={{ fontSize: 14, color: "#1A1A4E" }}>{article.titre}</p>}
      <p className="leading-relaxed line-clamp-2 mb-2" style={{ fontSize: 13, color: "#64748B" }}>{(article.resume_fr || "").replace(/^\[Résumé automatique\]\s*/i, "")}</p>
      {article.auteurs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {article.auteurs.slice(0, 4).map((a, i) => {
            const fn = a.toLowerCase().split(" ")[0];
            const isLab = article.membres_larodec.some(m => m.toLowerCase().includes(fn));
            const mk = isLab ? Object.keys(members).find(k => k.toLowerCase().includes(fn)) : undefined;
            return mk ? (
              <button key={i} onClick={() => navigate(`/public/researcher/${encodeURIComponent(members[mk])}`)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold transition-all hover:shadow-sm"
                style={{ fontSize: 11, background: "#EEF4FF", color: "#1A73E8" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#1A73E8" }} />{a}
              </button>
            ) : <span key={i} className="px-2 py-0.5 rounded-full" style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B" }}>{a}</span>;
          })}
          {article.auteurs.length > 4 && <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 11, background: "#F1F5F9", color: "#94A3B8" }}>+{article.auteurs.length - 4}</span>}
        </div>
      )}
      {article.source && <p className="truncate italic mb-1" style={{ fontSize: 12, color: "#94A3B8" }}>{article.source}</p>}
      <ScoreBar score={article.score} />
    </div>
  );
}

// ── Compact sidebar widget ────────────────────────────────────────────────────
export function RadarWidget({ userName }: { userName?: string }) {
  const navigate = useNavigate();
  const [data, setData]             = useState<RadarCache | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeAxe, setActiveAxe]   = useState("tous");
  const [tabChanging, setTabChanging] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subMsg, setSubMsg]         = useState("");
  const [refreshSpin, setRefreshSpin] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/public/radar`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/api/radar/subscribe`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSubscribed(d.subscribed); })
      .catch(() => {});
  }, []);

  const handleTabChange = (key: string) => {
    if (key === activeAxe) return;
    setTabChanging(true);
    setTimeout(() => { setActiveAxe(key); setTabChanging(false); }, 150);
  };

  const handleRefresh = () => {
    setRefreshSpin(true); setLoading(true);
    fetch(`${API}/api/public/radar?refresh=1`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false))
      .finally(() => setTimeout(() => setRefreshSpin(false), 600));
  };

  const handleSubscribe = async () => {
    const token = getToken();
    if (!token) { setSubMsg("Connectez-vous pour vous abonner."); return; }
    try {
      const r = await fetch(`${API}/api/radar/subscribe`, { method: subscribed ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { setSubscribed(!subscribed); setSubMsg(subscribed ? "Désabonnement effectué." : "Abonnement activé !"); setTimeout(() => setSubMsg(""), 3000); }
    } catch { setSubMsg("Erreur."); }
  };

  const allFiltered = (data?.articles ?? []).filter(a => activeAxe === "tous" || a.axe === activeAxe);
  const filtered = allFiltered.length === 0 && activeAxe !== "tous" ? (data?.articles ?? []) : allFiltered;
  const shown = filtered.slice(0, 4);

  const updatedAgo = data?.updated_at ? (() => {
    const diff = Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 60000);
    if (diff < 2) return "à l'instant";
    if (diff < 60) return `il y a ${diff} min`;
    return `il y a ${Math.floor(diff / 60)}h`;
  })() : null;

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Radio className="w-4 h-4 flex-shrink-0" style={{ color: "#1A73E8" }} />
            <h3 className="font-bold" style={{ fontSize: 18, color: "#1E293B" }}>
              {userName ? `Radar — ${userName}` : "Radar Scientifique"}
            </h3>
            {/* Point pulsant animé (lent) */}
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full"
                style={{ background: "#1A73E8", animation: "rdr-pulse-slow 2s ease-in-out infinite" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#1A73E8" }} />
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#64748B" }}>Dernières avancées mondiales, sélectionnées par l'IA</p>
          {updatedAgo && (
            <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 11, color: "#94A3B8" }}>
              <Clock className="w-3 h-3" />Mis à jour {updatedAgo}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {getToken() && (
            <button onClick={handleSubscribe} className="p-1.5 rounded-lg border transition-all"
              style={subscribed ? { background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" } : { background: "#EEF4FF", color: "#1A73E8", borderColor: "#BFDBFE" }}
              title={subscribed ? "Se désabonner" : "Veille hebdomadaire"}>
              {subscribed ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={handleRefresh} className="p-1.5 rounded-lg border transition-all hover:bg-gray-50"
            style={{ background: "white", color: "#64748B", borderColor: "#E2E8F0" }} title="Actualiser">
            <RefreshCw className="w-3.5 h-3.5"
              style={{ transition: "transform 500ms", transform: refreshSpin ? "rotate(360deg)" : "rotate(0deg)" }} />
          </button>
        </div>
      </div>

      {subMsg && <div className="mb-2 px-3 py-1 rounded-lg text-xs font-medium" style={{ background: "#EEF4FF", color: "#1A73E8" }}>{subMsg}</div>}

      {/* Tabs — scrollable, no scrollbar */}
      <div ref={tabsRef} className="flex gap-1.5 mb-3 pb-0.5 relative" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
        {AXES.map(ax => (
          <button key={ax.key} onClick={() => handleTabChange(ax.key)}
            className="whitespace-nowrap font-semibold transition-all flex-shrink-0"
            style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20,
              ...(activeAxe === ax.key
                ? { background: "#1A73E8", color: "white", boxShadow: "0 2px 6px rgba(26,115,232,0.28)" }
                : { background: "transparent", color: "#64748B", border: "1px solid #E2E8F0" }),
            }}>
            {ax.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div style={{ opacity: tabChanging ? 0 : 1, transition: "opacity 0.15s ease", flex: 1, minHeight: 0 }}>
        {loading ? (
          <div className="space-y-0">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div>
        ) : shown.length === 0 ? (
          <div className="space-y-0">{[1,2,3,4].map(i => <Skeleton key={i} />)}</div>
        ) : (
          <div>
            {shown.map((art, i) => (
              <ArticleCardCompact key={`${activeAxe}-${i}`} article={art} delay={i * 50} isLast={i === shown.length - 1} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && filtered.length > 0 && (
        <button onClick={() => navigate("/radar")}
          className="mt-3 w-full py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5 border"
          style={{ fontSize: 12, background: "#EEF4FF", color: "#1A73E8", borderColor: "#BFDBFE" }}>
          Voir tous les articles ({filtered.length})<ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      <style>{`
        @keyframes rdr-pulse-slow {
          0%,100% { transform:scale(1);   opacity:.75 }
          50%      { transform:scale(1.4); opacity:.25 }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        div[style*="overflowX"]::-webkit-scrollbar { display:none; }
      `}</style>
    </div>
  );
}

// ── Full-page Radar ───────────────────────────────────────────────────────────
export function RadarScientifique({ userName, userAxe }: { userName?: string; userAxe?: string }) {
  const navigate = useNavigate();
  const [data, setData]               = useState<RadarCache | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeAxe, setActiveAxe]     = useState(userAxe || "tous");
  const [visibleCount, setVisibleCount] = useState(8);
  const [tabChanging, setTabChanging] = useState(false);
  const [members, setMembers]         = useState<Record<string, string>>({});
  const [subscribed, setSubscribed]   = useState(false);
  const [subMsg, setSubMsg]           = useState("");

  useEffect(() => { if (userAxe) setActiveAxe(userAxe); }, [userAxe]);
  useEffect(() => {
    fetch(`${API}/api/public/radar`).then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useEffect(() => {
    const cats = ["Corps A", "Corps B", "Doctorant", "Post-Doc"];
    const map: Record<string, string> = {};
    Promise.allSettled(cats.map(c =>
      fetch(`${API}/api/public/researchers?categorie=${c}`).then(r => r.json())
        .then((d: any[]) => (Array.isArray(d) ? d : []).forEach((m: any) => { if (m.nom_prenom) map[m.nom_prenom.toLowerCase()] = m.nom_prenom; }))
    )).then(() => setMembers(map));
  }, []);
  useEffect(() => {
    const token = getToken(); if (!token) return;
    fetch(`${API}/api/radar/subscribe`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setSubscribed(d.subscribed); }).catch(() => {});
  }, []);

  const handleTabChange = (key: string) => {
    if (key === activeAxe) return;
    setTabChanging(true);
    setTimeout(() => { setActiveAxe(key); setVisibleCount(8); setTabChanging(false); }, 180);
  };
  const handleRefresh = () => {
    setLoading(true);
    fetch(`${API}/api/public/radar?refresh=1`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  };
  const handleSubscribe = async () => {
    const token = getToken(); if (!token) { setSubMsg("Connectez-vous."); return; }
    try {
      const r = await fetch(`${API}/api/radar/subscribe`, { method: subscribed ? "DELETE" : "POST", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { setSubscribed(!subscribed); setSubMsg(subscribed ? "Désabonnement effectué." : "Abonnement activé !"); setTimeout(() => setSubMsg(""), 4000); }
    } catch { setSubMsg("Erreur."); }
  };

  const rawFiltered = (data?.articles ?? []).filter(a => activeAxe === "tous" || a.axe === activeAxe);
  const filtered = rawFiltered.length === 0 && activeAxe !== "tous" ? (data?.articles ?? []) : rawFiltered;
  const shown = filtered.slice(0, visibleCount);
  const updatedAgo = data?.updated_at ? (() => {
    const diff = Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 60000);
    if (diff < 2) return "à l'instant"; if (diff < 60) return `il y a ${diff} min`; return `il y a ${Math.floor(diff / 60)}h`;
  })() : null;

  return (
    <section className="py-16 px-6" style={{ background: "#F8FAFF" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Radio className="w-7 h-7" style={{ color: "#1A73E8" }} />
              <h2 className="font-extrabold" style={{ fontSize: 28, color: "#1E293B" }}>
                {userName ? `Radar — Pour ${userName}` : "Radar Scientifique"}
              </h2>
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: "#1A73E8", animation: "rdr-pulse-slow 2s ease-in-out infinite" }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#1A73E8" }} />
              </span>
            </div>
            <p style={{ fontSize: 14, color: "#64748B" }}>Les dernières avancées mondiales dans nos domaines, sélectionnées par l'IA</p>
            {updatedAgo && <div className="flex items-center gap-1.5 mt-1" style={{ fontSize: 12, color: "#94A3B8" }}><Clock className="w-3.5 h-3.5" />Mis à jour {updatedAgo}</div>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {getToken() && (
              <button onClick={handleSubscribe}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border transition-all hover:shadow-sm"
                style={subscribed ? { fontSize: 13, background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" } : { fontSize: 13, background: "#EEF4FF", color: "#1A73E8", borderColor: "#BFDBFE" }}>
                {subscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {subscribed ? "Se désabonner" : "Veille hebdomadaire"}
              </button>
            )}
            <button onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border transition-all hover:shadow-sm"
              style={{ fontSize: 13, background: "white", color: "#374151", borderColor: "#E2E8F0" }}>
              <RefreshCw className="w-4 h-4" />Actualiser
            </button>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border transition-all hover:shadow-sm"
              style={{ fontSize: 13, background: "white", color: "#374151", borderColor: "#E2E8F0" }}>
              ← Retour
            </button>
          </div>
        </div>

        {subMsg && <div className="mb-4 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#EEF4FF", color: "#1A73E8" }}>{subMsg}</div>}

        <div className="flex flex-wrap gap-2 mb-6">
          {AXES.map(ax => (
            <button key={ax.key} onClick={() => handleTabChange(ax.key)}
              className="whitespace-nowrap font-semibold transition-all"
              style={{
                fontSize: 13, padding: "5px 14px", borderRadius: 20,
                ...(activeAxe === ax.key
                  ? { background: "#1A73E8", color: "white", boxShadow: "0 2px 8px rgba(26,115,232,0.3)" }
                  : { background: "white", color: "#374151", border: "1px solid #E2E8F0" }),
              }}>
              {ax.label}
            </button>
          ))}
        </div>

        <div style={{ opacity: tabChanging ? 0 : 1, transition: "opacity 0.18s ease" }}>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse" style={{ border: "1px solid #E2E8F0" }}>
                <div className="flex gap-2 mb-3"><div className="h-5 rounded-full w-24" style={{ background: "#EEF4FF" }} /><div className="h-5 rounded-full w-12" style={{ background: "#F1F5F9" }} /></div>
                <div className="h-4 rounded w-full mb-2" style={{ background: "#F1F5F9" }} />
                <div className="h-4 rounded w-4/5 mb-3" style={{ background: "#F1F5F9" }} />
                <div className="h-3 rounded w-2/3" style={{ background: "#F8FAFF" }} />
              </div>
            ))}</div>
          ) : shown.length === 0 ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse" style={{ border: "1px solid #E2E8F0" }}>
                <div className="flex gap-2 mb-3"><div className="h-5 rounded-full w-24" style={{ background: "#EEF4FF" }} /><div className="h-5 rounded-full w-12" style={{ background: "#F1F5F9" }} /></div>
                <div className="h-4 rounded w-full mb-2" style={{ background: "#F1F5F9" }} />
                <div className="h-4 rounded w-4/5 mb-3" style={{ background: "#F1F5F9" }} />
                <div className="h-3 rounded w-2/3" style={{ background: "#F8FAFF" }} />
              </div>
            ))}</div>
          ) : (
            <>
              <div className="space-y-3">
                {shown.map((art, i) => <ArticleCardFull key={`${activeAxe}-${i}`} article={art} delay={i * 50} members={members} />)}
              </div>
              {visibleCount < filtered.length && (
                <div className="flex justify-center mt-6">
                  <button onClick={() => setVisibleCount(v => v + 8)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold border transition-all hover:shadow-sm"
                    style={{ fontSize: 13, background: "white", color: "#1A73E8", borderColor: "#BFDBFE" }}>
                    Voir plus <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <style>{`@keyframes rdr-pulse-slow{0%,100%{transform:scale(1);opacity:.75}50%{transform:scale(1.4);opacity:.25}}`}</style>
      </div>
    </section>
  );
}
