import { useState, useEffect } from "react";
import { FileText, Loader, BookOpen, Calendar, TrendingUp, Copy, Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { articlesApi } from "../../lib/api";

function formatAPA(pub: any): string {
  const auteurs = pub.auteurs || pub.chercheur_nom || "";
  const annee = pub.annee || "s.d.";
  const titre = pub.titre || "";
  const journal = pub.journal_ou_editeur || "";
  const doi = pub.doi || "";
  let ref = `${auteurs} (${annee}). ${titre}.`;
  if (journal) ref += ` ${journal}.`;
  if (doi) ref += ` https://doi.org/${doi}`;
  return ref;
}

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

export function DashboardChercheur() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapingDone, setScrapingDone] = useState(false);
  const [myPublications, setMyPublications] = useState<any[]>([]);
  const [otherPublications, setOtherPublications] = useState<any[]>([]);
  const [expandedPub, setExpandedPub] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const userPrefix = session?.user.grade ? getPrefix(session.user.grade) : "Dr.";
  const userName = session?.user.prenom && session?.user.nom
    ? `${userPrefix} ${session.user.prenom} ${session.user.nom}`
    : "Chercheur";

  const fullName = session?.user.nom && session?.user.prenom
    ? `${session.user.nom} ${session.user.prenom}`.toUpperCase()
    : "";

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const myPubs = fullName
        ? await articlesApi.getAll({ chercheur: fullName, limit: 100 })
        : { items: [] };

      const allPubs = await articlesApi.getAll({ limit: 200 });

      const items = myPubs.items || [];
      setMyPublications(items);

      // Afficher les pubs des autres chercheurs
      const others = (allPubs.items || []).filter((p: any) => 
        !fullName || !p.chercheur_nom?.toUpperCase().includes(fullName)
      );
      setOtherPublications(others);

      if (items.length === 0 && fullName) {
        await autoScrape(fullName);
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const autoScrape = async (name: string) => {
    setScraping(true);
    try {
      const response = await fetch("http://localhost:3001/api/scraper/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("larodec_token")}`,
        },
        body: JSON.stringify({
          authorName: name,
          sources: ["dblp", "openalex", "scholar"],
        }),
      });

      if (!response.ok) throw new Error("Erreur scraping");
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const importRes = await fetch("http://localhost:3001/api/scraper/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("larodec_token")}`,
          },
          body: JSON.stringify({ papers: data.results }),
        });

        if (importRes.ok) {
          setScrapingDone(true);
          const myPubs = await articlesApi.getAll({ chercheur: name, limit: 100 });
          setMyPublications(myPubs.items || []);
        }
      }
    } catch (err) {
      console.error("Erreur auto-scraping:", err);
    } finally {
      setScraping(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derived stats
  const totalPubs = myPublications.length;
  const years = myPublications.map(p => Number(p.annee)).filter(Boolean);
  const maxYear = years.length > 0 ? Math.max(...years) : null;
  const activeYears = new Set(years).size;
  const latestCount = maxYear ? myPublications.filter(p => Number(p.annee) === maxYear).length : 0;
  const journals = new Set(myPublications.map(p => p.journal_ou_editeur).filter(Boolean)).size;

  // Group by year
  const byYear: Record<string, any[]> = {};
  myPublications.forEach(pub => {
    const yr = pub.annee || "—";
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(pub);
  });
  const sortedYears = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Chargement en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{userName}</h1>
          <p className="text-blue-100 text-lg">Tableau de bord · Publications scientifiques</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats perso */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            value={myPublications.length}
            label="Mes Publications"
            color="blue"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-cyan-600" />}
            value={new Set(myPublications.map(p => p.annee)).size || "—"}
            label="Années actives"
            color="cyan"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            value={otherPublications.length}
            label="Autres Publications"
            color="emerald"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-amber-600" />}
            value={myPublications.length + otherPublications.length}
            label="Total Labo"
            color="amber"
          />
        </div>

        {/* Mes Publications */}
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-md mb-8">
          <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-base">Mes Publications</h2>
            <span className="ml-auto text-xs text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">{myPublications.length}</span>
          </div>

          {myPublications.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aucune publication trouvée</p>
              {!scraping && (
                <button
                  onClick={() => fullName && autoScrape(fullName)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lancer la synchronisation
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-blue-50">
              {myPublications.map((pub: any, idx: number) => {
                const pubId = `my-${idx}`;
                const isExpanded = expandedPub === pubId;
                const apaText = formatAPA(pub);
                const isCopied = copiedId === pubId;

                return (
                  <div key={pubId} className="border-b border-blue-50 last:border-0">
                    <button
                      onClick={() => setExpandedPub(isExpanded ? null : pubId)}
                      className="w-full text-left px-6 py-4 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 font-medium text-sm leading-snug mb-1 group-hover:text-blue-700 transition-colors">
                            {pub.titre}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            {pub.journal_ou_editeur && (
                              <span className="text-xs text-slate-500 italic">{pub.journal_ou_editeur}</span>
                            )}
                            {pub.type && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {pub.type}
                              </span>
                            )}
                            {pub.annee && (
                              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                                {pub.annee}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-0.5 text-slate-300 group-hover:text-slate-500 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4 bg-blue-50/30 border-t border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-4 mb-2">
                          Référence APA
                        </p>
                        <div className="bg-white border border-blue-200 rounded-xl px-4 py-3 mb-3">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {apaText}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(apaText, pubId)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {isCopied
                            ? <><Check className="w-3.5 h-3.5" /> Copié !</>
                            : <><Copy className="w-3.5 h-3.5" /> Copier la référence</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Autres Publications */}
        {otherPublications.length > 0 && (
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-md">
            <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900 text-base">Publications du Laboratoire</h2>
              <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-100 px-3 py-1 rounded-full">{otherPublications.length}</span>
            </div>

            <div className="divide-y divide-emerald-50">
              {otherPublications.slice(0, 20).map((pub: any, idx: number) => {
                const pubId = `other-${idx}`;
                const isExpanded = expandedPub === pubId;
                const apaText = formatAPA(pub);
                const isCopied = copiedId === pubId;

                return (
                  <div key={pubId} className="border-b border-emerald-50 last:border-0">
                    <button
                      onClick={() => setExpandedPub(isExpanded ? null : pubId)}
                      className="w-full text-left px-6 py-4 hover:bg-emerald-50/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 font-medium text-sm leading-snug mb-1 group-hover:text-emerald-700 transition-colors">
                            {pub.titre}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            <span className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                              {pub.chercheur_nom}
                            </span>
                            {pub.journal_ou_editeur && (
                              <span className="text-xs text-slate-500 italic">{pub.journal_ou_editeur}</span>
                            )}
                            {pub.annee && (
                              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                                {pub.annee}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-0.5 text-slate-300 group-hover:text-slate-500 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-4 bg-emerald-50/30 border-t border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-4 mb-2">
                          Référence APA
                        </p>
                        <div className="bg-white border border-emerald-200 rounded-xl px-4 py-3 mb-3">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {apaText}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(apaText, pubId)}
                          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          {isCopied
                            ? <><Check className="w-3.5 h-3.5" /> Copié !</>
                            : <><Copy className="w-3.5 h-3.5" /> Copier la référence</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: "blue" | "cyan" | "violet" | "emerald" | "amber";
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    cyan: "bg-cyan-50 border-cyan-100",
    violet: "bg-violet-50 border-violet-100",
    emerald: "bg-emerald-50 border-emerald-100",
    amber: "bg-amber-50 border-amber-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className="mb-3">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
