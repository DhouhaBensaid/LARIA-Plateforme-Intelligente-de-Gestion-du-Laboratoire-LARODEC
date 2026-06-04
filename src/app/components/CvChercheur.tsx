import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { articlesApi } from "../../lib/api";
import {
  FileText, Edit3, Check, Plus, Trash2, Download,
  GraduationCap, Briefcase, Award, Globe, Mail, Phone,
  BookOpen, X, Save, User, MapPin,
} from "lucide-react";

const API_BASE = "http://localhost:3001";
const token = () => localStorage.getItem("larodec_token") ?? "";

const getPrefix = (grade: string) => {
  const m: Record<string, string> = {
    "Professeur": "Prof.", "Maitre de Conferences": "MC.",
    "Maitre Assistant": "MA.", "Assistant": "A.", "Doctorant": "Dr.",
  };
  return m[grade] || "Dr.";
};

interface CVData {
  nom: string; prenom: string; grade: string; poste_actuel: string;
  institution: string; labo: string;
  email: string; telephone: string;
  domaines_recherche: string;
  orcid: string; google_scholar_url: string; scopus_id: string; linkedin: string;
  diplomes: { annee: string; intitule: string; institution: string; pays: string }[];
  enseignement: { institution: string; cours: string }[];
  experiences: { annee: string; poste: string; etablissement: string }[];
  contributions: { annee: string; type: string; details: string }[];
  autres_activites: { annee: string; type: string; details: string }[];
  distinctions: { annee: string; distinction: string }[];
}

const defaultCV = (): CVData => ({
  nom: "", prenom: "", grade: "", poste_actuel: "",
  institution: "Institut Supérieur de Gestion de Tunis (ISG Tunis) – Université de Tunis",
  labo: "LAboratoire de Recherche Opérationnelle, de DEcision et de Contrôle de processus (LARODEC)",
  email: "", telephone: "",
  domaines_recherche: "",
  orcid: "", google_scholar_url: "", scopus_id: "", linkedin: "",
  diplomes: [], enseignement: [], experiences: [],
  contributions: [], autres_activites: [], distinctions: [],
});

// ── CVSection helper ──────────────────────────────────────────────────────────
function CVSection({ title, onEdit, isEditing, children }: {
  title: string; onEdit?: () => void; isEditing?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="mb-0">
      <div className="flex items-center justify-between bg-slate-700 text-white px-4 py-2 rounded-t">
        <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="p-1 hover:bg-white/20 rounded transition-all print:hidden">
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <div className="border border-slate-200 border-t-0 rounded-b p-4">{children}</div>
    </div>
  );
}

// ── Table helper ──────────────────────────────────────────────────────────────
function CVTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-100">
          {headers.map(h => <th key={h} className="border border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-700 text-xs">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function TRow({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr className="hover:bg-slate-50">
      {cells.map((c, i) => <td key={i} className="border border-slate-200 px-3 py-1.5 text-slate-700 align-top">{c}</td>)}
    </tr>
  );
}

// ── Editable table row ────────────────────────────────────────────────────────
function EditRow({ placeholders, values, onChange, onRemove }: {
  placeholders: string[]; values: string[]; onChange: (vals: string[]) => void; onRemove: () => void;
}) {
  return (
    <tr>
      {placeholders.map((ph, i) => (
        <td key={i} className="border border-slate-200 px-1 py-1">
          <input value={values[i] || ""} onChange={e => { const v = [...values]; v[i] = e.target.value; onChange(v); }}
            placeholder={ph} className="w-full px-2 py-1 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-400" />
        </td>
      ))}
      <td className="border border-slate-200 px-1 py-1 w-8">
        <button onClick={onRemove} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CvChercheur() {
  const { session } = useAuth();
  const [cv, setCv] = useState<CVData>(defaultCV());
  const [pubs, setPubs] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fullName = session?.user.nom && session?.user.prenom
    ? `${session.user.nom} ${session.user.prenom}`.toUpperCase() : "";

  useEffect(() => {
    if (!session?.user) return;
    setCv(prev => ({
      ...prev,
      nom: session.user.nom || "",
      prenom: session.user.prenom || "",
      grade: session.user.grade || "",
      email: session.user.email || "",
      telephone: session.user.telephone || "",
      institution: session.user.etablissement || prev.institution,
      orcid: session.user.orcid || "",
      google_scholar_url: session.user.google_scholar_url || "",
    }));
    const saved = localStorage.getItem(`cv_${session.user.id}`);
    if (saved) { try { setCv(JSON.parse(saved)); } catch {} }
    if (fullName) {
      articlesApi.getAll({ chercheur: fullName, limit: 200 })
        .then(d => setPubs((d.items || []).filter((p: any) => p.validee_chercheur || p.statut === "valide")))
        .catch(() => {});
    }
  }, [session]);

  const saveCV = () => {
    if (session?.user?.id) localStorage.setItem(`cv_${session.user.id}`, JSON.stringify(cv));
    setSaved(true); setEditing(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (sec: string) => setEditing(e => e === sec ? null : sec);

  // Generic list helpers
  const addItem  = (f: keyof CVData, item: any) => setCv(p => ({ ...p, [f]: [...(p[f] as any[]), item] }));
  const removeItem = (f: keyof CVData, i: number) => setCv(p => ({ ...p, [f]: (p[f] as any[]).filter((_: any, j: number) => j !== i) }));
  const updateItem = (f: keyof CVData, i: number, val: any) => setCv(p => { const a = [...(p[f] as any[])]; a[i] = val; return { ...p, [f]: a }; });

  const prefix = cv.grade ? getPrefix(cv.grade) : "Dr.";

  // Group confirmed pubs by type for CV display
  const pubsByType = {
    journal: pubs.filter(p => /journal|article|revue/i.test(p.type_publication || "")),
    conf: pubs.filter(p => /conf|workshop|proceedings/i.test(p.type_publication || "")),
    book: pubs.filter(p => /book|chapter|ouvrage/i.test(p.type_publication || "")),
    other: pubs.filter(p => !/journal|article|revue|conf|workshop|proceedings|book|chapter|ouvrage/i.test(p.type_publication || "")),
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-800">Mon CV — Template LARODEC</span>
          {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" />Sauvegardé</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={saveCV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all">
            <Save className="w-4 h-4" />Sauvegarder
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">
            <Download className="w-4 h-4" />Imprimer / PDF
          </button>
        </div>
      </div>

      {/* CV Document */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg border border-slate-200 p-8 space-y-5 print:shadow-none print:border-none">

          {/* ── Title ── */}
          <div className="text-center border-b-2 border-slate-700 pb-4 mb-2">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">CURRICULUM VITAE</h1>
          </div>

          {/* ── Identity table ── */}
          <CVSection title="Identité" onEdit={() => toggle("identity")} isEditing={editing === "identity"}>
            {editing === "identity" ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Prénom", "prenom"], ["Nom", "nom"], ["Grade", "grade"],
                  ["Poste actuel", "poste_actuel"], ["Institution", "institution"],
                  ["Laboratoire", "labo"], ["Email", "email"], ["Téléphone", "telephone"],
                  ["Domaines de recherche", "domaines_recherche"],
                ].map(([label, field]) => (
                  <div key={field} className={field === "domaines_recherche" || field === "labo" || field === "institution" ? "col-span-2" : ""}>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                    <input value={(cv as any)[field]} onChange={e => setCv(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ["Nom et prénom", `${cv.nom} ${cv.prenom}`.trim() || "—"],
                    ["Poste actuel", cv.poste_actuel || cv.grade || "—"],
                    ["Institution", cv.institution || "—"],
                    ["Unité de recherche / Laboratoire", cv.labo || "—"],
                    ["Email", cv.email || "—"],
                    ["Téléphone", cv.telephone || "—"],
                    ["Domaines de recherche", cv.domaines_recherche || "—"],
                  ].map(([label, val]) => (
                    <tr key={label} className="border border-slate-200">
                      <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-700 w-56 border-r border-slate-200">{label}</td>
                      <td className="px-3 py-2 text-slate-700 whitespace-pre-line">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CVSection>

          {/* ── Academic profiles ── */}
          <CVSection title="Profils académiques" onEdit={() => toggle("profiles")} isEditing={editing === "profiles"}>
            {editing === "profiles" ? (
              <div className="grid grid-cols-2 gap-3">
                {[["ORCID","orcid"],["Google Scholar URL","google_scholar_url"],["Scopus Author ID","scopus_id"],["LinkedIn","linkedin"]].map(([label,field]) => (
                  <div key={field}>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                    <input value={(cv as any)[field]} onChange={e => setCv(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ["ORCID", cv.orcid ? <a href={`https://orcid.org/${cv.orcid}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{cv.orcid}</a> : "—"],
                    ["Google Scholar", cv.google_scholar_url ? <a href={cv.google_scholar_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{cv.google_scholar_url}</a> : "—"],
                    ["Scopus Author ID", cv.scopus_id || "—"],
                    ["LinkedIn", cv.linkedin ? <a href={cv.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{cv.linkedin}</a> : "—"],
                  ].map(([label, val]) => (
                    <tr key={String(label)} className="border border-slate-200">
                      <td className="bg-slate-50 px-3 py-2 font-semibold text-slate-700 w-56 border-r border-slate-200">{label}</td>
                      <td className="px-3 py-2 text-slate-700">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CVSection>

          {/* ── Diplômes ── */}
          <CVSection title="Diplômes" onEdit={() => toggle("diplomes")} isEditing={editing === "diplomes"}>
            <CVTable headers={["Année", "Intitulé du diplôme", "Institution", "Pays"]}>
              {cv.diplomes.map((d, i) =>
                editing === "diplomes"
                  ? <EditRow key={i} placeholders={["Année","Intitulé","Institution","Pays"]} values={[d.annee,d.intitule,d.institution,d.pays]}
                      onChange={v => updateItem("diplomes", i, { annee:v[0], intitule:v[1], institution:v[2], pays:v[3] })}
                      onRemove={() => removeItem("diplomes", i)} />
                  : <TRow key={i} cells={[d.annee, d.intitule, d.institution, d.pays]} />
              )}
              {editing === "diplomes" && (
                <tr><td colSpan={5} className="pt-2 pb-1 px-1">
                  <button onClick={() => addItem("diplomes", { annee:"", intitule:"", institution:"", pays:"" })}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-3.5 h-3.5" />Ajouter
                  </button>
                </td></tr>
              )}
            </CVTable>
            {cv.diplomes.length === 0 && editing !== "diplomes" && <p className="text-slate-400 text-sm italic">Aucun diplôme ajouté</p>}
          </CVSection>

          {/* ── Enseignement ── */}
          <CVSection title="Expérience d'enseignement" onEdit={() => toggle("enseignement")} isEditing={editing === "enseignement"}>
            <CVTable headers={["Institution", "Cours"]}>
              {cv.enseignement.map((e, i) =>
                editing === "enseignement"
                  ? <EditRow key={i} placeholders={["Institution","Cours"]} values={[e.institution, e.cours]}
                      onChange={v => updateItem("enseignement", i, { institution:v[0], cours:v[1] })}
                      onRemove={() => removeItem("enseignement", i)} />
                  : <TRow key={i} cells={[e.institution, e.cours]} />
              )}
              {editing === "enseignement" && (
                <tr><td colSpan={3} className="pt-2 pb-1 px-1">
                  <button onClick={() => addItem("enseignement", { institution:"", cours:"" })}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-3.5 h-3.5" />Ajouter
                  </button>
                </td></tr>
              )}
            </CVTable>
            {cv.enseignement.length === 0 && editing !== "enseignement" && <p className="text-slate-400 text-sm italic">Aucun cours ajouté</p>}
          </CVSection>

          {/* ── Expérience professionnelle ── */}
          <CVSection title="Expérience professionnelle" onEdit={() => toggle("experiences")} isEditing={editing === "experiences"}>
            <CVTable headers={["Année / Période", "Poste", "Établissement"]}>
              {cv.experiences.map((e, i) =>
                editing === "experiences"
                  ? <EditRow key={i} placeholders={["Période","Poste","Établissement"]} values={[e.annee, e.poste, e.etablissement]}
                      onChange={v => updateItem("experiences", i, { annee:v[0], poste:v[1], etablissement:v[2] })}
                      onRemove={() => removeItem("experiences", i)} />
                  : <TRow key={i} cells={[e.annee, e.poste, e.etablissement]} />
              )}
              {editing === "experiences" && (
                <tr><td colSpan={4} className="pt-2 pb-1 px-1">
                  <button onClick={() => addItem("experiences", { annee:"", poste:"", etablissement:"" })}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-3.5 h-3.5" />Ajouter
                  </button>
                </td></tr>
              )}
            </CVTable>
            {cv.experiences.length === 0 && editing !== "experiences" && <p className="text-slate-400 text-sm italic">Aucune expérience ajoutée</p>}
          </CVSection>

          {/* ── Contributions intellectuelles ── */}
          <CVSection title="Contributions intellectuelles" onEdit={() => toggle("contributions")} isEditing={editing === "contributions"}>
            <p className="text-xs text-slate-500 italic mb-3">
              Types : Articles revues, Actes de conférences, Chapitres de livres, Rapports techniques, Autres
            </p>
            {/* Auto-injected confirmed publications */}
            {pubs.length > 0 ? (
              <div className="space-y-1 mb-4">
                {/* Journals */}
                {pubsByType.journal.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-3 mb-1">Articles de revues ({pubsByType.journal.length})</p>
                    <CVTable headers={["Année","Type","Détails"]}>
                      {pubsByType.journal.map((p, i) => (
                        <TRow key={i} cells={[
                          p.annee || "—",
                          "Article revue",
                          <span key="d">{p.citation_apa || `${p.auteurs || ""} (${p.annee || ""}). ${p.titre}.${p.journal_ou_editeur ? ` ${p.journal_ou_editeur}.` : ""}${p.doi ? ` https://doi.org/${p.doi}` : ""}`}</span>,
                        ]} />
                      ))}
                    </CVTable>
                  </>
                )}
                {/* Conferences */}
                {pubsByType.conf.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-3 mb-1">Actes de conférences ({pubsByType.conf.length})</p>
                    <CVTable headers={["Année","Type","Détails"]}>
                      {pubsByType.conf.map((p, i) => (
                        <TRow key={i} cells={[p.annee || "—", "Conférence", p.citation_apa || `${p.auteurs || ""} (${p.annee || ""}). ${p.titre}.${p.journal_ou_editeur ? ` ${p.journal_ou_editeur}.` : ""}`]} />
                      ))}
                    </CVTable>
                  </>
                )}
                {/* Books */}
                {pubsByType.book.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-3 mb-1">Ouvrages & chapitres ({pubsByType.book.length})</p>
                    <CVTable headers={["Année","Type","Détails"]}>
                      {pubsByType.book.map((p, i) => (
                        <TRow key={i} cells={[p.annee || "—", p.type_publication || "Ouvrage", p.citation_apa || `${p.titre}`]} />
                      ))}
                    </CVTable>
                  </>
                )}
                {/* Other */}
                {pubsByType.other.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-3 mb-1">Autres ({pubsByType.other.length})</p>
                    <CVTable headers={["Année","Type","Détails"]}>
                      {pubsByType.other.map((p, i) => (
                        <TRow key={i} cells={[p.annee || "—", p.type_publication || "Autre", p.titre]} />
                      ))}
                    </CVTable>
                  </>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic mb-3">
                Aucune publication confirmée — confirmez vos publications dans "Mes Contributions" pour les afficher ici.
              </p>
            )}
            {/* Manual contributions */}
            {cv.contributions.length > 0 && (
              <CVTable headers={["Année","Type","Détails"]}>
                {cv.contributions.map((c, i) =>
                  editing === "contributions"
                    ? <EditRow key={i} placeholders={["Année","Type","Détails"]} values={[c.annee, c.type, c.details]}
                        onChange={v => updateItem("contributions", i, { annee:v[0], type:v[1], details:v[2] })}
                        onRemove={() => removeItem("contributions", i)} />
                    : <TRow key={i} cells={[c.annee, c.type, c.details]} />
                )}
              </CVTable>
            )}
            {editing === "contributions" && (
              <button onClick={() => addItem("contributions", { annee:"", type:"", details:"" })}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-2">
                <Plus className="w-3.5 h-3.5" />Ajouter manuellement
              </button>
            )}
          </CVSection>

          {/* ── Autres activités ── */}
          <CVSection title="Autres activités académiques et professionnelles" onEdit={() => toggle("autres")} isEditing={editing === "autres"}>
            <CVTable headers={["Année","Type","Détails"]}>
              {cv.autres_activites.map((a, i) =>
                editing === "autres"
                  ? <EditRow key={i} placeholders={["Année","Type","Détails"]} values={[a.annee, a.type, a.details]}
                      onChange={v => updateItem("autres_activites", i, { annee:v[0], type:v[1], details:v[2] })}
                      onRemove={() => removeItem("autres_activites", i)} />
                  : <TRow key={i} cells={[a.annee, a.type, a.details]} />
              )}
              {editing === "autres" && (
                <tr><td colSpan={4} className="pt-2 pb-1 px-1">
                  <button onClick={() => addItem("autres_activites", { annee:"", type:"", details:"" })}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-3.5 h-3.5" />Ajouter
                  </button>
                </td></tr>
              )}
            </CVTable>
            {cv.autres_activites.length === 0 && editing !== "autres" && <p className="text-slate-400 text-sm italic">Aucune activité ajoutée</p>}
          </CVSection>

          {/* ── Distinctions ── */}
          <CVSection title="Distinctions et Prix" onEdit={() => toggle("distinctions")} isEditing={editing === "distinctions"}>
            <CVTable headers={["Année","Distinction / Prix"]}>
              {cv.distinctions.map((d, i) =>
                editing === "distinctions"
                  ? <EditRow key={i} placeholders={["Année","Distinction"]} values={[d.annee, d.distinction]}
                      onChange={v => updateItem("distinctions", i, { annee:v[0], distinction:v[1] })}
                      onRemove={() => removeItem("distinctions", i)} />
                  : <TRow key={i} cells={[d.annee, d.distinction]} />
              )}
              {editing === "distinctions" && (
                <tr><td colSpan={3} className="pt-2 pb-1 px-1">
                  <button onClick={() => addItem("distinctions", { annee:"", distinction:"" })}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-3.5 h-3.5" />Ajouter
                  </button>
                </td></tr>
              )}
            </CVTable>
            {cv.distinctions.length === 0 && editing !== "distinctions" && <p className="text-slate-400 text-sm italic">Aucune distinction ajoutée</p>}
          </CVSection>

        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .shadow-lg { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

// Suppress unused import warnings
const _icons = [User, Globe, Mail, Phone, MapPin, BookOpen, Briefcase, GraduationCap, Award];
void _icons;
