import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, RefreshCw, FileText, Users, BookOpen, Calendar,
  Award, TrendingUp, ChevronDown, ChevronUp,
} from "lucide-react";
import { rapportApi } from "../../lib/api";
import logoLarodec from "../../imports/image-1.png";

const LAB = {
  universite:    "UNIVERSITE DE TUNIS",
  etablissement: "INSTITUT SUPERIEUR DE GESTION DE TUNIS",
  denomination:  "Recherche Opérationnelle, Aide à la Décision et Processus de Contrôle",
  code:          "LR01ES02",
  chef:          "BEN ARFA RABAI Latifa",
  grade:         "Professeur d'Enseignement Supérieur",
  tel:           "0021698385982",
  fax:           "21671588350",
  email:         "latifa.rabai@gmail.com",
  siteWeb:       "http://www.larodec.com/",
};

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #rapport-pdf, #rapport-pdf * { visibility: visible !important; }
  #rapport-pdf { position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; background: white; }
  .no-print { display: none !important; }
  table { border-collapse: collapse !important; width: 100% !important; }
  th, td { border: 1px solid #aaa !important; padding: 4px 6px !important; font-size: 9pt !important; }
  th { background: #dde4f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h2.section-title { background: #1a3a6b !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 1.5cm; size: A4; }
}
`;

// ─── Editable field types ─────────────────────────────────────────────────────
interface EditableFields {
  reliquat_budget:        string;
  brevets:                number;
  obtentions_vegetales:   number;
  habilitations:          number;
  masteres_soutenus:      number;
  articles_chapitres:     number;
  projets_internationaux: number;
  note_directeur:         string;
  perspectives:           string;
}

const DEFAULT_EDITABLE: EditableFields = {
  reliquat_budget:        "0",
  brevets:                0,
  obtentions_vegetales:   0,
  habilitations:          0,
  masteres_soutenus:      0,
  articles_chapitres:     0,
  projets_internationaux: 0,
  note_directeur:         "",
  perspectives:           "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ background: "#dde4f0", border: "1px solid #aaa", padding: "5px 8px", textAlign: "left", fontSize: "11px", fontWeight: 700 }}>{children}</th>;
}
function Td({ children, center }: { children?: React.ReactNode; center?: boolean }) {
  return <td style={{ border: "1px solid #ccc", padding: "4px 8px", fontSize: "11px", textAlign: center ? "center" : "left", verticalAlign: "top" }}>{children ?? "—"}</td>;
}

// ─── Editable number inline ───────────────────────────────────────────────────
function EditableNumber({ fieldKey, value, onUpdate }: {
  fieldKey: string; value: number; onUpdate: (k: string, v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal]     = useState(String(value));

  useEffect(() => { setLocal(String(value)); }, [value]);

  const commit = () => { onUpdate(fieldKey, Number(local)); setEditing(false); };

  return editing ? (
    <input type="number" value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      autoFocus
      className="w-20 text-center font-bold border-2 border-blue-400 rounded-lg px-2 py-1 text-sm outline-none" />
  ) : (
    <motion.span whileHover={{ scale: 1.05 }} onClick={() => setEditing(true)}
      className="font-bold text-blue-700 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded-lg border border-dashed border-blue-200 transition-all inline-flex items-center gap-1"
      title="Cliquer pour modifier">
      {value}<span className="text-xs text-blue-400">✏️</span>
    </motion.span>
  );
}

// ─── Editable text ────────────────────────────────────────────────────────────
function EditableText({ fieldKey, value, onUpdate, placeholder }: {
  fieldKey: string; value: string; onUpdate: (k: string, v: string) => void; placeholder: string;
}) {
  return (
    <textarea value={value} onChange={e => onUpdate(fieldKey, e.target.value)}
      placeholder={placeholder} rows={3}
      className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-gray-50 focus:bg-white transition-all" />
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, count, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; count?: number;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-bold text-slate-900">{title}</span>
          {count !== undefined && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{count}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden">
            <div className="px-6 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PDF Document (hidden, used for print) ────────────────────────────────────
function PdfDocument({ data, year, editableFields }: { data: any; year: number; editableFields: EditableFields }) {
  const eq    = data.equipe || {};
  const prod  = data.production || {};
  const ouv   = data.ouverture || {};
  const listes = data.listes || {};

  const resumeRows = [
    { section: "I- Ressources Humaines et espace de recherche", isHeader: true },
    { label: "I-1 Enseignants-chercheurs du corps A",                                    value: eq.corps_a || 0 },
    { label: "I-2 Enseignants-chercheurs du corps B",                                    value: eq.corps_b || 0 },
    { label: "I-3 Doctorants",                                                           value: eq.doctorants || 0 },
    { label: "I-4 Etudiants",                                                            value: eq.masters || 0 },
    { label: "I-5 Cadres ayant un grade équivalent au grade d'assistant",                value: eq.post_doc || 0 },
    { section: "II- Production scientifique", isHeader: true },
    { label: `II-1 Publications impactées parues en ${year} (JCR)`,                     value: prod.publications_jcr || 0 },
    { label: `II-2 Ouvrages scientifiques édités en ${year}`,                           value: prod.ouvrages || 0 },
    { label: `II-3 Articles et chapitres d'ouvrage édités en ${year}`,                  value: editableFields.articles_chapitres },
    { label: `II-4 Brevets d'invention déposés en ${year}`,                             value: editableFields.brevets },
    { label: `II-5 Obtentions végétales enregistrées en ${year}`,                       value: editableFields.obtentions_vegetales },
    { label: `II-6 Habilitations universitaires soutenues en ${year}`,                  value: editableFields.habilitations },
    { label: `II-7 Thèses de doctorat soutenues en ${year}`,                            value: prod.theses || 0 },
    { label: `II-8 Mastères soutenues en ${year}`,                                      value: editableFields.masteres_soutenus },
    { section: "III- Ouverture sur l'environnement", isHeader: true },
    { label: `III-1 Séminaires, journées et ateliers organisés en ${year}`,             value: ouv.seminaires || 0 },
    { label: `III-2 Conventions signées en ${year}`,                                    value: ouv.conventions || 0 },
    { label: `III-3 Conventions et projets de coopération internationale en ${year}`,   value: editableFields.projets_internationaux },
    { section: "IV- Reliquat du budget", isHeader: true },
    { label: "IV- Reliquat du budget (montant en dinars)",                               value: editableFields.reliquat_budget },
  ];

  const s = { fontFamily: "Arial, sans-serif", color: "#222", fontSize: "12px", lineHeight: "1.6" };
  const tableStyle = { width: "100%", borderCollapse: "collapse" as const, marginBottom: "16px" };

  return (
    <div id="rapport-pdf" style={{ ...s, padding: "20px", background: "white", display: "none" }}>
      {/* Cover */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #1a3a6b", paddingBottom: "24px", marginBottom: "24px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px" }}>REPUBLIQUE TUNISIENNE</div>
        <div style={{ fontSize: "13px", margin: "4px 0" }}>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</div>
        <div style={{ fontSize: "13px", marginBottom: "20px" }}>Direction Générale de la Recherche Scientifique</div>
        <div style={{ border: "2px solid #1a3a6b", display: "inline-block", padding: "14px 40px", margin: "10px auto" }}>
          <div style={{ fontSize: "20px", fontWeight: 900, color: "#1a3a6b", letterSpacing: "1px" }}>RAPPORT D'ACTIVITES {year}</div>
        </div>
        <div style={{ textAlign: "left", marginTop: "24px", lineHeight: "2.2" }}>
          <div><strong>Université:</strong> {LAB.universite}</div>
          <div><strong>Etablissement:</strong> {LAB.etablissement}</div>
          <div><strong>Dénomination LR/UR:</strong> {LAB.denomination}</div>
          <div><strong>Code structure:</strong> {LAB.code}</div>
          <div><strong>Chef LR/UR:</strong> {LAB.chef} — {LAB.grade}</div>
          <div><strong>Tél:</strong> {LAB.tel} &nbsp; <strong>Fax:</strong> {LAB.fax}</div>
          <div><strong>E-mail:</strong> {LAB.email} &nbsp; <strong>Site:</strong> {LAB.siteWeb}</div>
        </div>
      </div>

      {/* Résumé */}
      <h2 className="section-title" style={{ background: "#1a3a6b", color: "white", padding: "7px 12px", fontSize: "13px", fontWeight: 700, margin: "20px 0 10px" }}>RESUME DU RAPPORT {year}</h2>
      <table style={tableStyle}>
        <thead><tr><Th>Rubrique</Th><Th>Nombre</Th></tr></thead>
        <tbody>
          {resumeRows.map((row, i) => (row as any).isHeader ? (
            <tr key={i}><td colSpan={2} style={{ background: "#e8eef8", fontWeight: 700, padding: "6px 10px", fontSize: "12px", border: "1px solid #ccc" }}>{(row as any).section}</td></tr>
          ) : (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
              <Td>{(row as any).label}</Td><Td center>{(row as any).value}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* I. Équipe */}
      <h2 className="section-title" style={{ background: "#1a3a6b", color: "white", padding: "7px 12px", fontSize: "13px", fontWeight: 700, margin: "20px 0 10px" }}>I- Composition de l'équipe de recherche ({year})</h2>
      {[
        { label: "Corps A", list: listes.chercheurs_a, cols: ["grade","nom_prenom","n_cin","etablissement","universite"] },
        { label: "Corps B", list: listes.chercheurs_b, cols: ["grade","nom_prenom","n_cin","etablissement","universite"] },
        { label: "Doctorants", list: listes.doctorants, cols: ["nom_prenom","n_cin","etablissement","universite"] },
        { label: "Post-Doctorants", list: listes.post_doc, cols: ["grade","nom_prenom","n_cin","etablissement","universite"] },
        { label: "Etudiants en mastère de recherche", list: listes.masters, cols: ["nom_prenom","n_cin","etablissement","universite"] },
      ].map(({ label, list, cols }) => (
        <div key={label}>
          <p style={{ fontWeight: 700, marginBottom: "6px" }}>{label}</p>
          <table style={tableStyle}>
            <thead><tr>{cols.map(c => <Th key={c}>{c.replace("_"," ")}</Th>)}</tr></thead>
            <tbody>{(list || []).map((r: any, i: number) => (
              <tr key={i} style={{ background: i%2===0?"#fff":"#f5f7fb" }}>
                {cols.map(c => <Td key={c}>{r[c]}</Td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      ))}

      {/* II. Production */}
      <h2 className="section-title" style={{ background: "#1a3a6b", color: "white", padding: "7px 12px", fontSize: "13px", fontWeight: 700, margin: "20px 0 10px" }}>II- Production scientifique {year}</h2>
      <table style={tableStyle}>
        <thead><tr><Th>Titre</Th><Th>Journal</Th><Th>Année</Th><Th>Indexation</Th><Th>Auteurs</Th></tr></thead>
        <tbody>{(listes.publications || []).map((p: any, i: number) => (
          <tr key={i} style={{ background: i%2===0?"#fff":"#f5f7fb" }}>
            <Td>{p.titre}</Td><Td>{p.journal_ou_editeur}</Td><Td center>{p.annee}</Td>
            <Td center>{p.indexation || p.source_scraping}</Td><Td>{p.auteurs}</Td>
          </tr>
        ))}</tbody>
      </table>

      {/* Note directeur */}
      {editableFields.note_directeur && (
        <>
          <h2 className="section-title" style={{ background: "#1a3a6b", color: "white", padding: "7px 12px", fontSize: "13px", fontWeight: 700, margin: "20px 0 10px" }}>Note du Directeur</h2>
          <p style={{ fontSize: "12px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{editableFields.note_directeur}</p>
        </>
      )}
      {editableFields.perspectives && (
        <>
          <h2 className="section-title" style={{ background: "#1a3a6b", color: "white", padding: "7px 12px", fontSize: "13px", fontWeight: 700, margin: "20px 0 10px" }}>Perspectives {year + 1}</h2>
          <p style={{ fontSize: "12px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{editableFields.perspectives}</p>
        </>
      )}

      <p style={{ textAlign: "center", fontSize: "10px", color: "#888", marginTop: "30px", borderTop: "1px solid #ddd", paddingTop: "10px" }}>
        Rapport d'activités {year} — LARODEC — {LAB.etablissement}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function RapportAnnuel() {
  const [year, setYear]       = useState(2025);
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editableFields, setEditableFields] = useState<EditableFields>(DEFAULT_EDITABLE);

  // Load editable fields from localStorage when year changes
  useEffect(() => {
    const saved = localStorage.getItem(`rapport_editable_${year}`);
    if (saved) {
      try { setEditableFields(JSON.parse(saved)); }
      catch { setEditableFields(DEFAULT_EDITABLE); }
    } else {
      setEditableFields(DEFAULT_EDITABLE);
    }
  }, [year]);

  // Persist editable fields to localStorage
  useEffect(() => {
    localStorage.setItem(`rapport_editable_${year}`, JSON.stringify(editableFields));
  }, [editableFields, year]);

  const updateField = (key: string, value: any) => {
    setEditableFields(prev => ({ ...prev, [key]: value }));
    // Show toast
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowSaveToast(true);
    toastTimer.current = setTimeout(() => setShowSaveToast(false), 2500);
  };

  // Inject print CSS once
  useEffect(() => {
    const id = "rapport-print-css";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id; s.textContent = PRINT_CSS;
      document.head.appendChild(s);
    }
  }, []);

  const load = async (y: number) => {
    setLoading(true);
    try { const d = await rapportApi.get(y); setData(d); }
    catch (e) { console.error(e); setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(year); }, [year]);

  const handleDownload = () => {
    if (!data) return;
    setDownloading(true);
    const el = document.getElementById("rapport-pdf");
    if (el) {
      el.style.display = "block";
      setTimeout(() => { window.print(); el.style.display = "none"; setDownloading(false); }, 300);
    } else {
      window.print(); setDownloading(false);
    }
  };

  const handleReset = () => {
    if (confirm("Réinitialiser tous les champs manuels de ce rapport ?")) {
      localStorage.removeItem(`rapport_editable_${year}`);
      setEditableFields(DEFAULT_EDITABLE);
    }
  };

  const eq    = data?.equipe || {};
  const prod  = data?.production || {};
  const ouv   = data?.ouverture || {};
  const listes = data?.listes || {};

  const kpis = [
    { icon: Users,      label: "Corps A",      value: eq.corps_a || 0,           color: "blue"    },
    { icon: Users,      label: "Corps B",       value: eq.corps_b || 0,           color: "cyan"    },
    { icon: Award,      label: "Doctorants",    value: eq.doctorants || 0,        color: "purple"  },
    { icon: BookOpen,   label: "Publications",  value: prod.publications_jcr || 0, color: "emerald" },
    { icon: TrendingUp, label: "Thèses",        value: prod.theses || 0,          color: "amber"   },
    { icon: Calendar,   label: "Séminaires",    value: ouv.seminaires || 0,       color: "rose"    },
  ];

  // Resume rows for web display
  const resumeRows: Array<{
    section?: string; isHeader?: boolean;
    label?: string; value?: any; fromDB?: boolean;
    fieldKey?: keyof EditableFields; isText?: boolean;
  }> = [
    { section: "I- Ressources Humaines", isHeader: true },
    { label: "I-1 Enseignants-chercheurs du corps A",  value: eq.corps_a || 0,   fromDB: true },
    { label: "I-2 Enseignants-chercheurs du corps B",  value: eq.corps_b || 0,   fromDB: true },
    { label: "I-3 Doctorants",                         value: eq.doctorants || 0, fromDB: true },
    { label: "I-4 Etudiants Mastère",                  value: eq.masters || 0,    fromDB: true },
    { label: "I-5 Cadres Post-Doc",                    value: eq.post_doc || 0,   fromDB: true },
    { section: "II- Production scientifique", isHeader: true },
    { label: `II-1 Publications JCR parues en ${year}`,       value: prod.publications_jcr || 0, fromDB: true },
    { label: `II-2 Ouvrages scientifiques édités en ${year}`, value: prod.ouvrages || 0,         fromDB: true },
    { label: `II-3 Articles et chapitres en ${year}`,         value: editableFields.articles_chapitres, fieldKey: "articles_chapitres", fromDB: false },
    { label: `II-4 Brevets d'invention déposés en ${year}`,   value: editableFields.brevets,            fieldKey: "brevets",            fromDB: false },
    { label: `II-5 Obtentions végétales en ${year}`,          value: editableFields.obtentions_vegetales, fieldKey: "obtentions_vegetales", fromDB: false },
    { label: `II-6 Habilitations universitaires en ${year}`,  value: editableFields.habilitations,      fieldKey: "habilitations",      fromDB: false },
    { label: `II-7 Thèses de doctorat soutenues en ${year}`,  value: prod.theses || 0,           fromDB: true },
    { label: `II-8 Mastères soutenues en ${year}`,            value: editableFields.masteres_soutenus,  fieldKey: "masteres_soutenus",  fromDB: false },
    { section: "III- Ouverture sur l'environnement", isHeader: true },
    { label: `III-1 Séminaires organisés en ${year}`,         value: ouv.seminaires || 0,        fromDB: true },
    { label: `III-2 Conventions signées en ${year}`,          value: ouv.conventions || 0,       fromDB: true },
    { label: `III-3 Projets coopération internationale`,       value: editableFields.projets_internationaux, fieldKey: "projets_internationaux", fromDB: false },
    { section: "IV- Reliquat du budget", isHeader: true },
    { label: "IV- Reliquat du budget (montant en dinars)",     value: editableFields.reliquat_budget, fieldKey: "reliquat_budget", fromDB: false, isText: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Hidden PDF element */}
      {data && <PdfDocument data={data} year={year} editableFields={editableFields} />}

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl mb-6 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 p-8">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <img src={logoLarodec} alt="LARODEC" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">LARODEC — ISG Tunis</p>
              <h1 className="text-3xl font-black text-white mb-1">Rapport d'Activités</h1>
              <p className="text-blue-100/80 text-sm">Génération automatique depuis la base de données</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => load(year)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-semibold border border-white/20 transition-all">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium border border-white/20 transition-all">
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
            <motion.button onClick={handleDownload} disabled={!data || downloading}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
              {downloading
                ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-4 h-4" /></motion.div> Génération...</>
                : <><Download className="w-4 h-4" /> Télécharger PDF</>}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Year selector ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
        <p className="text-sm font-bold text-slate-600 mb-4">Sélectionner l'année du rapport</p>
        <div className="flex gap-3 flex-wrap">
          {[2023, 2024, 2025, 2026].map(y => (
            <motion.button key={y} onClick={() => setYear(y)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${y === year ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {y}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Live data banner ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 text-sm">
        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
        <span className="text-emerald-800 font-medium">Données récupérées en temps réel depuis la base de données LARODEC</span>
        <span className="ml-auto text-emerald-600 text-xs hidden sm:block">
          Champs <span className="font-bold">éditable</span> peuvent être modifiés avant impression
        </span>
      </motion.div>

      {/* ── Loading / Content ── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 h-28" />
            ))}
          </motion.div>
        ) : data ? (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {kpis.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }} whileHover={{ y: -4, scale: 1.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
                  <div className={`w-10 h-10 bg-${k.color}-50 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <k.icon className={`w-5 h-5 text-${k.color}-600`} />
                  </div>
                  <p className={`text-2xl font-black text-${k.color}-600`}>{k.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{k.label}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Résumé tableau éditable ── */}
            <Section title="Résumé du Rapport" icon={FileText}>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-500">Rubrique</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-500 w-40">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {resumeRows.map((row, i) => {
                      if (row.isHeader) {
                        return (
                          <tr key={i}>
                            <td colSpan={2} className="px-4 py-2 bg-slate-100 font-bold text-slate-700 text-xs uppercase tracking-wide">
                              {row.section}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                          <td className="px-4 py-2.5 text-slate-700 flex items-center gap-2">
                            {row.label}
                            {!row.fromDB && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded font-medium">éditable</span>
                            )}
                            {row.fromDB && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-medium">BDD auto</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.fromDB ? (
                              <span className="font-bold text-slate-900">{row.value}</span>
                            ) : row.isText ? (
                              <input type="text" value={String(row.value)}
                                onChange={e => updateField(row.fieldKey as string, e.target.value)}
                                className="text-center font-bold border border-dashed border-blue-300 rounded-lg px-2 py-1 text-sm w-36 focus:outline-none focus:border-blue-500 bg-blue-50/30" />
                            ) : (
                              <EditableNumber
                                fieldKey={row.fieldKey as string}
                                value={Number(row.value)}
                                onUpdate={updateField} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── Équipe ── */}
            <Section title="I. Équipe de recherche" icon={Users}
              count={(eq.corps_a||0)+(eq.corps_b||0)+(eq.doctorants||0)+(eq.masters||0)+(eq.post_doc||0)}>
              <div className="space-y-4">
                {[
                  { label: "Corps A — Professeurs & MC",  list: listes.chercheurs_a, cols: ["grade","nom_prenom","n_cin","etablissement","universite"] },
                  { label: "Corps B — Maîtres Assistants", list: listes.chercheurs_b, cols: ["grade","nom_prenom","n_cin","etablissement","universite"] },
                  { label: "Doctorants",                   list: listes.doctorants,   cols: ["nom_prenom","n_cin","etablissement","universite"] },
                  { label: "Post-Doctorants",              list: listes.post_doc,     cols: ["grade","nom_prenom","n_cin","etablissement","universite"] },
                  { label: "Etudiants Mastère",            list: listes.masters,      cols: ["nom_prenom","n_cin","etablissement","universite"] },
                ].map(({ label, list, cols }) => (
                  <div key={label}>
                    <p className="text-sm font-bold text-slate-700 mb-2">{label} <span className="text-blue-600">({(list||[]).length})</span></p>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>{cols.map(c => <th key={c} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide">{c.replace("_"," ")}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(list||[]).slice(0,5).map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                              {cols.map(c => <td key={c} className="px-3 py-2 text-slate-700">{r[c] || "—"}</td>)}
                            </tr>
                          ))}
                          {(list||[]).length > 5 && (
                            <tr><td colSpan={cols.length} className="px-3 py-2 text-xs text-slate-400 italic">... et {(list||[]).length - 5} autres (voir PDF complet)</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Production ── */}
            <Section title="II. Production scientifique" icon={BookOpen} count={prod.publications_jcr || 0}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Publications JCR", value: prod.publications_jcr || 0 },
                  { label: "Ouvrages",          value: prod.ouvrages || 0 },
                  { label: "Thèses",            value: prod.theses || 0 },
                  { label: "Chapitres",         value: prod.articles_chapitres || 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-blue-700">{value}</p>
                    <p className="text-xs text-blue-500 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-700 mb-2">Publications {year} <span className="text-blue-600">({(listes.publications||[]).length})</span></p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Titre</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Journal</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Année</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-500">Source</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {(listes.publications||[]).slice(0,8).map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-3 py-2 text-slate-700 max-w-xs truncate">{p.titre}</td>
                        <td className="px-3 py-2 text-slate-500 italic truncate max-w-[160px]">{p.journal_ou_editeur}</td>
                        <td className="px-3 py-2 text-slate-500 text-center">{p.annee}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold">{p.source_scraping || p.indexation}</span>
                        </td>
                      </tr>
                    ))}
                    {(listes.publications||[]).length > 8 && (
                      <tr><td colSpan={4} className="px-3 py-2 text-xs text-slate-400 italic">... et {(listes.publications||[]).length - 8} autres (voir PDF complet)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── Ouverture ── */}
            <Section title="III. Ouverture sur l'environnement" icon={Calendar} count={(ouv.seminaires||0)+(ouv.conventions||0)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Séminaires & Ateliers ({ouv.seminaires || 0})</p>
                  {(listes.evenements||[]).length > 0 ? (
                    <div className="space-y-2">
                      {(listes.evenements||[]).map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{e.titre}</p>
                            <p className="text-xs text-slate-500">{e.lieu} · {e.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">Aucun séminaire enregistré</p>}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Conventions ({ouv.conventions || 0})</p>
                  {(listes.conventions||[]).length > 0 ? (
                    <div className="space-y-2">
                      {(listes.conventions||[]).map((c: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.titre}</p>
                            <p className="text-xs text-slate-500">{c.partenaire}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">Aucune convention enregistrée</p>}
                </div>
              </div>
            </Section>

            {/* ── Note du Directeur ── */}
            <Section title="Note du Directeur de Laboratoire" icon={FileText} defaultOpen={false}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Message / Bilan de l'année {year}</p>
                  <EditableText fieldKey="note_directeur" value={editableFields.note_directeur}
                    onUpdate={updateField} placeholder="Rédigez ici le bilan et les réalisations de l'année..." />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Perspectives {year + 1}</p>
                  <EditableText fieldKey="perspectives" value={editableFields.perspectives}
                    onUpdate={updateField} placeholder="Décrivez les axes de développement et objectifs de la prochaine année..." />
                </div>
              </div>
            </Section>
          </motion.div>
        ) : (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Impossible de charger les données du rapport</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Save toast ── */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-2xl z-50">
            ✅ Modification enregistrée
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
