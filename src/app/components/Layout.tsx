import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Users, FileText, BookOpen, GraduationCap, Calendar, Handshake, FileBarChart, Building2, LogOut, UserCircle, Home, User } from "lucide-react";
import logoLarodec from "../../imports/image-1.png";
import { useEffect } from "react";
import { useAuth } from "../../lib/auth";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isLoading, logout } = useAuth();

  // ✅ Le mode affiché dépend du pathname courant (pas du rôle seul)
  const isAdminMode = location.pathname.startsWith("/admin");

  // ✅ Latifa (ou tout user avec 2 rôles) a les deux dans son tableau
  const currentUserRole = session?.user.role ?? "";
  const isAdminUser = currentUserRole === "admin" || currentUserRole === "admin+chercheur";
  const isChercheurUser = currentUserRole === "chercheur" || currentUserRole === "admin+chercheur";

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      navigate("/login");
      return;
    }

    // ✅ Redirection initiale selon le premier rôle disponible
    if (location.pathname === "/" || location.pathname === "") {
      if (isAdminUser) {
        navigate("/admin");
      } else if (isChercheurUser) {
        navigate("/chercheur");
      }
    }
  }, [session, isLoading, navigate, location.pathname, isAdminUser, isChercheurUser]);

  const userName = session
    ? session.user.nom && session.user.prenom
      ? `${session.user.prenom} ${session.user.nom}`
      : isAdminUser
      ? "Admin LARODEC"
      : session.user.email
    : "...";

  // Get prefix based on grade
  const getPrefix = (grade: string) => {
    if (!grade) return "Dr.";
    const gradeMap: Record<string, string> = {
      "Professeur": "Prof.",
      "Maître de Conférences": "Dr.",
      "Maître Assistant": "Dr.",
      "Assistant": "Dr.",
      "Doctorant": "Doctorant",
    };
    return gradeMap[grade] || "Dr.";
  };

  const userPrefix = session?.user.grade ? getPrefix(session.user.grade) : "Dr.";
  const displayName = session
    ? session.user.nom && session.user.prenom
      ? `${userPrefix} ${session.user.prenom} ${session.user.nom}`
      : isAdminUser
      ? "Admin LARODEC"
      : session.user.email
    : "...";

  // ✅ Affiche le rôle selon le mode actif
  const displayedRole = isAdminMode ? "Administrateur" : session?.user.grade || "Chercheur";

  const adminMenuItems = [
    { icon: Home,          label: "Tableau de bord",   path: "/admin" },
    { icon: Users,         label: "Chercheurs",         path: "/admin/chercheurs" },
    { icon: FileText,      label: "Publications",       path: "/admin/publications" },
    { icon: GraduationCap, label: "Thèses & Mastères", path: "/admin/theses" },
    { icon: Calendar,      label: "Événements",         path: "/admin/evenements" },
    { icon: Handshake,     label: "Conventions",        path: "/admin/conventions" },
    { icon: FileBarChart,  label: "Rapport Annuel",     path: "/admin/rapport" },
    { icon: Building2,     label: "Info Laboratoire",   path: "/admin/laboratoire" },
  ];

  const chercheurMenuItems = [
    { icon: Home,          label: "Tableau de bord",    path: "/chercheur" },
    { icon: FileText,      label: "Mes Contributions",  path: "/chercheur/contributions" },
    { icon: BookOpen,      label: "Publications",        path: "/chercheur/publications" },
    { icon: GraduationCap, label: "Thèses",             path: "/chercheur/theses" },
    { icon: Calendar,      label: "Événements",          path: "/chercheur/evenements" },
    { icon: User,          label: "Mon Profil",          path: "/chercheur/profil" },
  ];

  // ✅ Menu selon le mode actif (pathname), pas le rôle fixe
  const menuItems = isAdminMode ? adminMenuItems : chercheurMenuItems;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ✅ Switch : Admin → Chercheur ou Chercheur → Admin
  const handleSwitchDashboard = () => {
    if (isAdminMode) {
      // Je suis en mode admin → passer au dashboard chercheur
      navigate("/chercheur");
    } else {
      // Je suis en mode chercheur → passer au dashboard admin
      navigate("/admin");
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src={logoLarodec} alt="LARODEC Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-900">LARODEC</h1>
              <p className="text-xs text-gray-500">ISG Tunis</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
            {session?.user.id && (
              <img
                src={`http://localhost:3001/api/auth/photo/${session.user.id}`}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover bg-blue-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            {!session?.user.id || !(session?.user.id) ? (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {session?.user.prenom?.[0]}{session?.user.nom?.[0]}
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500">{displayedRole}</p>
            </div>
          </div>

          {/* ✅ Bouton switch visible seulement si le user a les 2 rôles */}
          {isAdminUser && isChercheurUser && (
            <button
              onClick={handleSwitchDashboard}
              className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-all mb-2 text-sm font-medium"
            >
              <Building2 className="w-5 h-5" />
              <span>
                {isAdminMode ? "→ Tableau Chercheur" : "→ Tableau Admin"}
              </span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}