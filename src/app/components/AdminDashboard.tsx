import { useState, useEffect } from "react";
import { FileText, Calendar, Check, X, Clock, Users, GraduationCap, ChevronRight, RefreshCw, TrendingUp, Award } from "lucide-react";
import { publicationsApi, evenementsApi, statsApi, articlesApi } from "../../lib/api";
import { useNavigate } from "react-router";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [articleStats, setArticleStats] = useState<any>(null);
  const [pendingPubs, setPendingPubs] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const [s, aStats, pubs, evs] = await Promise.all([
        statsApi.get(),
        articlesApi.getStats(),
        publicationsApi.getAll({ statut: "en_attente" }),
        evenementsApi.getAll(),
      ]);
      setStats(s);
      setArticleStats(aStats);
      setPendingPubs(pubs);
      setPendingEvents(evs.filter((e: any) => e.statut === "en_attente"));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePubAction = async (id: number, statut: string) => {
    await publicationsApi.updateStatut(id, statut);
    setPendingPubs(prev => prev.filter((p: any) => p.id !== id));
    setStats((s: any) => s ? { ...s, pubsEnAttente: Math.max(0, s.pubsEnAttente - 1) } : s);
  };

  const handleEventAction = async (id: number, statut: string) => {
    await evenementsApi.updateStatut(id, statut);
    setPendingEvents(prev => prev.filter((e: any) => e.id !== id));
    setStats((s: any) => s ? { ...s, evEnAttente: Math.max(0, s.evEnAttente - 1) } : s);
  };

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600", orange: "bg-orange-50 text-orange-600",
    teal: "bg-teal-50 text-teal-600",
  };

  const statCards = stats ? [
    { icon: Users,         label: "Chercheurs",   value: stats.chercheurs,   color: "blue",   path: "/admin/chercheurs",   sub: `${stats.corps_a ?? 0} Corps A · ${stats.corps_b ?? 0} Corps B` },
    { icon: FileText,      label: "Publications", value: stats.publications, color: "green",  path: "/admin/publications", badge: stats.pubsEnAttente, sub: `${stats.pubsEnAttente} en attente` },
    { icon: Calendar,      label: "Événements",   value: stats.evenements,   color: "purple", path: "/admin/evenements",   badge: stats.evEnAttente, sub: `${stats.evEnAttente} en attente` },
    { icon: GraduationCap, label: "Doctorants",   value: stats.doctorants,   color: "orange", path: "/admin/chercheurs",   sub: "Doctorants inscrits" },
    { icon: TrendingUp,    label: "Post-Docs",    value: stats.post_doc,     color: "teal",   path: "/admin/chercheurs",   sub: "Cadres post-doc" },
    { icon: Award,         label: "Thèses",       value: stats.theses,       color: "orange", path: "/admin/theses",       sub: "Thèses enregistrées" },
  ] : [];

  const chartData = (articleStats?.par_annee || [])
    .filter((d: any) => d.annee >= 2020)
    .map((d: any) => ({ annee: String(d.annee), total: Number(d.total) }));

  const topAuthors = (articleStats?.par_chercheur || []).slice(0, 5);

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Tableau de bord</h1>
          <p className="text-gray-500">Données en temps réel — LARODEC</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.label} onClick={() => navigate(s.path)}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-all text-left relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[s.color]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
                {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
              </div>
              {s.badge > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-yellow-400 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {s.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Publications par année</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="annee" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? "#2563eb" : "#93c5fd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {topAuthors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Top 5 auteurs</h2>
            <div className="space-y-3">
              {topAuthors.map((a: any, i: number) => {
                const max = topAuthors[0]?.total || 1;
                const pct = Math.round((a.total / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate max-w-[200px]">{a.chercheur_nom}</span>
                      <span className="font-medium text-gray-900 ml-2">{a.total}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pending items */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Publications en attente */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Publications à valider</h2>
              {pendingPubs.length > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">{pendingPubs.length}</span>}
            </div>
            <button onClick={() => navigate("/admin/publications")} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {pendingPubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Check className="w-8 h-8 mb-2 text-green-400" />
              <p className="text-sm">Aucune publication en attente</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {pendingPubs.slice(0, 5).map((pub: any) => (
                <li key={pub.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pub.titre}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{pub.auteurs}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handlePubAction(pub.id, "validee")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium">
                        <Check className="w-3 h-3" /> Valider
                      </button>
                      <button onClick={() => handlePubAction(pub.id, "rejetee")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium">
                        <X className="w-3 h-3" /> Rejeter
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Événements en attente */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Événements à valider</h2>
              {pendingEvents.length > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">{pendingEvents.length}</span>}
            </div>
            <button onClick={() => navigate("/admin/evenements")} className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {pendingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Check className="w-8 h-8 mb-2 text-green-400" />
              <p className="text-sm">Aucun événement en attente</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {pendingEvents.map((ev: any) => (
                <li key={ev.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.titre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">{ev.type}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {ev.date ? new Date(ev.date).toLocaleDateString("fr-FR") : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleEventAction(ev.id, "valide")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium">
                        <Check className="w-3 h-3" /> Valider
                      </button>
                      <button onClick={() => handleEventAction(ev.id, "rejete")}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium">
                        <X className="w-3 h-3" /> Rejeter
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
