import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Users, X, BookOpen, GraduationCap, Building2, Award, Crown, Phone, Mail, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { researchersApi } from "../../lib/api";

const CATEGORIES = [
  { key: "Corps A",          label: "Conseil Scientifique" },
  { key: "Corps B",          label: "Corps B — Maitres Assistants" },
  { key: "Doctorant",        label: "Doctorants" },
  { key: "Master Recherche", label: "Etudiants Mastere" },
  { key: "Post-Doc",         label: "Post-Doctorants" },
];

const GRADE_COLORS: Record<string, string> = {
  "Professeur":                        "bg-purple-100 text-purple-700 border-purple-200",
  "Maitre de Conferences":             "bg-blue-100 text-blue-700 border-blue-200",
  "Maître de Conférences":             "bg-blue-100 text-blue-700 border-blue-200",
  "Maitre Assistant":                  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Maître Assistant":                  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Post Doc":                          "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Assistant Doctorant":               "bg-orange-100 text-orange-700 border-orange-200",
  "Ingénieur contractuelle Doctorant": "bg-rose-100 text-rose-700 border-rose-200",
  "Assistant":                         "bg-green-100 text-green-700 border-green-200",
};

const GRADE_ORDER: Record<string, number> = {
  "Professeur": 1,
  "Maitre de Conferences": 2,
  "Maître de Conférences": 2,
  "Maitre Assistant": 3,
  "Maître Assistant": 3,
  "Assistant Doctorant": 4,
  "Assistant": 5,
};

function MemberAvatar({ photoUrl, name, size = "sm" }: { photoUrl?: string; name: string; size?: "sm" | "lg" }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const dim = size === "lg" ? "w-24 h-24 text-2xl" : "w-11 h-11 text-sm";

  useEffect(() => {
    if (!photoUrl) return;
    setImgSrc(null);
    setError(false);
    fetch(photoUrl)
      .then(r => r.json())
      .then(d => { if (d.photo_url) setImgSrc(d.photo_url); else setError(true); })
      .catch(() => setError(true));
  }, [photoUrl]);

  if (imgSrc && !error) {
    return (
      <img src={imgSrc} alt={name}
        className={`${dim} rounded-full object-cover border-2 border-white shadow-md flex-shrink-0`}
        onError={() => setError(true)} />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md`}>
      {initials}
    </div>
  );
}

function PublicationsList({ loading, profile }: { loading: boolean; profile: any }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const copyApa = (apa: string, idx: number) => {
    navigator.clipboard.writeText(apa);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-blue-600" />
        <h4 className="font-semibold text-gray-800 text-sm">Publications</h4>
        {!loading && profile?.nb_publications > 0 && (
          <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
            {profile.nb_publications}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      ) : profile?.publications?.length > 0 ? (
        <div className="space-y-2">
          {profile.publications.map((pub: any, i: number) => {
            const isOpen = expandedIdx === i;
            const apa = pub.citation_apa || `${pub.auteurs || ""} (${pub.annee || "s.d."}). ${pub.titre}. ${pub.journal_ou_editeur || ""}${pub.volume ? `, ${pub.volume}` : ""}${pub.numero ? `(${pub.numero})` : ""}${pub.pages ? `, ${pub.pages}` : ""}.${pub.doi ? ` https://doi.org/${pub.doi}` : ""}`;

            return (
              <div key={i} className={`rounded-xl border transition-all ${isOpen ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"}`}>
                {/* Header - click to expand */}
                <button onClick={() => setExpandedIdx(isOpen ? null : i)}
                  className="w-full text-left p-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-relaxed">{pub.titre}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {pub.annee && <span className="text-xs text-gray-500">📅 {pub.annee}</span>}
                      {pub.indexation && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                          {pub.indexation}
                        </span>
                      )}
                      {pub.type_publication && (
                        <span className="text-xs text-gray-400">{pub.type_publication}</span>
                      )}
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  }
                </button>

                {/* Expanded APA view */}
                {isOpen && (
                  <div className="px-3 pb-3 border-t border-blue-200">
                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Format APA</span>
                        <button onClick={() => copyApa(apa, i)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                          {copied === i
                            ? <><Check className="w-3 h-3 text-green-500" /><span className="text-green-500">Copié!</span></>
                            : <><Copy className="w-3 h-3" /><span>Copier</span></>
                          }
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed italic">{apa}</p>
                    </div>
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink className="w-3 h-3" />
                        DOI: {pub.doi}
                      </a>
                    )}
                    {pub.journal_ou_editeur && (
                      <p className="mt-1 text-xs text-gray-500">📰 {pub.journal_ou_editeur}</p>
                    )}
                    {pub.auteurs && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">👥 {pub.auteurs}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Aucune publication trouvée</p>
        </div>
      )}
    </div>
  );
}

export function GestionChercheurs() {
  const [activeTab, setActiveTab] = useState("Corps A");
  const [searchTerm, setSearchTerm] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [researchers, setResearchers] = useState<any[]>([]);
  const [catStats, setCatStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [changingDirecteur, setChangingDirecteur] = useState(false);
  const [directeurMsg, setDirecteurMsg] = useState("");

  const token = localStorage.getItem("larodec_token");

  useEffect(() => {
    researchersApi.getStats().then(setCatStats).catch(console.error);
  }, []);

  const loadResearchers = useCallback(() => {
    setIsLoading(true);
    researchersApi.getAll({ categorie: activeTab, search: searchTerm || undefined })
      .then(data => {
        const sorted = [...(data || [])].sort((a, b) => {
          if (a.is_directeur && !b.is_directeur) return -1;
          if (!a.is_directeur && b.is_directeur) return 1;
          const ga = GRADE_ORDER[a.grade] ?? 5;
          const gb = GRADE_ORDER[b.grade] ?? 5;
          if (ga !== gb) return ga - gb;
          return (a.nom_prenom || "").localeCompare(b.nom_prenom || "");
        });
        setResearchers(sorted);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activeTab, searchTerm]);

  useEffect(() => {
    setSelected(null);
    setDirecteurMsg("");
    loadResearchers();
  }, [loadResearchers]);

  // Global search across all categories
  useEffect(() => {
    if (!globalSearch.trim()) { setGlobalResults([]); return; }
    setGlobalLoading(true);
    researchersApi.getAll({ search: globalSearch })
      .then(data => setGlobalResults(data || []))
      .catch(console.error)
      .finally(() => setGlobalLoading(false));
  }, [globalSearch]);

  const handleSelectResearcher = async (r: any) => {
    setSelected(r);
    setDirecteurMsg("");
    setLoadingProfile(true);
    try {
      const data = await researchersApi.getProfile(r.nom_prenom);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSetDirecteur = async () => {
    if (!selected || !selected.table_source) return;
    setChangingDirecteur(true);
    setDirecteurMsg("");
    try {
      const res = await fetch(
        `http://localhost:3001/api/researchers/set-directeur/${selected.table_source}/${selected.id}`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setDirecteurMsg(`✅ ${data.directeur} est maintenant directeur(trice)`);
        // Update selected
        setSelected((prev: any) => ({ ...prev, is_directeur: true }));
        loadResearchers();
      }
    } catch {
      setDirecteurMsg("❌ Erreur lors du changement");
    } finally {
      setChangingDirecteur(false);
    }
  };

  const totalMembers = (Object.values(catStats) as number[]).reduce((a, b) => a + b, 0);
  const hasDates = activeTab === "Doctorant" || activeTab === "Master Recherche";
  const showGrade = activeTab === "Corps A" || activeTab === "Corps B" || activeTab === "Post-Doc";

  // Group by grade for Corps A, B, Doctorants, Post-Doc AND Master
  const grouped: Record<string, any[]> | null = (
    activeTab === "Corps A" || activeTab === "Corps B" ||
    activeTab === "Doctorant" || activeTab === "Post-Doc" ||
    activeTab === "Master Recherche"
  )
    ? researchers.reduce((acc: Record<string, any[]>, r) => {
        const g = r.is_directeur ? "__directeur__" : (r.grade || r.categorie || activeTab);
        if (!acc[g]) acc[g] = [];
        acc[g].push(r);
        return acc;
      }, {})
    : null;

  const groupOrder = (key: string) => {
    if (key === "__directeur__") return 0;
    return GRADE_ORDER[key] ?? 5;
  };

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className={`flex-1 p-8 overflow-auto transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestion des Chercheurs</h1>
            <p className="text-gray-500 text-sm">Equipe de recherche LARODEC — données réelles</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-100">
            <Users className="w-4 h-4" />
            {totalMembers} membres au total
          </div>
        </div>

        {/* Global search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="🔍 Recherche globale — tous les membres (nom, établissement...)"
              value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none text-sm bg-blue-50/30 focus:bg-white transition-all font-medium" />
            {globalSearch && (
              <button onClick={() => { setGlobalSearch(""); setGlobalResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Global search results */}
          {globalSearch.trim() && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {globalLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
              ) : globalResults.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">Aucun résultat</div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {globalResults.length} résultat(s) dans toutes les catégories
                  </div>
                  {globalResults.map((r, i) => (
                    <button key={i} onClick={() => {
                      setGlobalSearch("");
                      setGlobalResults([]);
                      // Switch to the right tab
                      const tabMap: Record<string, string> = {
                        "enseignants_corps_a": "Corps A",
                        "enseignants_corps_b": "Corps B",
                        "doctorants": "Doctorant",
                        "etudiants_master_recherche": "Master Recherche",
                        "cadres_post_doc": "Post-Doc",
                      };
                      const tab = tabMap[r.table_source] || "Corps A";
                      setActiveTab(tab);
                      setTimeout(() => handleSelectResearcher(r), 300);
                    }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left">
                      <MemberAvatar
                        photoUrl={r.id ? `http://localhost:3001/api/public/researcher-photo/${r.id}?table=${r.table_source}` : undefined}
                        name={r.nom_prenom}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{r.nom_prenom}</p>
                        <p className="text-xs text-gray-500 truncate">{r.etablissement}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {r.grade && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GRADE_COLORS[r.grade] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {r.grade}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{
                          r.table_source === "enseignants_corps_a" ? "Conseil Scientifique" :
                          r.table_source === "enseignants_corps_b" ? "Corps B" :
                          r.table_source === "doctorants" ? "Doctorant" :
                          r.table_source === "etudiants_master_recherche" ? "Master" :
                          "Post-Doc"
                        }</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setActiveTab(cat.key)}
              className={`px-5 py-3 font-medium text-sm whitespace-nowrap transition-all relative flex-shrink-0 ${
                activeTab === cat.key ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
              }`}>
              {cat.label}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${
                activeTab === cat.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}>
                {catStats[cat.key] ?? "..."}
              </span>
              {activeTab === cat.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher par nom..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 focus:bg-white transition-all" />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : researchers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun membre dans cette catégorie.</p>
          </div>
        ) : grouped ? (
          <div className="space-y-8">
            {Object.entries(grouped)
              .sort(([a], [b]) => groupOrder(a) - groupOrder(b))
              .map(([gradeKey, members]) => (
                <div key={gradeKey}>
                  <div className="flex items-center gap-3 mb-4">
                    {gradeKey === "__directeur__"
                      ? <Crown className="w-5 h-5 text-amber-500" />
                      : <Award className="w-5 h-5 text-blue-600" />
                    }
                    <h2 className={`text-lg font-bold ${gradeKey === "__directeur__" ? "text-amber-700" : "text-gray-800"}`}>
                      {gradeKey === "__directeur__" ? "Directeur(trice) du Laboratoire" : gradeKey}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      gradeKey === "__directeur__" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {members.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {members.map((r, i) => (
                      <button key={r.id ?? i} onClick={() => handleSelectResearcher(r)}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:shadow-md ${
                          selected?.id === r.id && selected?.table_source === r.table_source
                            ? "border-blue-400 bg-blue-50 shadow-md"
                            : r.is_directeur
                              ? "border-amber-200 bg-amber-50/50 hover:border-amber-300"
                              : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                        }`}>
                        <div className="relative">
                          <MemberAvatar
                            photoUrl={r.id ? `http://localhost:3001/api/public/researcher-photo/${r.id}?table=${r.table_source}` : undefined}
                            name={r.nom_prenom}
                          />
                          {r.is_directeur && (
                            <Crown className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm">{r.nom_prenom}</p>
                            {r.is_directeur && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium border border-amber-200">
                                Directeur(trice)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{r.etablissement}</p>
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GRADE_COLORS[r.grade] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {r.grade || "—"}
                          </span>
                          <span className="text-xs text-gray-400">{r.universite}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {researchers.map((r, i) => (
              <button key={r.id ?? i} onClick={() => handleSelectResearcher(r)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:shadow-md ${
                  selected?.id === r.id ? "border-blue-400 bg-blue-50 shadow-md" : "border-gray-100 bg-white hover:border-blue-200"
                }`}>
                <MemberAvatar
                  photoUrl={r.id ? `http://localhost:3001/api/public/researcher-photo/${r.id}?table=${r.table_source}` : undefined}
                  name={r.nom_prenom}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{r.nom_prenom}</p>
                  <p className="text-xs text-gray-500 truncate">{r.etablissement}</p>
                </div>
                {showGrade && r.grade && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium hidden md:block ${GRADE_COLORS[r.grade] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {r.grade}
                  </span>
                )}
                {hasDates && r.date_debut && (
                  <span className="text-xs text-gray-400 hidden md:block">{r.date_debut?.slice(0, 4)}</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-400 text-right">{researchers.length} résultat(s)</div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-auto flex-shrink-0">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <h3 className="font-bold text-gray-900 text-sm">Fiche Chercheur</h3>
            <button onClick={() => { setSelected(null); setProfile(null); setDirecteurMsg(""); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {/* Photo + name */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative">
                <MemberAvatar
                  photoUrl={selected.id ? `http://localhost:3001/api/public/researcher-photo/${selected.id}?table=${selected.table_source}` : undefined}
                  name={selected.nom_prenom}
                  size="lg"
                />
                {selected.is_directeur && (
                  <Crown className="w-6 h-6 text-amber-500 absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow" />
                )}
              </div>
              <h2 className="mt-4 text-lg font-bold text-gray-900">{selected.nom_prenom}</h2>
              {selected.is_directeur && (
                <span className="mt-1 text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold border border-amber-200">
                  👑 Directeur(trice) du Laboratoire
                </span>
              )}
              {selected.grade && (
                <span className={`mt-2 text-xs px-3 py-1 rounded-full border font-semibold ${GRADE_COLORS[selected.grade] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {selected.grade}
                </span>
              )}
            </div>

            {/* Change directeur button (only for Corps A/B) */}
            {(selected.table_source === "enseignants_corps_a" || selected.table_source === "enseignants_corps_b") && !selected.is_directeur && (
              <div className="mb-4">
                <button onClick={handleSetDirecteur} disabled={changingDirecteur}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                  {changingDirecteur ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  Nommer comme Directeur(trice)
                </button>
                {directeurMsg && <p className="text-xs text-center mt-2 text-green-600">{directeurMsg}</p>}
              </div>
            )}
            {selected.is_directeur && directeurMsg && (
              <p className="text-xs text-center mb-4 text-green-600">{directeurMsg}</p>
            )}

            {/* Info */}
            <div className="space-y-3 mb-6">
              {selected.etablissement && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Building2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Établissement</p>
                    <p className="text-sm text-gray-800">{selected.etablissement}</p>
                  </div>
                </div>
              )}
              {selected.universite && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <GraduationCap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Université</p>
                    <p className="text-sm text-gray-800">{selected.universite}</p>
                  </div>
                </div>
              )}
              {selected.n_cin && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Award className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">CIN</p>
                    <p className="text-sm text-gray-800 font-mono">{selected.n_cin}</p>
                  </div>
                </div>
              )}
              {/* Contact from larodec_users */}
              {loadingProfile ? null : profile?.profile?.telephone && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Téléphone</p>
                    <a href={`tel:${profile.profile.telephone}`} className="text-sm text-blue-600 hover:underline">
                      {profile.profile.telephone}
                    </a>
                  </div>
                </div>
              )}
              {loadingProfile ? null : profile?.profile?.email && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <a href={`mailto:${profile.profile.email}`} className="text-sm text-blue-600 hover:underline break-all">
                      {profile.profile.email}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Publications — masquées pour les étudiants master */}
            {selected.table_source !== "etudiants_master_recherche" && (
              <PublicationsList loading={loadingProfile} profile={profile} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
