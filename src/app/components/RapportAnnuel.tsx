import { useState, useEffect } from "react";
import { FileBarChart, Download, Printer, Eye, Loader2, RefreshCw } from "lucide-react";
import { rapportApi } from "../../lib/api";

const LAB_INFO = {
  nom: "LARODEC",
  denomination: "Recherche Opérationnelle, Aide à la Décision et Processus de Contrôle",
  code: "LR01ES02",
  universite: "UNIVERSITE DE TUNIS",
  etablissement: "INSTITUT SUPERIEUR DE GESTION DE TUNIS",
  chef: "BEN ARFA RABAI Latifa",
  grade: "Professeur d'Enseignement Supérieur",
  email: "latifa.rabai@gmail.com",
  siteWeb: "http://www.larodec.com",
};

export function RapportAnnuel() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showPreview, setShowPreview] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (year: number) => {
    setIsLoading(true);
    try {
      const d = await rapportApi.get(year);
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(selectedYear); }, [selectedYear]);

  const handlePrint = () => window.print();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapport Annuel d'Évaluation</h1>
          <p className="text-gray-600">Données en temps réel depuis la base de données</p>
        </div>
        <button onClick={() => load(selectedYear)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Year selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Sélectionner l'année</label>
        <div className="flex gap-2">
          {[2023, 2024, 2025, 2026].map(year => (
            <button key={year} onClick={() => setSelectedYear(year)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${selectedYear === year ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {year}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : data ? (
        <>
          {/* Stats overview */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white mb-6">
            <h2 className="text-2xl font-bold mb-6">Statistiques {selectedYear}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm opacity-80 mb-3 font-semibold uppercase tracking-wide">Équipe de recherche</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Corps A (Professeurs & MC)</span><span className="font-bold">{data.equipe.corps_a}</span></div>
                  <div className="flex justify-between"><span>Corps B (Maîtres Assistants)</span><span className="font-bold">{data.equipe.corps_b}</span></div>
                  <div className="flex justify-between"><span>Doctorants</span><span className="font-bold">{data.equipe.doctorants}</span></div>
                  <div className="flex justify-between"><span>Masters Recherche</span><span className="font-bold">{data.equipe.masters}</span></div>
                  <div className="flex justify-between border-t border-white/20 pt-2 mt-2"><span className="font-semibold">Total</span><span className="font-bold">{data.equipe.corps_a + data.equipe.corps_b + data.equipe.doctorants + data.equipe.masters}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm opacity-80 mb-3 font-semibold uppercase tracking-wide">Production scientifique</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Publications {selectedYear}</span><span className="font-bold">{data.production.publications_jcr}</span></div>
                  <div className="flex justify-between"><span>Total cumulé</span><span className="font-bold">{data.production.publications_total}</span></div>
                  <div className="flex justify-between"><span>Ouvrages</span><span className="font-bold">{data.production.ouvrages}</span></div>
                  <div className="flex justify-between"><span>Thèses soutenues</span><span className="font-bold">{data.production.theses}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm opacity-80 mb-3 font-semibold uppercase tracking-wide">Ouverture</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Séminaires & Ateliers</span><span className="font-bold">{data.ouverture.seminaires}</span></div>
                  <div className="flex justify-between"><span>Conventions</span><span className="font-bold">{data.ouverture.conventions}</span></div>
                  <div className="flex justify-between"><span>Projets Intl.</span><span className="font-bold">{data.ouverture.projets_internationaux}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sources breakdown */}
          {data.production.par_source?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Répartition par source de scraping</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.production.par_source.map((s: any) => (
                  <div key={s.source_scraping} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{s.total}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.source_scraping || "Manuel"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sections du rapport</h2>
            <div className="space-y-3">
              {[
                { n: "1", title: "Informations générales du laboratoire", sub: "Coordonnées et identification" },
                { n: "2", title: "Équipe de recherche", sub: `${data.equipe.corps_a + data.equipe.corps_b} permanents, ${data.equipe.doctorants} doctorants, ${data.equipe.masters} masters` },
                { n: "3", title: "Production scientifique", sub: `${data.production.publications_jcr} publications en ${selectedYear}, ${data.production.ouvrages} ouvrages, ${data.production.theses} thèses` },
                { n: "4", title: "Ouverture sur l'environnement", sub: `${data.ouverture.seminaires} séminaires, ${data.ouverture.conventions} conventions` },
              ].map(s => (
                <div key={s.n} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{s.n}. {s.title}</h3>
                    <p className="text-sm text-gray-500">{s.sub}</p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">✓ Complet</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setShowPreview(true)}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all">
              <Eye className="w-5 h-5" /> Prévisualiser
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
              <Printer className="w-5 h-5" /> Imprimer
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30">
              <Download className="w-5 h-5" /> Télécharger PDF
            </button>
          </div>
        </>
      ) : null}

      {/* Preview modal */}
      {showPreview && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Rapport d'évaluation {selectedYear}</h2>
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Fermer</button>
            </div>
            <div className="p-8 space-y-8 text-sm">
              {/* Header */}
              <div className="text-center border-b pb-6">
                <h1 className="text-xl font-bold mb-4">RAPPORT D'ÉVALUATION ANNUEL {selectedYear}</h1>
                <div className="space-y-1 text-gray-600">
                  <p><strong>Université:</strong> {LAB_INFO.universite}</p>
                  <p><strong>Établissement:</strong> {LAB_INFO.etablissement}</p>
                  <p><strong>Dénomination:</strong> {LAB_INFO.denomination}</p>
                  <p><strong>Code:</strong> {LAB_INFO.code}</p>
                  <p><strong>Chef LR/UR:</strong> {LAB_INFO.chef} — {LAB_INFO.grade}</p>
                  <p><strong>Email:</strong> {LAB_INFO.email} | <strong>Site:</strong> {LAB_INFO.siteWeb}</p>
                </div>
              </div>

              {/* I. Équipe */}
              <div>
                <h2 className="text-lg font-bold mb-3">I. ÉQUIPE DE RECHERCHE</h2>
                <p className="mb-2">I.1 Enseignants-chercheurs permanents — Total: <strong>{data.equipe.corps_a + data.equipe.corps_b}</strong></p>
                {data.listes.chercheurs_a?.length > 0 && (
                  <table className="w-full border border-gray-300 text-xs mb-4">
                    <thead className="bg-gray-50">
                      <tr>{["Grade","Nom & Prénom","CIN","Établissement","Université"].map(h => <th key={h} className="px-3 py-2 text-left border-r border-gray-300">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {data.listes.chercheurs_a.map((r: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                          <td className="px-3 py-1.5 border-r border-gray-200">{r.grade}</td>
                          <td className="px-3 py-1.5 border-r border-gray-200">{r.nom_prenom}</td>
                          <td className="px-3 py-1.5 border-r border-gray-200">{r.n_cin}</td>
                          <td className="px-3 py-1.5 border-r border-gray-200">{r.etablissement}</td>
                          <td className="px-3 py-1.5">{r.universite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="mb-2">I.2 Doctorants — Total: <strong>{data.equipe.doctorants}</strong></p>
              </div>

              {/* II. Production */}
              <div>
                <h2 className="text-lg font-bold mb-3">II. PRODUCTION SCIENTIFIQUE</h2>
                <p className="mb-2">II.1 Publications parues en {selectedYear} — Total: <strong>{data.production.publications_jcr}</strong></p>
                {data.listes.publications?.length > 0 && (
                  <table className="w-full border border-gray-300 text-xs mb-4">
                    <thead className="bg-gray-50">
                      <tr>{["Titre","Auteurs","Journal","Année","Source"].map(h => <th key={h} className="px-3 py-2 text-left border-r border-gray-300">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {data.listes.publications.map((p: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                          <td className="px-3 py-1.5 border-r border-gray-200 max-w-xs">{p.titre}</td>
                          <td className="px-3 py-1.5 border-r border-gray-200">{p.auteurs}</td>
                          <td className="px-3 py-1.5 border-r border-gray-200">{p.journal_ou_editeur}</td>
                          <td className="px-3 py-1.5 border-r border-gray-200">{p.annee}</td>
                          <td className="px-3 py-1.5">{p.source_scraping}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="mb-2">II.2 Ouvrages — Total: <strong>{data.production.ouvrages}</strong></p>
                <p className="mb-2">II.7 Thèses soutenues — Total: <strong>{data.production.theses}</strong></p>
              </div>

              {/* III. Ouverture */}
              <div>
                <h2 className="text-lg font-bold mb-3">III. OUVERTURE SUR L'ENVIRONNEMENT</h2>
                <p className="mb-2">III.1 Séminaires & Ateliers — Total: <strong>{data.ouverture.seminaires}</strong></p>
                {data.listes.evenements?.length > 0 && (
                  <ul className="list-disc pl-5 mb-4 space-y-1">
                    {data.listes.evenements.map((e: any, i: number) => (
                      <li key={i}>{e.titre} — {e.lieu} ({e.date})</li>
                    ))}
                  </ul>
                )}
                <p className="mb-2">III.2 Conventions — Total: <strong>{data.ouverture.conventions}</strong></p>
                {data.listes.conventions?.length > 0 && (
                  <ul className="list-disc pl-5 mb-4 space-y-1">
                    {data.listes.conventions.map((c: any, i: number) => (
                      <li key={i}>{c.titre} — {c.partenaire} ({c.type}, {c.annee})</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
