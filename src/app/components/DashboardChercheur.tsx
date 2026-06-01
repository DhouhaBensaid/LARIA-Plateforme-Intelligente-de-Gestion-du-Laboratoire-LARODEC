import { useState, useEffect } from "react";
import {
  FileText, BookOpen, Calendar, TrendingUp, Copy, Check,
  ChevronDown, ChevronUp, RefreshCw, ExternalLink,
  CheckCircle2, Hourglass, Users, Star, AlertCircle, Sparkles, Brain,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { articlesApi } from "../../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function formatAPA(pub: any): string {
  const auteurs = pub.auteurs || pub.chercheur_nom || "";
  const annee   = pub.annee   || "s.d.";
  const titre   = pub.titre   || "";
  const journal = pub.journal_ou_editeur || "";
  const doi     = pub.doi     || "";
  let ref = `${auteurs} (${annee}). ${titre}.`;
  if (journal) ref += ` ${journal}.`;
  if (doi)     ref += ` https://doi.org/${doi}`;
  return ref;
}

const getPrefix = (grade: string) => {
  const m: Record<string, string> = {
    "Professeur": "Prof.", "Maitre de Conferences": "Dr.",
    "Maitre Assistant": "Dr.", "Assistant": "Dr.", "Doctorant": "Doctorant",
  };
  return m[grade] || "Dr.";
};

const API_BASE     = "http://localhost:3001";
const authToken    = () => localStorage.getItem("larodec_token") ?? "";
const CHART_COLORS = ["#3b82f6","#06b6d4","#10b981","#f59e0b","#8b5cf6","#ef4444"];

function KpiCard({ icon, value, label, color }: {
  icon: React.ReactNode; value: number | string; label: string;
  color: "blue"|"cyan"|"violet"|"emerald"|"amber"|"orange";
}) {
  const bg: Record<string,string> = {
    blue:"bg-blue-50 border-blue-100", cyan:"bg-cyan-50 border-cyan-100",
    violet:"bg-violet-50 border-violet-100", emerald:"bg-emerald-50 border-emerald-100",
    amber:"bg-amber-50 border-amber-100", orange:"bg-orange-50 border-orange-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

interface AISuggestions {
  conferences:   { name: string; url: string; reason: string; deadline?: string }[];
  journals:      { name: string; publisher: string; url: string; reason: string }[];
  collaborators: { userId?: string; name: string; commonThemes: string[] }[];
}

const SUGG_KEY = (id: number) => `ai_suggestions_${id}`;
const SUGG_TTL = 24 * 60 * 60 * 1000;

function loadCached(userId: number): AISuggestions | null {
  try {
    const raw = localStorage.getItem(SUGG_KEY(userId));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < SUGG_TTL ? data : null;
  } catch { return null; }
}
function saveCache(userId: number, data: AISuggestions) {
  try { localStorage.setItem(SUGG_KEY(userId), JSON.stringify({ data, ts: Date.now() })); } catch {}
}

function SuggSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      {[0,1,2].map(i => (
        <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function AISuggestionsSection({ pubs, suggestions, loading, error, activeTab, onTabChange }: {
  pubs: any[]; suggestions: AISuggestions | null; loading: boolean; error: string | null;
  activeTab: "conferences"|"journals"|"collaborators";
  onTabChange: (t: "conferences"|"journals"|"collaborators") => void;
}) {
  const tabs = [
    { id: "conferences"   as const, label: "Conferences",    icon: Calendar },
    { id: "journals"      as const, label: "Journaux",       icon: BookOpen },
    { id: "collaborators" as const, label: "Collaborateurs", icon: Users    },
  ];
  return (
    <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Suggestions pour vous</h3>
          <p className="text-xs text-slate-500">Basees sur vos themes de publication</p>
        </div>
      </div>
      {pubs.length === 0 && !loading && (
        <div className="px-6 py-10 text-center text-slate-400">
          <Brain className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Ajoutez des publications pour recevoir des suggestions.</p>
        </div>
      )}
      {error && (
        <div className="mx-6 mt-4 mb-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />Suggestions temporairement indisponibles.
        </div>
      )}
      {loading && pubs.length > 0 && <div className="p-6"><SuggSkeleton /></div>}
      {suggestions && !loading && (
        <div className="p-6">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => onTabChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className="w-4 h-4" />{label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"}`}>
                  {id === "conferences" ? suggestions.conferences.length : id === "journals" ? suggestions.journals.length : suggestions.collaborators.length}
                </span>
              </button>
            ))}
          </div>
          {activeTab === "conferences" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.conferences.length === 0 ? <p className="text-slate-400 text-sm col-span-3">Aucune conference suggeree.</p>
                : suggestions.conferences.map((c, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Conference</span>
                      {c.deadline && <span className="text-xs text-slate-400">{c.deadline}</span>}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm mb-1">{c.name}</p>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{c.reason}</p>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium">En savoir plus <ExternalLink className="w-3 h-3" /></a>}
                  </div>
                ))}
            </div>
          )}
          {activeTab === "journals" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.journals.length === 0 ? <p className="text-slate-400 text-sm col-span-3">Aucun journal suggere.</p>
                : suggestions.journals.map((j, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-sm transition-all">
                    <div className="mb-2"><span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Journal</span></div>
                    <p className="font-semibold text-slate-800 text-sm mb-0.5">{j.name}</p>
                    {j.publisher && <p className="text-xs text-slate-400 mb-1">{j.publisher}</p>}
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{j.reason}</p>
                    {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium">En savoir plus <ExternalLink className="w-3 h-3" /></a>}
                  </div>
                ))}
            </div>
          )}
          {activeTab === "collaborators" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.collaborators.length === 0 ? <p className="text-slate-400 text-sm col-span-3">Aucun collaborateur suggere.</p>
                : suggestions.collaborators.map((col, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-sm transition-all">
                    <div className="mb-2"><span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Collaborateur</span></div>
                    <p className="font-semibold text-slate-800 text-sm mb-2">{col.name}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {col.commonThemes.map((t, j) => (
                        <span key={j} className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <a href={`/public/researcher/${encodeURIComponent(col.name)}`} className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium">Voir le profil <ExternalLink className="w-3 h-3" /></a>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardChercheur() {
  const { session } = useAuth();
  const [myPubs,   setMyPubs]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied,   setCopied]   = useState<string | null>(null);
  const [suggestions,        setSuggestions]        = useState<AISuggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError,   setSuggestionsError]   = useState<string | null>(null);
  const [suggestionsTab,     setSuggestionsTab]     = useState<"conferences"|"journals"|"collaborators">("conferences");

  const userPrefix = session?.user.grade ? getPrefix(session.user.grade) : "Dr.";
  const userName   = session?.user.prenom && session?.user.nom ? `${userPrefix} ${session.user.prenom} ${session.user.nom}` : "Chercheur";
  const fullName   = session?.user.nom && session?.user.prenom ? `${session.user.nom} ${session.user.prenom}`.toUpperCase() : "";

  useEffect(() => { loadAll(); }, [session]);

  useEffect(() => {
    if (!session?.user?.id || !fullName) return;
    const cached = loadCached(session.user.id);
    if (cached) { setSuggestions(cached); return; }
    setSuggestionsLoading(true);
    fetch(`${API_BASE}/api/ai/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken()}` },
      body: JSON.stringify({ chercheur: fullName, publications: [] }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: AISuggestions) => { setSuggestions(data); saveCache(session.user.id, data); })
      .catch(() => setSuggestionsError("indisponible"))
      .finally(() => setSuggestionsLoading(false));
  }, [session?.user?.id, fullName]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [myRes, evRes, thRes] = await Promise.allSettled([
        fullName ? articlesApi.getAll({ chercheur: fullName, limit: 200 }) : Promise.resolve({ items: [] }),
        fetch(`${API_BASE}/api/evenements`, { headers: { Authorization: `Bearer ${authToken()}` } }).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/chercheur/theses`, { headers: { Authorization: `Bearer ${authToken()}` } }).then(r => r.ok ? r.json() : []),
      ]);
      const myItems = myRes.status === "fulfilled" ? (myRes.value?.items || []) : [];
      setMyPubs(myItems);
      if (myItems.length === 0 && fullName) await autoScrape(fullName);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const autoScrape = async (name: string) => {
    setScraping(true); setScrapingStatus("Recherche sur DBLP, OpenAlex, Scopus...");
    try {
      const res = await fetch(`${API_BASE}/api/scraper/search`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({ authorName: name, sources: ["dblp","openalex","scopus"] }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.results?.length > 0) {
        setScrapingStatus(`${data.results.length} publications trouvees - import...`);
        await fetch(`${API_BASE}/api/scraper/import`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken()}` },
          body: JSON.stringify({ papers: data.results }),
        });
        const refreshed = await articlesApi.getAll({ chercheur: name, limit: 200 });
        setMyPubs(refreshed.items || []);
        setScrapingStatus(`${data.results.length} publications synchronisees`);
      } else { setScrapingStatus("Aucune publication trouvee."); }
    } catch { setScrapingStatus("Erreur lors de la synchronisation."); }
    finally { setScraping(false); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const years    = [...new Set(myPubs.map(p => Number(p.annee)).filter(Boolean))].sort((a,b) => b-a);
  const byYear   = years.map(y => ({ year: y, count: myPubs.filter(p => Number(p.annee) === y).length }));
  const bySource = Object.entries(myPubs.reduce((acc: any, p) => { const s = p.source_scraping || "Manuel"; acc[s] = (acc[s]||0)+1; return acc; }, {})).map(([name, value]) => ({ name, value }));
  const pendingPubs   = myPubs.filter(p => p.statut === "en_attente");
  const validatedPubs = myPubs.filter(p => p.statut === "valide");
  const indexedPubs   = myPubs.filter(p => p.indexation && p.indexation.trim() !== "");

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Chargement...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-8 py-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1">{userName}</h1>
            <p className="text-blue-100 text-sm">{session?.user.grade || "Chercheur"} &middot; {session?.user.etablissement || "LARODEC"}</p>
            {scrapingStatus && (
              <p className="mt-2 text-xs text-blue-200 flex items-center gap-1.5">
                {scraping && <span className="w-3 h-3 border border-blue-200 border-t-transparent rounded-full animate-spin inline-block" />}
                {scrapingStatus}
              </p>
            )}
          </div>
          <button onClick={() => fullName && autoScrape(fullName)} disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all border border-white/30 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`} />Synchroniser
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard icon={<FileText     className="w-5 h-5 text-blue-600"    />} value={myPubs.length}       label="Publications"   color="blue"    />
          <KpiCard icon={<Calendar     className="w-5 h-5 text-cyan-600"    />} value={years.length}        label="Annees actives" color="cyan"    />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} value={validatedPubs.length} label="Validees"      color="emerald" />
          <KpiCard icon={<Hourglass    className="w-5 h-5 text-orange-500"  />} value={pendingPubs.length}  label="En attente"     color="orange"  />
          <KpiCard icon={<Star         className="w-5 h-5 text-amber-600"   />} value={indexedPubs.length}  label="Indexees"       color="amber"   />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" />Publications par annee</h3>
            {byYear.length > 0
              ? <ResponsiveContainer width="100%" height={200}><BarChart data={byYear} margin={{ top:0, right:0, left:-20, bottom:0 }}><XAxis dataKey="year" tick={{ fontSize:12 }} /><YAxis tick={{ fontSize:12 }} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius:8, border:"1px solid #e2e8f0", fontSize:12 }} formatter={(v: any) => [`${v} pub.`, "Publications"]} /><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
              : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Aucune donnee</div>}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-500" />Sources</h3>
            {bySource.length > 0
              ? <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{bySource.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius:8, fontSize:12 }} /></PieChart></ResponsiveContainer>
              : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Aucune donnee</div>}
          </div>
        </div>

        <AISuggestionsSection pubs={myPubs} suggestions={suggestions} loading={suggestionsLoading} error={suggestionsError} activeTab={suggestionsTab} onTabChange={setSuggestionsTab} />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />Publications recentes</h3></div>
          <div className="divide-y divide-slate-50">
            {myPubs.slice(0,5).map((pub,i) => {
              const pid = `r-${i}`; const isExp = expanded === pid; const apa = formatAPA(pub); const isCop = copied === pid;
              return (
                <div key={pid} className="overflow-hidden">
                  <button onClick={() => setExpanded(isExp ? null : pid)} className="w-full text-left px-6 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700">{pub.titre}</p>
                      <div className="flex gap-2 mt-1">
                        {pub.annee && <span className="text-xs text-slate-500">{pub.annee}</span>}
                        {pub.journal_ou_editeur && <span className="text-xs text-slate-400 italic truncate max-w-xs">{pub.journal_ou_editeur}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {pub.doi && <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-blue-600 p-1"><ExternalLink className="w-4 h-4" /></a>}
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-6 pb-4 bg-blue-50/20 border-t border-slate-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-3 mb-2">Reference APA 7</p>
                      <div className="bg-white border border-blue-200 rounded-xl px-4 py-3 mb-2"><p className="text-sm text-slate-700 leading-relaxed">{apa}</p></div>
                      <button onClick={() => copyToClipboard(apa, pid)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        {isCop ? <><Check className="w-3.5 h-3.5" />Copie !</> : <><Copy className="w-3.5 h-3.5" />Copier la reference</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {myPubs.length === 0 && <div className="px-6 py-10 text-center text-slate-400 text-sm"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-200" />Aucune publication - cliquez sur Synchroniser</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

