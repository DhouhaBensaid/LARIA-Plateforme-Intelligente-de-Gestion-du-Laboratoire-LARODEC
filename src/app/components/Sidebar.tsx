import { NavLink, useNavigate } from "react-router";
import { Home, FileEdit, GraduationCap, CalendarDays, User, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Tableau de bord" },
  { to: "/contributions", icon: FileEdit, label: "Mes Contributions" },
  { to: "/theses", icon: GraduationCap, label: "Thèses" },
  { to: "/evenements", icon: CalendarDays, label: "Événements" },
  { to: "/profil", icon: User, label: "Mon Profil" },
];

export function Sidebar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = session?.user.prenom && session?.user.nom
    ? `${session.user.prenom[0]}${session.user.nom[0]}`.toUpperCase()
    : "?";

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 border-r border-blue-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">LARODEC</p>
            <p className="text-xs text-blue-600 font-medium">ISG Tunis</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow-sm border border-blue-200"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-blue-100 bg-gradient-to-t from-blue-50 to-transparent">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {session?.user.prenom} {session?.user.nom}
            </p>
            <p className="text-xs text-blue-600 truncate font-medium">{session?.user.grade || "Chercheur"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
