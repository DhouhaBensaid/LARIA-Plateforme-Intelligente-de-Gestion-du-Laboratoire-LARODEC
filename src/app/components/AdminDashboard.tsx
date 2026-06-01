import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Shield, BarChart3, Users, BookOpen, Calendar, Settings,
  TrendingUp, Award, Clock, RefreshCw, ChevronRight,
  GraduationCap, Handshake, FileBarChart, Building2, FileText,
  Plus, Edit, Trash2, CheckCircle, X,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { statsApi, articlesApi, researchersApi, evenementsApi, usersApi } from "../../lib/api";
import logoLarodec from "../../imports/image-1.png";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobalStats {
  chercheurs?: number; publications?: number; evenements?: number;
  doctorants?: number; pubsEnAttente?: number; evEnAttente?: number;
  activite_aujourd_hui?: number; conventions?: number; theses?: number;
  corps_a?: number; corps_b?: number;
}
interface ArticleStats {
  par_annee?: { annee: number; total: number }[];
  par_source?: { source: string; total: number }[];
  par_chercheur?: { chercheur_nom: string; total: number }[];
  total?: number;
  by_source?: Record<string, number>;
}
interface ResearcherStats { [key: string]: number }
interface AuditEntry { id: number; action: string; entity?: string; utilisateur?: string; details?: string; created_at?: string; }
interface Evenement { id: number; titre: string; type?: string; date?: string; statut?: string; }
interface UserEntry { id: number; prenom?: string; nom?: string; email?: string; role?: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const MEDAL: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as any },
  }),
};

// ─── AnimatedCounter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || value === 0) { setDisplay(value); return; }
    let start = 0;
    const increment = value / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, value, duration]);
  return <span ref={ref}>{display.toLocaleString("fr-FR")}</span>;
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
      className="bg-white rounded-2xl border border-slate-100 p-6 h-36">
      <div className="w-10 h-10 bg-slate-100 rounded-xl mb-4" />
      <div className="w-16 h-7 bg-slate-100 rounded-lg mb-2" />
      <div className="w-28 h-3 bg-slate-50 rounded" />
    </motion.div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, iconColor = "text-blue-600", children, action, delay = 0 }: {
  title: string; icon: React.ElementType; iconColor?: string;
  children: React.ReactNode; action?: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return formatDate(iso);
}
function getAuditIcon(action: string) {
  if (action.includes("CREATE")) return <Plus className="w-3.5 h-3.5 text-emerald-600" />;
  if (action.includes("DELETE")) return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
  if (action.includes("STATUS")) return <CheckCircle className="w-3.5 h-3.5 text-blue-500" />;
  return <Edit className="w-3.5 h-3.5 text-amber-500" />;
}
function getAuditBg(action: string) {
  if (action.includes("CREATE")) return "bg-emerald-50";
  if (action.includes("DELETE")) return "bg-red-50";
  if (action.includes("STATUS")) return "bg-blue-50";
  return "bg-amber-50";
}
function getPrefix(grade?: string) {
  const map: Record<string, string> = { "Professeur": "Prof.", "Maître de Conférences": "Dr.", "Maître Assistant": "Dr." };
  return grade ? (map[grade] || "Dr.") : "Dr.";
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [tab, setTab] = useState<"supervision" | "scientifique">("supervision");
  const [stats, setStats] = useState<GlobalStats>({});
  const [articleStats, setArticleStats] = useState<ArticleStats>({});
  const [researcherStats, setResearcherStats] = useState<ResearcherStats>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const prefix = getPrefix(session?.user.grade);
  const prenom = session?.user?.prenom || "Administrateur";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("larodec_token");
    const authFetch = (path: string) =>
      fetch(`http://localhost:3001/api${path}`, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).then(r => r.ok ? r.json() : null).catch(() => null);

    setIsRefreshing(true);
    try {
      const [s, aStats, rStats, audit, evs, usrs] = await Promise.allSettled([
        statsApi.get() as Promise<GlobalStats>,
        articlesApi.getStats() as Promise<ArticleStats>,
        researchersApi.getStats() as Promise<ResearcherStats>,
        authFetch("/audit") as Promise<AuditEntry[]>,
        evenementsApi.getAll() as Promise<Evenement[]>,
        usersApi.getAll() as Promise<UserEntry[]>,
      ]);
      if (s.status === "fulfilled") setStats(s.value ?? {});
      if (aStats.status === "fulfilled") setArticleStats(aStats.value ?? {});
      if (rStats.status === "fulfilled") setResearcherStats(rStats.value ?? {});
      if (audit.status === "fulfilled") setAuditLog((audit.value ?? []).slice(0, 6));
      if (evs.status === "fulfilled") setEvenements(evs.value ?? []);
      if (usrs.status === "fulfilled") setUsers(usrs.value ?? []);
      setElapsed(0);
    } catch (e) { console.error(e); }
    finally {
      setIsLoading(false);
      setTimeout(() => setIsRefreshing(false), 800);
    }
  }, []);

  useEffect(() => {
    loadData();
    const refresh = setInterval(loadData, 30_000);
    const counter = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(refresh); clearInterval(counter); };
  }, [loadData]);

  // Derived
  const chartAnnee = (articleStats.par_annee || []).filter(d => d.annee >= 2018).map(d => ({ annee: String(d.annee), total: Number(d.total) }));
  const chartSource = (articleStats.par_source || []).slice(0, 6).map(d => ({ name: d.source || "Autre", value: Number(d.total) }));
  const topChercheurs = (articleStats.par_chercheur || []).slice(0, 5);
  const maxPubs = topChercheurs[0]?.total || 1;
  const upcomingEvents = evenements.filter(e => e.date && new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl mb-6 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 p-8">
        {/* Floating blobs */}
        <motion.div animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <motion.div animate={{ y: [0, 10, 0], rotate: [0, -3, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-10 -left-10 w-44 h-44 bg-cyan-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Logo animé */}
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }} className="relative">
              <motion.div animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-white/30 rounded-2xl blur-lg scale-125" />
              <div className="relative w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <img src={logoLarodec} alt="LARODEC" className="w-10 h-10 object-contain" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Tableau de bord — LARODEC</p>
              <h1 className="text-2xl font-bold text-white mb-0.5">Bonjour, {prefix} {prenom} 👋</h1>
              <p className="text-blue-100/80 text-sm capitalize">{today}</p>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="hidden md:flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white text-xs font-semibold">Données en direct</span>
            </div>
            <p className="text-blue-200/70 text-xs">Mis à jour il y a {elapsed}s</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mb-8">
        {[
          { id: "supervision", label: "Supervision", icon: Shield },
          { id: "scientifique", label: "Scientifique", icon: BarChart3 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10"
            style={{ color: tab === t.id ? "#1e40af" : "#64748b" }}>
            {tab === t.id && (
              <motion.div layoutId="tab-indicator"
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ zIndex: -1 }} />
            )}
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, x: tab === "supervision" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: tab === "supervision" ? 20 : -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}>
          {tab === "supervision"
            ? <SupervisionTab stats={stats} auditLog={auditLog} users={users} navigate={navigate} isLoading={isLoading} />
            : <ScientifiqueTab stats={stats} researcherStats={researcherStats} chartAnnee={chartAnnee} chartSource={chartSource} topChercheurs={topChercheurs} maxPubs={maxPubs} upcomingEvents={upcomingEvents} navigate={navigate} isLoading={isLoading} />
          }
        </motion.div>
      </AnimatePresence>

      {/* ── Refresh Toast ── */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2.5 shadow-2xl">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            Actualisation…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Supervision Tab ──────────────────────────────────────────────────────────
function SupervisionTab({ stats, auditLog, users, navigate, isLoading }: {
  stats: GlobalStats; auditLog: AuditEntry[]; users: UserEntry[];
  navigate: ReturnType<typeof useNavigate>; isLoading: boolean;
}) {
  const [auditDetail, setAuditDetail] = useState<AuditEntry | null>(null);
  const [roleUser, setRoleUser] = useState<UserEntry | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [newRole, setNewRole] = useState("");

  const ACTION_LABELS: Record<string, string> = {
    STATUS_CHANGE: "Changement de statut", SCRAPE_IMPORT: "Import de publications",
    DELETE_THESIS: "Suppression de thèse", CREATE_THESIS: "Création de thèse",
    DELETE_PUB: "Suppression de publication", CREATE_PUB: "Création de publication",
    UPDATE_PUB: "Modification de publication", LOGIN: "Connexion", REGISTER: "Inscription",
  };

  const handleSaveRole = async () => {
    if (!roleUser || !newRole) return;
    setSavingRole(true);
    try {
      const token = localStorage.getItem("larodec_token");
      await fetch(`http://localhost:3001/api/users/${roleUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...roleUser, role: newRole }),
      });
      setRoleUser(null);
      navigate(0);
    } catch { /* ignore */ }
    finally { setSavingRole(false); }
  };

  const kpiCards = [
    { icon: Users, label: "Chercheurs", value: stats.chercheurs || 0, sub: `${stats.corps_a||0} Corps A · ${stats.corps_b||0} Corps B`, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", color: "text-blue-600", onClick: () => navigate("/admin/chercheurs"), badge: 0 },
    { icon: BookOpen, label: "Publications en attente", value: stats.pubsEnAttente || 0, sub: `${stats.publications||0} total indexées`, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", color: "text-amber-600", onClick: () => navigate("/admin/publications"), badge: stats.pubsEnAttente || 0 },
    { icon: Calendar, label: "Événements en attente", value: stats.evEnAttente || 0, sub: `${stats.evenements||0} événements total`, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", color: "text-emerald-600", onClick: () => navigate("/admin/evenements"), badge: stats.evEnAttente || 0 },
    { icon: GraduationCap, label: "Thèses & Mastères", value: stats.theses || 0, sub: "Supervisées dans le labo", gradient: "from-purple-500 to-violet-500", bg: "bg-purple-50", color: "text-purple-600", onClick: () => navigate("/admin/theses"), badge: 0 },
  ];

  const actions = [
    { icon: Users, label: "Gérer comptes", sub: "Ajouter, modifier, supprimer", path: "/admin/chercheurs", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { icon: FileText, label: "Valider publications", sub: `${stats.pubsEnAttente||0} en attente`, path: "/admin/publications", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    { icon: Calendar, label: "Valider événements", sub: `${stats.evEnAttente||0} en attente`, path: "/admin/evenements", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) :
          kpiCards.map((card, i) => (
            <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
              whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(37,99,235,0.12)" }}
              whileTap={{ scale: 0.97 }}
              onClick={card.onClick}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer overflow-hidden group shadow-sm">
              <motion.div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 rounded-2xl`} />
              {card.badge > 0 && (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-3 right-3 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {card.badge > 99 ? "99+" : card.badge}
                </motion.div>
              )}
              <motion.div whileHover={{ rotate: [-5, 5, 0], scale: 1.1 }} transition={{ duration: 0.3 }}
                className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </motion.div>
              <p className={`text-3xl font-bold ${card.color} mb-0.5`}><AnimatedCounter value={card.value} /></p>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              <motion.div initial={{ opacity: 0, x: -8 }} whileHover={{ opacity: 1, x: 0 }}
                className={`mt-3 flex items-center gap-1 text-xs font-bold ${card.color}`}>
                Voir <ChevronRight className="w-3 h-3" />
              </motion.div>
            </motion.div>
          ))
        }
      </div>

      {/* Actions rapides */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((a, i) => (
            <motion.button key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
              whileHover={{ scale: 1.02, backgroundColor: "#f0f9ff" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.path)}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 text-left transition-colors group">
              <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 300 }}
                className={`w-9 h-9 ${a.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <a.icon className={`w-4 h-4 ${a.iconColor}`} />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.label}</p>
                <p className="text-xs text-slate-400 truncate">{a.sub}</p>
              </div>
              <motion.div initial={{ x: 0 }} whileHover={{ x: 4 }} className="ml-auto flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </motion.div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Activité + Rôles */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Activité récente" icon={Clock} iconColor="text-blue-600"
          action={<span className="text-xs text-slate-400">6 dernières actions</span>} delay={0.4}>
          {auditLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Clock className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">Aucune activité</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {auditLog.map((entry, i) => (
                  <motion.div key={entry.id || i}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ backgroundColor: "#eff6ff", x: 4, borderRadius: "12px" }}
                    onClick={() => setAuditDetail(entry)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group">
                    <motion.div whileHover={{ scale: 1.15, rotate: 5 }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${getAuditBg(entry.action)}`}>
                      {getAuditIcon(entry.action)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate">{ACTION_LABELS[entry.action] || entry.action}</p>
                      <p className="text-xs text-slate-400">{entry.utilisateur || ""} · {timeAgo(entry.created_at)}</p>
                    </div>
                    <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1, x: 3 }}>
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Gestion des rôles" icon={Users} iconColor="text-purple-600"
          action={<button onClick={() => navigate("/admin/chercheurs")} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">Voir tout <ChevronRight className="w-3.5 h-3.5" /></button>}
          delay={0.45}>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Users className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="px-4 py-2.5 text-left font-medium">Nom</th>
                  <th className="px-4 py-2.5 text-left font-medium">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium">Rôle</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {users.slice(0, 6).map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      whileHover={{ backgroundColor: "#f8fafc" }}
                      className="cursor-pointer transition-colors"
                      onClick={() => { setRoleUser(u); setNewRole(u.role || "chercheur"); }}>
                      <td className="px-4 py-2.5 font-medium text-slate-800 truncate max-w-[120px]">{u.prenom} {u.nom}</td>
                      <td className="px-4 py-2.5 text-slate-500 truncate max-w-[140px]">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-red-50 text-red-600" : u.role === "admin+chercheur" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                          {u.role || "chercheur"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Audit detail modal */}
      <AnimatePresence>
        {auditDetail && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAuditDetail(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAuditBg(auditDetail.action)}`}>{getAuditIcon(auditDetail.action)}</div>
                <button onClick={() => setAuditDetail(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{ACTION_LABELS[auditDetail.action] || auditDetail.action}</h3>
              <p className="text-xs text-slate-400 mb-4">{auditDetail.created_at ? new Date(auditDetail.created_at).toLocaleString("fr-FR") : "—"}</p>
              {auditDetail.utilisateur && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {auditDetail.utilisateur.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div><p className="text-sm font-semibold text-slate-800">{auditDetail.utilisateur}</p><p className="text-xs text-slate-400">Auteur de l'action</p></div>
                </div>
              )}
              {auditDetail.entity && <div className="p-3 bg-slate-50 rounded-xl mb-3"><p className="text-xs text-slate-500 font-medium mb-1">Entité</p><p className="text-sm text-slate-800">{auditDetail.entity}</p></div>}
              {auditDetail.details && <div className="p-3 bg-slate-50 rounded-xl mb-4"><p className="text-xs text-slate-500 font-medium mb-1">Détails</p><p className="text-sm text-slate-700">{auditDetail.details}</p></div>}
              <button onClick={() => setAuditDetail(null)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all">Fermer</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role edit modal */}
      <AnimatePresence>
        {roleUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRoleUser(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Modifier le rôle</h3>
                <button onClick={() => setRoleUser(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(roleUser.prenom?.[0] || "") + (roleUser.nom?.[0] || "")}
                </div>
                <div><p className="font-semibold text-slate-800">{roleUser.prenom} {roleUser.nom}</p><p className="text-xs text-slate-400">{roleUser.email}</p></div>
              </div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau rôle</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white">
                <option value="chercheur">Chercheur</option>
                <option value="admin">Admin</option>
                <option value="admin+chercheur">Admin + Chercheur</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setRoleUser(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-all">Annuler</button>
                <button onClick={handleSaveRole} disabled={savingRole || newRole === roleUser.role}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50">
                  {savingRole ? "Sauvegarde…" : "Confirmer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Scientifique Tab ─────────────────────────────────────────────────────────
function ScientifiqueTab({ stats, researcherStats, chartAnnee, chartSource, topChercheurs, maxPubs, upcomingEvents, navigate, isLoading }: {
  stats: GlobalStats; researcherStats: ResearcherStats;
  chartAnnee: { annee: string; total: number }[];
  chartSource: { name: string; value: number }[];
  topChercheurs: { chercheur_nom: string; total: number }[];
  maxPubs: number; upcomingEvents: Evenement[];
  navigate: ReturnType<typeof useNavigate>; isLoading: boolean;
}) {
  const kpiCards = [
    { icon: BookOpen, label: "Publications totales", value: stats.publications || 0, sub: "Articles indexés", bg: "bg-blue-50", color: "text-blue-600", gradient: "from-blue-500 to-blue-600", onClick: () => navigate("/admin/publications") },
    { icon: Users, label: "Chercheurs", value: (researcherStats["Corps A"] || 0) + (researcherStats["Corps B"] || 0), sub: `Corps A: ${researcherStats["Corps A"]||0} · Corps B: ${researcherStats["Corps B"]||0}`, bg: "bg-cyan-50", color: "text-cyan-600", gradient: "from-cyan-500 to-teal-500", onClick: () => navigate("/admin/chercheurs") },
    { icon: GraduationCap, label: "Doctorants", value: researcherStats["Doctorant"] || stats.doctorants || 0, sub: "Inscrits en thèse", bg: "bg-purple-50", color: "text-purple-600", gradient: "from-purple-500 to-violet-500", onClick: () => navigate("/admin/theses") },
    { icon: Handshake, label: "Conventions", value: stats.conventions || 0, sub: "Partenariats actifs", bg: "bg-emerald-50", color: "text-emerald-600", gradient: "from-emerald-500 to-teal-500", onClick: () => navigate("/admin/conventions") },
  ];

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) :
          kpiCards.map((card, i) => (
            <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible"
              whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(37,99,235,0.12)" }}
              whileTap={{ scale: 0.97 }} onClick={card.onClick}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative bg-white rounded-2xl border border-slate-100 p-6 cursor-pointer overflow-hidden group shadow-sm">
              <motion.div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 rounded-2xl`} />
              <motion.div whileHover={{ rotate: [-5, 5, 0], scale: 1.1 }} transition={{ duration: 0.3 }}
                className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </motion.div>
              <p className={`text-3xl font-bold ${card.color} mb-0.5`}><AnimatedCounter value={card.value} /></p>
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
              <motion.div initial={{ opacity: 0, x: -8 }} whileHover={{ opacity: 1, x: 0 }}
                className={`mt-3 flex items-center gap-1 text-xs font-bold ${card.color}`}>
                Voir <ChevronRight className="w-3 h-3" />
              </motion.div>
            </motion.div>
          ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Area chart */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">Évolution des publications</h3>
              <p className="text-xs text-slate-400 mt-0.5">DBLP · OpenAlex · Scopus</p>
            </div>
            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">Par année</span>
          </div>
          {chartAnnee.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartAnnee} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                onClick={(d) => { if (d?.activePayload?.[0]) navigate(`/admin/publications?annee=${d.activePayload[0].payload.annee}`); }}
                style={{ cursor: "pointer" }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="annee" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", fontSize: "12px" }}
                  cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 2" }} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#gradBlue)" dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: "#2563eb", strokeWidth: 0 }}
                  isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" name="Publications" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Donut chart */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">Répartition par source</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cliquez pour filtrer</p>
            </div>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          {chartSource.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartSource} cx="50%" cy="50%" innerRadius={60} outerRadius={88}
                  dataKey="value" nameKey="name" paddingAngle={4}
                  isAnimationActive={true} animationBegin={300} animationDuration={1200}
                  onClick={(d) => navigate(`/admin/publications?source=${d.name}`)}>
                  {chartSource.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} cursor="pointer" stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [`${v} pubs`, n]}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: "11px", color: "#64748b" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Top chercheurs + Événements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Top 5 chercheurs" icon={Award} iconColor="text-amber-500" delay={0.5}>
          {topChercheurs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Award className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">Aucune donnée</p>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-1">
              {topChercheurs.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  whileHover={{ backgroundColor: "#eff6ff", borderRadius: "12px" }}
                  onClick={() => navigate("/admin/chercheurs")}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-colors group">
                  <motion.span whileHover={{ scale: 1.3 }} className="text-xl flex-shrink-0">
                    {MEDAL[i] ?? `#${i + 1}`}
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{c.chercheur_nom}</p>
                      <span className="text-xs font-bold text-blue-600 ml-2 flex-shrink-0">{c.total}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.total / maxPubs) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Événements à venir" icon={Calendar} iconColor="text-purple-600" delay={0.55}>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Calendar className="w-8 h-8 mb-2 opacity-30" /><p className="text-sm">Aucun événement à venir</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {upcomingEvents.map((ev, i) => (
                <motion.li key={ev.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ backgroundColor: "#faf5ff" }}
                  onClick={() => navigate("/admin/evenements")}
                  className="px-6 py-3 flex items-center gap-3 cursor-pointer transition-colors group">
                  <motion.div whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 rounded-xl bg-purple-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-purple-700 leading-none">
                      {ev.date ? new Date(ev.date).getDate() : "—"}
                    </span>
                    <span className="text-[10px] text-purple-500 uppercase leading-none">
                      {ev.date ? new Date(ev.date).toLocaleDateString("fr-FR", { month: "short" }) : ""}
                    </span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-purple-700 transition-colors">{ev.titre}</p>
                    {ev.type && <span className="inline-flex mt-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-medium rounded">{ev.type}</span>}
                  </div>
                  <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1, x: 3 }}>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* ── AI Analysis ── */}
      <AIAnalysisSection stats={stats} chartAnnee={chartAnnee} chartSource={chartSource} topChercheurs={topChercheurs} />
    </div>
  );
}

// ─── AI Analysis Section ──────────────────────────────────────────────────────
function AIAnalysisSection({ stats, chartAnnee, chartSource, topChercheurs }: {
  stats: GlobalStats;
  chartAnnee: { annee: string; total: number }[];
  chartSource: { name: string; value: number }[];
  topChercheurs: { chercheur_nom: string; total: number }[];
}) {
  const [expanded, setExpanded] = useState(false);

  const totalPubs = stats.publications || 0;
  const lastYear  = chartAnnee[chartAnnee.length - 1];
  const prevYear  = chartAnnee[chartAnnee.length - 2];
  const growth = lastYear && prevYear && prevYear.total > 0
    ? Math.round(((lastYear.total - prevYear.total) / prevYear.total) * 100) : null;
  const topSource     = chartSource[0];
  const topChercheur  = topChercheurs[0];
  const avgPerChercheur = stats.chercheurs && totalPubs ? Math.round(totalPubs / stats.chercheurs) : 0;

  const insights = [
    {
      icon: "📈", title: "Tendance de production", color: "blue",
      text: growth !== null
        ? `La production a ${growth >= 0 ? "augmenté" : "diminué"} de ${Math.abs(growth)}% entre ${prevYear?.annee} et ${lastYear?.annee}. ${growth >= 0 ? "Tendance positive à maintenir." : "Un effort de mobilisation est recommandé."}`
        : "Données insuffisantes pour calculer la tendance annuelle.",
    },
    {
      icon: "🏆", title: "Chercheur le plus productif", color: "amber",
      text: topChercheur
        ? `${topChercheur.chercheur_nom} est le plus actif avec ${topChercheur.total} publications (${Math.round((topChercheur.total / totalPubs) * 100)}% du total).`
        : "Aucune donnée disponible.",
    },
    {
      icon: "🔬", title: "Source dominante", color: "emerald",
      text: topSource
        ? `${topSource.name} est la principale source (${topSource.value} articles, ${Math.round((topSource.value / totalPubs) * 100)}%). Diversifier les sources renforcerait la visibilité internationale.`
        : "Aucune source identifiée.",
    },
    {
      icon: "👥", title: "Productivité moyenne", color: "purple",
      text: `Moyenne de ${avgPerChercheur} publications/chercheur sur ${totalPubs} total. ${avgPerChercheur >= 5 ? "Niveau satisfaisant." : "Un accompagnement à la publication est recommandé."}`,
    },
    {
      icon: "💡", title: "Recommandation stratégique", color: "rose",
      text: "Cibler les revues JCR Q1/Q2, encourager les collaborations internationales, et systématiser l'archivage dans DBLP, Scopus et WOS.",
    },
  ];

  const COLOR_MAP: Record<string, string> = {
    blue:    "bg-blue-50 border-blue-200 text-blue-800",
    amber:   "bg-amber-50 border-amber-200 text-amber-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    purple:  "bg-purple-50 border-purple-200 text-purple-800",
    rose:    "bg-rose-50 border-rose-200 text-rose-800",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-base">🤖</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900">Analyse IA — Résumé scientifique</p>
            <p className="text-xs text-slate-400">Insights générés depuis les données réelles du laboratoire</p>
          </div>
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="px-2.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">IA</motion.span>
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`p-4 rounded-xl border ${COLOR_MAP[insight.color]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{insight.icon}</span>
                    <p className="font-semibold text-sm">{insight.title}</p>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{insight.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
