import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import {
  Home, FileEdit, GraduationCap, CalendarDays, User,
  LogOut, FileText, ChevronLeft, ChevronRight, ChevronDown,
  BookOpen, Presentation, BookMarked, Clock,
} from "lucide-react";
import logoLarodec from "../../imports/image-1.png";
import { useAuth } from "../../lib/auth";

const API = "http://localhost:3001";

const C: Record<string, { bg: string; text: string; dot: string; icon: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    icon: "bg-blue-100 text-blue-600"    },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500",    icon: "bg-cyan-100 text-cyan-600"    },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  icon: "bg-violet-100 text-violet-600"  },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500",  icon: "bg-orange-100 text-orange-600"  },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "bg-emerald-100 text-emerald-600" },
  slate:   { bg: "bg-slate-100",  text: "text-slate-700",   dot: "bg-slate-400",   icon: "bg-slate-100 text-slate-500"   },
};

const getPrefix = (grade: string) => {
  const m: Record<string, string> = { "Professeur": "Prof.", "Maitre de Conferences": "Dr.", "Maitre Assistant": "Dr.", "Assistant": "Dr.", "Doctorant": "" };
  return m[grade] ?? "Dr.";
};

export function Sidebar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed,    setCollapsed]    = useState(false);
  const [pubsOpen,     setPubsOpen]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const token = () => localStorage.getItem("larodec_token") ?? "";

  useEffect(() => {
    if (!session?.user) return;
    const fullName = session.user.nom && session.user.prenom
      ? `${session.user.nom} ${session.user.prenom}`.toUpperCase() : "";
    if (!fullName) return;
    fetch(`${API}/api/articles?chercheur=${encodeURIComponent(fullName)}&limit=200`, {
      headers: { Authorization: `Bearer ${token()}` },
    }).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.items) {
        const pending = d.items.filter((p: any) => !p.validee_chercheur && !p.rejetee_chercheur).length;
        setPendingCount(pending);
      }
    }).catch(() => {});
  }, [session]);

  // auto-open pubs submenu when on a pubs sub-route
  useEffect(() => {
    if (location.pathname.startsWith("/chercheur/contributions")) setPubsOpen(true);
  }, [location.pathname]);

  const prefix      = session?.user.grade ? getPrefix(session.user.grade) : "";
  const displayName = session?.user.prenom && session?.user.nom
    ? `${prefix} ${session.user.prenom} ${session.user.nom}`.trim()
    : session?.user.email ?? "...";
  const initials = session?.user.prenom && session?.user.nom
    ? `${session.user.prenom[0]}${session.user.nom[0]}`.toUpperCase() : "?";

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const NavItem = ({ to, icon: Icon, label, color, exact = false, badge }: {
    to: string; icon: any; label: string; color: string; exact?: boolean; badge?: number;
  }) => {
    const active = isActive(to, exact);
    const c = C[color];
    return (
      <NavLink to={to} end={exact}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${active ? `${c.bg} ${c.text}` : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${active ? c.icon : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">{badge > 99 ? "99+" : badge}</span>
            )}
            {active && <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
          </>
        )}
        {active && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 ${c.dot} rounded-r-full`} />}
      </NavLink>
    );
  };

  const pubSubItems = [
    { to: "/chercheur/contributions?type=journal",     icon: BookOpen,       label: "Revues",                  badge: undefined },
    { to: "/chercheur/contributions?type=conference",  icon: Presentation,   label: "Conferences & Workshops",  badge: undefined },
    { to: "/chercheur/contributions?type=book",        icon: BookMarked,     label: "Ouvrages & Chapitres",     badge: undefined },
    { to: "/chercheur/contributions?type=pending",     icon: Clock,          label: "En attente",               badge: pendingCount > 0 ? pendingCount : undefined },
  ];

  return (
    <aside className={`${collapsed ? "w-[68px]" : "w-64"} flex-shrink-0 h-screen bg-white border-r border-slate-100 flex flex-col transition-all duration-300 shadow-sm`}>
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm p-0.5">
          <img src={logoLarodec} alt="LARODEC" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-900 text-sm leading-tight">LARODEC</p>
            <p className="text-xs text-slate-400 font-medium">ISG Tunis</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all flex-shrink-0">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />Espace Chercheur
        </div>
      )}

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <NavItem to="/chercheur" icon={Home} label="Tableau de bord" color="blue" exact />

        {/* Mes Publications — expandable */}
        <div>
          <button
            onClick={() => !collapsed && setPubsOpen(o => !o)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
              isActive("/chercheur/contributions") ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive("/chercheur/contributions") ? "bg-cyan-100 text-cyan-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>
              <FileEdit className="w-4 h-4" />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Mes Publications</span>
                {pendingCount > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">{pendingCount > 99 ? "99+" : pendingCount}</span>}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${pubsOpen ? "rotate-180" : ""}`} />
              </>
            )}
            {isActive("/chercheur/contributions") && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-500 rounded-r-full" />}
          </button>

          {/* Submenu with slide animation */}
          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${pubsOpen && !collapsed ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-4 pl-3 border-l border-slate-100 mt-1 space-y-0.5">
              {pubSubItems.map(({ to, icon: Icon, label, badge }) => {
                const active = location.pathname + location.search === to || location.search === to.replace("/chercheur/contributions","");
                return (
                  <NavLink key={to} to={to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${active ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge !== undefined && badge > 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white">{badge > 99 ? "99+" : badge}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        <NavItem to="/chercheur/theses"    icon={GraduationCap} label="Theses"      color="violet"  />
        <NavItem to="/chercheur/evenements" icon={CalendarDays}  label="Evenements"  color="orange"  />
        <NavItem to="/chercheur/cv"         icon={FileText}      label="Mon CV"      color="emerald" />
        <NavItem to="/chercheur/profil"     icon={User}          label="Mon Profil"  color="slate"   />
      </nav>

      {!collapsed && (
        <div className="px-5 py-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />Donnees en direct
        </div>
      )}

      <div className="px-2 py-3 border-t border-slate-100 space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-400 shadow-sm">
            {session?.user.id
              ? <img src={`${API}/api/auth/photo/${session.user.id}`} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{session?.user.grade || "Chercheur"}</p>
            </div>
          )}
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all group ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100">
            <LogOut className="w-4 h-4" />
          </div>
          {!collapsed && <span>Deconnexion</span>}
        </button>
      </div>
    </aside>
  );
}

