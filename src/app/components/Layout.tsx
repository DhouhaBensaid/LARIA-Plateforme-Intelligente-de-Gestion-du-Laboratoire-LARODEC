import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import { Users, FileText, GraduationCap, Calendar, Handshake, FileBarChart, Building2, LogOut, Home, User, ChevronLeft, ChevronRight, ArrowLeftRight, Sparkles } from "lucide-react";
import logoLarodec from "../../imports/image-1.png";
import { useAuth } from "../../lib/auth";

const API = "http://localhost:3001";
const ADMIN_ITEMS = [
  { icon: Home,          label: "Tableau de bord",  path: "/admin",              color: "blue"    },
  { icon: Users,         label: "Chercheurs",        path: "/admin/chercheurs",   color: "violet"  },
  { icon: FileText,      label: "Publications",      path: "/admin/publications", color: "cyan"    },
  { icon: GraduationCap, label: "Theses & Masteres", path: "/admin/theses",       color: "purple"  },
  { icon: Calendar,      label: "Evenements",        path: "/admin/evenements",   color: "orange"  },
  { icon: Handshake,     label: "Conventions",       path: "/admin/conventions",  color: "teal"    },
  { icon: FileBarChart,  label: "Rapport Annuel",    path: "/admin/rapport",      color: "emerald" },
  { icon: Building2,     label: "Info Laboratoire",  path: "/admin/laboratoire",  color: "slate"   },
];
const CHERCHEUR_ITEMS = [
  { icon: Home,          label: "Tableau de bord",   path: "/chercheur",               color: "blue"    },
  { icon: FileText,      label: "Mes Contributions", path: "/chercheur/contributions", color: "cyan"    },
  { icon: GraduationCap, label: "Theses",            path: "/chercheur/theses",        color: "violet"  },
  { icon: Calendar,      label: "Evenements",        path: "/chercheur/evenements",    color: "orange"  },
  { icon: FileText,      label: "Mon CV",            path: "/chercheur/cv",            color: "emerald" },
  { icon: User,          label: "Mon Profil",        path: "/chercheur/profil",        color: "slate"   },
];
const C: Record<string, { bg: string; text: string; dot: string; icon: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    icon: "bg-blue-100 text-blue-600"      },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500",    icon: "bg-cyan-100 text-cyan-600"      },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  icon: "bg-violet-100 text-violet-600"  },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",  icon: "bg-purple-100 text-purple-600"  },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  icon: "bg-orange-100 text-orange-600"  },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    icon: "bg-teal-100 text-teal-600"      },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "bg-emerald-100 text-emerald-600"},
  slate:   { bg: "bg-slate-100",  text: "text-slate-700",   dot: "bg-slate-400",   icon: "bg-slate-100 text-slate-500"    },
};
const getPrefix = (grade: string) => {
  const m: Record<string, string> = { "Professeur": "Prof.", "Maitre de Conferences": "Dr.", "Maitre Assistant": "Dr.", "Assistant": "Dr.", "Doctorant": "" };
  return m[grade] ?? "Dr.";
};
export function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { session, isLoading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isAdminMode     = location.pathname.startsWith("/admin");
  const role            = session?.user.role ?? "";
  const isAdminUser     = role === "admin" || role === "admin+chercheur";
  const isChercheurUser = role === "chercheur" || role === "admin+chercheur";
  const menuItems       = isAdminMode ? ADMIN_ITEMS : CHERCHEUR_ITEMS;
  useEffect(() => {
    if (isLoading) return;
    if (!session) { navigate("/login"); return; }
    if (location.pathname === "/" || location.pathname === "") navigate(isAdminUser ? "/admin" : "/chercheur");
  }, [session, isLoading, navigate, location.pathname]);
  const prefix      = session?.user.grade ? getPrefix(session.user.grade) : "";
  const displayName = session?.user.nom && session?.user.prenom ? `${prefix} ${session.user.prenom} ${session.user.nom}`.trim() : isAdminUser ? "Admin LARODEC" : session?.user.email ?? "...";
  const initials    = session?.user.prenom && session?.user.nom ? `${session.user.prenom[0]}${session.user.nom[0]}`.toUpperCase() : "?";
  const displayedRole = isAdminMode ? "Administrateur" : session?.user.grade || "Chercheur";
  if (isLoading) return null;
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={`${collapsed ? "w-[68px]" : "w-64"} flex-shrink-0 h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300 shadow-sm`}>
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm p-0.5">
            <img src={logoLarodec} alt="LARODEC" className="w-full h-full object-contain" />
          </div>
          {!collapsed && <div className="min-w-0 flex-1"><p className="font-black text-slate-900 text-sm leading-tight">LARODEC</p><p className="text-xs text-slate-400 font-medium">ISG Tunis</p></div>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all flex-shrink-0">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
        {!collapsed && (
          <div className={`mx-3 mt-3 mb-1 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${isAdminMode ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white" : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
            {isAdminMode ? "Espace Admin" : "Espace Chercheur"}
          </div>
        )}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ icon: Icon, label, path, color }) => {
            const c = C[color];
            const isActive = (path === "/admin" || path === "/chercheur") ? location.pathname === path : location.pathname.startsWith(path);
            return (
              <NavLink key={path} to={path} end={path === "/admin" || path === "/chercheur"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${isActive ? `${c.bg} ${c.text}` : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isActive ? c.icon : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!collapsed && <><span className="flex-1 truncate">{label}</span>{isActive && <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}</>}
                {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 ${c.dot} rounded-r-full`} />}
              </NavLink>
            );
          })}
          {!isAdminMode && !collapsed && (
            <div className="pt-3">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest px-3 mb-1">IA</p>
              <NavLink to="/chercheur?tab=ai" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${location.search.includes("tab=ai") ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${location.search.includes("tab=ai") ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}><Sparkles className="w-4 h-4" /></div>
                <span>Recommandations IA</span>
              </NavLink>
            </div>
          )}
        </nav>
        <div className="px-2 py-3 border-t border-slate-100 space-y-1">
          {isAdminUser && isChercheurUser && (
            <button onClick={() => navigate(isAdminMode ? "/chercheur" : "/admin")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100"><ArrowLeftRight className="w-4 h-4" /></div>
              {!collapsed && <span className="truncate">{isAdminMode ? "Espace Chercheur" : "Espace Admin"}</span>}
            </button>
          )}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-400 shadow-sm">
              {session?.user.id ? <img src={`${API}/api/auth/photo/${session.user.id}`} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>}
            </div>
            {!collapsed && <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-800 truncate">{displayName}</p><p className="text-xs text-slate-400 truncate">{displayedRole}</p></div>}
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all group ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100"><LogOut className="w-4 h-4" /></div>
            {!collapsed && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  );
}