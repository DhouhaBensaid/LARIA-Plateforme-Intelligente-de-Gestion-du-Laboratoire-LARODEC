import { useState, useEffect } from "react";
import { Plus, Search, Filter, FileText, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
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

export function MesContributions() {
  const { session } = useAuth();
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPub, setExpandedPub] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fullName = session?.user.nom && session?.user.prenom
    ? `${session.user.nom} ${session.user.prenom}`.toUpperCase()
    : "";

  useEffect(() => {
    loadPublications();
  }, [session]);

  const loadPublications = async () => {
    try {
      setLoading(true);
      const pubs = fullName
        ? await articlesApi.getAll({ chercheur: fullName, limit: 200 })
        : { items: [] };
      setPublications(pubs.items || []);
    } catch (error) {
      console.error("Erreur chargement publications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPublications = publications.filter(pub =>
    pub.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.journal_ou_editeur?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
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
          <h1 className="text-3xl font-bold mb-2">Mes Contributions</h1>
          <p className="text-blue-100">Gérez vos publications scientifiques</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <p className="text-3xl font-bold text-blue-600 mb-1">{publications.length}</p>
            <p className="text-sm text-slate-600">Publications totales</p>
          </div>
          <div className="bg-white rounded-xl border border-cyan-100 p-6 shadow-sm">
            <p className="text-3xl font-bold text-cyan-600 mb-1">{new Set(publications.map(p => p.annee)).size}</p>
            <p className="text-sm text-slate-600">Années actives</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm">
            <p className="text-3xl font-bold text-emerald-600 mb-1">{new Set(publications.map(p => p.journal_ou_editeur)).size}</p>
            <p className="text-sm text-slate-600">Journaux/Éditeurs</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une publication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            />
          </div>
        </div>

        {/* Publications List */}
        {filteredPublications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-blue-100 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Aucune publication trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPublications.map((pub: any, idx: number) => {
              const pubId = `pub-${idx}`;
              const isExpanded = expandedPub === pubId;
              const apaText = formatAPA(pub);
              const isCopied = copiedId === pubId;

              return (
                <div key={pubId} className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <button
                    onClick={() => setExpandedPub(isExpanded ? null : pubId)}
                    className="w-full text-left px-6 py-5 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {pub.titre}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          {pub.journal_ou_editeur && (
                            <span className="text-sm text-slate-600 italic">{pub.journal_ou_editeur}</span>
                          )}
                          {pub.annee && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                              {pub.annee}
                            </span>
                          )}
                          {pub.type && (
                            <span className="text-xs bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full font-medium">
                              {pub.type}
                            </span>
                          )}
                          {pub.source_scraping && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                              {pub.source_scraping}
                            </span>
                          )}
                        </div>
                        {pub.auteurs && (
                          <p className="text-sm text-slate-500">Auteurs: {pub.auteurs}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 mt-1 text-slate-400 group-hover:text-slate-600 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gradient-to-b from-blue-50/50 to-transparent border-t border-blue-100">
                      <div className="mt-4 space-y-4">
                        {/* Détails */}
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Détails</p>
                          <div className="bg-white border border-blue-100 rounded-lg p-4 space-y-2 text-sm">
                            {pub.journal_ou_editeur && (
                              <div>
                                <span className="font-medium text-slate-700">Journal/Éditeur:</span>
                                <p className="text-slate-600">{pub.journal_ou_editeur}</p>
                              </div>
                            )}
                            {pub.auteurs && (
                              <div>
                                <span className="font-medium text-slate-700">Auteurs:</span>
                                <p className="text-slate-600">{pub.auteurs}</p>
                              </div>
                            )}
                            {pub.abstract && (
                              <div>
                                <span className="font-medium text-slate-700">Résumé:</span>
                                <p className="text-slate-600">{pub.abstract}</p>
                              </div>
                            )}
                            {pub.doi && (
                              <div>
                                <span className="font-medium text-slate-700">DOI:</span>
                                <a
                                  href={`https://doi.org/${pub.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                >
                                  {pub.doi}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Référence APA */}
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
                            Référence APA
                          </p>
                          <div className="bg-white border border-blue-200 rounded-lg px-4 py-3">
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {apaText}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(apaText, pubId)}
                            className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                          >
                            {isCopied
                              ? <><Check className="w-4 h-4" /> Copié !</>
                              : <><Copy className="w-4 h-4" /> Copier la référence</>
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
