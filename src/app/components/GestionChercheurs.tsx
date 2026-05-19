import { useState, useEffect } from "react";
import { Search, Loader2, Users, Calendar } from "lucide-react";
import { researchersApi } from "../../lib/api";

const CATEGORIES = [
  { key: "Corps A",          label: "Corps A — Professeurs & MC" },
  { key: "Corps B",          label: "Corps B — Maitres Assistants" },
  { key: "Doctorant",        label: "Doctorants" },
  { key: "Master Recherche", label: "Etudiants Mastere" },
  { key: "Post-Doc",         label: "Post-Doctorants" },
];

const BADGE_COLORS: Record<string, string> = {
  "Corps A":          "bg-blue-100 text-blue-700",
  "Corps B":          "bg-indigo-100 text-indigo-700",
  "Doctorant":        "bg-purple-100 text-purple-700",
  "Master Recherche": "bg-green-100 text-green-700",
  "Post-Doc":         "bg-orange-100 text-orange-700",
};

export function GestionChercheurs() {
  const [activeTab, setActiveTab] = useState("Corps A");
  const [searchTerm, setSearchTerm] = useState("");
  const [researchers, setResearchers] = useState<any[]>([]);
  const [catStats, setCatStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    researchersApi.getStats().then(setCatStats).catch(console.error);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    researchersApi.getAll({ categorie: activeTab, search: searchTerm || undefined })
      .then(setResearchers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activeTab, searchTerm]);

  const hasDates = activeTab === "Doctorant" || activeTab === "Master Recherche";
  const showGrade = activeTab === "Corps A" || activeTab === "Corps B" || activeTab === "Post-Doc";

  const formatDate = (d: string) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Chercheurs</h1>
          <p className="text-gray-600">Equipe de recherche LARODEC — donnees reelles</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          <Users className="w-4 h-4" />
          {Object.values(catStats).reduce((a: number, b: number) => a + b, 0)} membres au total
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button key={cat.key} onClick={() => setActiveTab(cat.key)}
            className={`px-5 py-3 font-medium text-sm whitespace-nowrap transition-all relative flex-shrink-0 ${
              activeTab === cat.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
            }`}>
            {cat.label}
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {catStats[cat.key] ?? "..."}
            </span>
            {activeTab === cat.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : researchers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun membre dans cette categorie.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                  {showGrade && <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Nom & Prenom</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">CIN</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Etablissement</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Universite</th>
                  {hasDates && <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Debut</th>}
                  {hasDates && <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {researchers.map((r, i) => (
                  <tr key={r.id ?? i} className="hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <td className="px-4 py-3">
                      {r.url_photo ? (
                        <img src={r.url_photo} alt={r.nom_prenom}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                          {(r.nom_prenom || "?")[0]}
                        </div>
                      )}
                    </td>
                    {showGrade && (
                      <td className="px-6 py-4 text-sm text-gray-700">{r.grade || "—"}</td>
                    )}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.nom_prenom}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{r.n_cin}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{r.etablissement}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.universite}</td>
                    {hasDates && <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.date_debut)}</td>}
                    {hasDates && <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.date_fin)}</td>}
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[r.categorie] || "bg-gray-100 text-gray-600"}`}>
                        {r.categorie}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
            {researchers.length} resultat(s) affiche(s)
          </div>
        </div>
      )}
    </div>
  );
}
