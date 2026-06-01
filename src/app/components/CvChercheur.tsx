
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth";
import { articlesApi } from "../../lib/api";
import {
  FileText, Edit3, Check, Plus, Trash2, Download,
  GraduationCap, Briefcase, Award, Globe, Mail, Phone,
  MapPin, BookOpen, X, Save,
} from "lucide-react";

const API_BASE = "http://localhost:3001";
const token = () => localStorage.getItem("larodec_token") ?? "";

const getPrefix = (grade: string) => {
  const m: Record<string, string> = { "Professeur": "Prof.", "Maitre de Conferences": "MC.", "Maitre Assistant": "MA.", "Assistant": "A.", "Doctorant": "D." };
  return m[grade] || "Dr.";
};

interface CVData {
  nom: string; prenom: string; grade: string; email: string;
  telephone: string; etablissement: string; universite: string;
  orcid: string; google_scholar_url: string; scopus_id: string; linkedin: string;
  domaines_recherche: string;
  bio: string;
  diplomes: { annee: string; intitule: string; institution: string; pays: string }[];
  enseignement: { institution: string; cours: string }[];
  experiences: { poste: string; etablissement: string; periode: string; description: string }[];
  competences: string[];
  langues: { langue: string; niveau: string }[];
  autres_activites: { annee: string; type: string; detail: string }[];
  distinctions: string[];
}

const defaultCV = (): CVData => ({
  nom: "", prenom: "", grade: "", email: "", telephone: "",
  etablissement: "", universite: "", orcid: "", google_scholar_url: "",
  scopus_id: "", linkedin: "", domaines_recherche: "",
  bio: "",
  diplomes: [],
  enseignement: [],
  experiences: [],
  competences: [],
  langues: [],
  autres_activites: [],
  distinctions: [],
});

// Seed data for Ben Arfa Rabai Latifa
const SEED_CV: Partial<CVData> = {
  bio: "Professeure des universités en Informatique de Gestion, Directrice du laboratoire LARODEC. Ses travaux portent sur la gestion avancée de projets logiciels, les métriques et la qualité/sécurité des logiciels, et l'analytique des données pour l'ingénierie logicielle.",
  diplomes: [
    { annee: "2015", intitule: "Habilitation Universitaire", institution: "ISG Tunis", pays: "Tunisie" },
    { annee: "1992", intitule: "Doctorat en Informatique", institution: "Faculté des Sciences de Tunis", pays: "Tunisie" },
    { annee: "1998", intitule: "Master en Informatique (6e année Ingénierie)", institution: "Faculté des Sciences de Tunis", pays: "Tunisie" },
    { annee: "1995", intitule: "Diplôme d'Études Universitaires en Physique et Chimie", institution: "Faculté des Sciences de Tunis", pays: "Tunisie" },
  ],
  enseignement: [
    { institution: "ISG Tunis", cours: "Génie Logiciel (M2) — depuis 2011" },
    { institution: "ISG Tunis", cours: "Gestion de Projets (M2) — depuis 2010" },
    { institution: "ISG Tunis", cours: "Gestion de Projets IT (M2) — depuis 2016" },
    { institution: "ISG Tunis", cours: "Analyse Métier (M1) — depuis 2022" },
    { institution: "IAE Lyon-IHET", cours: "Gestion de Projets SI (M1 CCA) — depuis 2013" },
    { institution: "IAE Lyon-IHET", cours: "Pilotage de la Performance IT (M2 CCA) — depuis 2023" },
  ],
  experiences: [
    { poste: "Professeure des universités", etablissement: "ISG Tunis", periode: "Depuis 2022", description: "" },
    { poste: "Maître de Conférences", etablissement: "ISG Tunis", periode: "2021–2022", description: "" },
    { poste: "Maître de Conférences", etablissement: "Université d'Al Buraimi – OMAN", periode: "2018–2021", description: "Responsable par intérim de la Recherche, Innovation, Entrepreneuriat et Études Doctorales (2020–2021)" },
    { poste: "Maître de Conférences", etablissement: "ISG Tunis", periode: "2016–2018", description: "" },
    { poste: "Professeure Assistante", etablissement: "ISG Tunis", periode: "1995–2016", description: "" },
    { poste: "Chargée de cours", etablissement: "ISG Tunis", periode: "1991–1994", description: "" },
    { poste: "Conseillère Scientifique", etablissement: "ATEA", periode: "2025", description: "" },
    { poste: "Présidente du Comité des Thèses de Doctorat en Informatique", etablissement: "ISG Tunis", periode: "2025", description: "" },
    { poste: "Expert Système d'Information Sectoriel", etablissement: "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique, Tunisie", periode: "2023–2024", description: "" },
    { poste: "Chef de Projet – Spécifications techniques SI régional formation-emploi", etablissement: "COFORMATION-GIZ", periode: "2018", description: "" },
    { poste: "Directrice des Études", etablissement: "ISG Tunis", periode: "2006–2008", description: "" },
    { poste: "Cheffe du Département Informatique", etablissement: "ISG Tunis", periode: "1995–1996", description: "" },
  ],
  competences: [
    "Gestion avancée de projets logiciels",
    "Métriques et qualité logicielle",
    "Sécurité des systèmes d'information",
    "Analytique des données pour l'ingénierie logicielle",
    "Ontologies de sécurité",
    "Évaluation quantitative des risques",
    "Cloud Computing",
    "Scrum / Agile",
  ],
  langues: [
    { langue: "Arabe", niveau: "Natif" },
    { langue: "Français", niveau: "Courant" },
    { langue: "Anglais", niveau: "Courant" },
  ],
  autres_activites: [
    { annee: "2021", type: "Présidente de programme", detail: "Conférence IEASMA 2021, Buraimi, Oman" },
    { annee: "2021", type: "Membre du comité de programme", detail: "RDAAPS 2021, WiDS 2021" },
    { annee: "2017", type: "Membre du comité de programme", detail: "AICCSA 2017" },
    { annee: "2024–2025", type: "Évaluatrice", detail: "Projets européens ERASMUS+" },
    { annee: "2017–2018", type: "Membre du Conseil", detail: "Université de Tunis, Tunisie" },
    { annee: "2018–2021", type: "Membre du Conseil", detail: "Collège de Business, Université d'Al Buraimi, Oman" },
    { annee: "2016–2018", type: "Membre", detail: "Comité national de recrutement des maîtres assistants en Informatique de Gestion" },
    { annee: "Continu", type: "Relectrice", detail: "Computers in Human Behavior (Elsevier), ISSE (Springer), International Journal of Image Mining, Asian Journal of Research in Computer Science" },
    { annee: "Depuis 2007", type: "Directrice de thèses", detail: "Encadrement de thèses de doctorat" },
    { annee: "Depuis 2005", type: "Directrice de mémoires", detail: "Encadrement de mémoires de master" },
  ],
  distinctions: [
    "2023 — Certification PSM (Professional Scrum Master), Scrum.org",
    "2022 — Certification PMP (Project Management Professional), PMI",
    "2020 — Prix d'Excellence en Recherche, Université d'Al Buraimi, Sultanat d'Oman",
    "2004 — Ordre National du Mérite pour l'Éducation et la Science, Ministère de l'Enseignement Supérieur, Tunisie",
  ],
};

export function CvChercheur() {
  const { session } = useAuth();
  const [cv, setCv] = useState<CVData>(defaultCV());
  const [pubs, setPubs] = useState<any[]>([]);
  const [theses, setTheses] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fullName = session?.user.nom && session?.user.prenom
    ? `${session.user.nom} ${session.user.prenom}`.toUpperCase() : "";

  useEffect(() => {
    if (!session?.user) return;
    // Pre-fill from session
    setCv(prev => ({
      ...prev,
      nom: session.user.nom || "",
      prenom: session.user.prenom || "",
      grade: session.user.grade || "",
      email: session.user.email || "",
      telephone: session.user.telephone || "",
      etablissement: session.user.etablissement || "",
      universite: session.user.universite || "",
      orcid: session.user.orcid || "",
      google_scholar_url: session.user.google_scholar_url || "",
    }));
    // Load saved CV from localStorage
    const saved = localStorage.getItem(`cv_${session.user.id}`);
    if (saved) {
      try { setCv(JSON.parse(saved)); } catch {}
    } else {
      // Seed with Latifa Rabai's data if profile matches
      const nomComplet = `${session.user.nom || ""} ${session.user.prenom || ""}`.toLowerCase();
      if (nomComplet.includes("rabai") || nomComplet.includes("ben arfa") || session.user.email?.includes("rabai")) {
        setCv(prev => ({
          ...prev,
          ...SEED_CV,
          orcid: prev.orcid || "0000-0002-5657-4682",
          google_scholar_url: prev.google_scholar_url || "https://scholar.google.com/citations?user=n2Mqv7YAAAAJ&hl=en",
          scopus_id: prev.scopus_id || "35318259000",
          linkedin: prev.linkedin || "https://www.linkedin.com/in/prof-latifa-benarfa-rabai-722424267/",
          domaines_recherche: prev.domaines_recherche || "Gestion avancée de projets logiciels · Métriques, Qualité et Sécurité logicielle · Analytique des données pour l'ingénierie logicielle",
        }));
      }
    }
    // Load publications
    if (fullName) {
      articlesApi.getAll({ chercheur: fullName, limit: 100 }).then(d => setPubs(d.items || [])).catch(() => {});
    }
    // Load theses
    fetch(`${API_BASE}/api/chercheur/theses`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.ok ? r.json() : []).then(d => setTheses(Array.isArray(d) ? d : [])).catch(() => {});
  }, [session]);

  const saveCV = () => {
    if (session?.user?.id) localStorage.setItem(`cv_${session.user.id}`, JSON.stringify(cv));
    setSaved(true); setEditing(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrint = () => window.print();

  const prefix = cv.grade ? getPrefix(cv.grade) : "Dr.";
  const displayName = `${prefix} ${cv.prenom} ${cv.nom}`.trim();

  // Helpers for list fields
  const addItem = (field: keyof CVData, item: any) => setCv(p => ({ ...p, [field]: [...(p[field] as any[]), item] }));
  const removeItem = (field: keyof CVData, idx: number) => setCv(p => ({ ...p, [field]: (p[field] as any[]).filter((_: any, i: number) => i !== idx) }));
  const updateItem = (field: keyof CVData, idx: number, val: any) => setCv(p => { const arr = [...(p[field] as any[])]; arr[idx] = val; return { ...p, [field]: arr }; });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h1 className="font-bold text-slate-800">Mon CV Académique</h1>
          {saved && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" />Sauvegardé</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={saveCV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all">
            <Save className="w-4 h-4" />Sauvegarder
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all">
            <Download className="w-4 h-4" />Imprimer / PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                {editing === "header" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={cv.prenom} onChange={e => setCv(p => ({ ...p, prenom: e.target.value }))} placeholder="Prénom" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                      <input value={cv.nom} onChange={e => setCv(p => ({ ...p, nom: e.target.value }))} placeholder="Nom" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                    </div>
                    <select value={cv.grade} onChange={e => setCv(p => ({ ...p, grade: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm outline-none">
                      <option value="">Grade</option>
                      {["Professeur","Maitre de Conferences","Maitre Assistant","Assistant","Doctorant"].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input value={cv.etablissement} onChange={e => setCv(p => ({ ...p, etablissement: e.target.value }))} placeholder="Établissement" className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                    <input value={cv.universite} onChange={e => setCv(p => ({ ...p, universite: e.target.value }))} placeholder="Université" className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={cv.email} onChange={e => setCv(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                      <input value={cv.telephone} onChange={e => setCv(p => ({ ...p, telephone: e.target.value }))} placeholder="Téléphone" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                    </div>
                    <input value={cv.orcid} onChange={e => setCv(p => ({ ...p, orcid: e.target.value }))} placeholder="ORCID" className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm outline-none focus:border-white/50" />
                    <button onClick={() => setEditing(null)} className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all"><Check className="w-4 h-4" />OK</button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-bold mb-1">{displayName || "Votre Nom"}</h2>
                    <p className="text-slate-300 text-lg mb-1">{cv.grade || "Grade"}</p>
                    {cv.domaines_recherche && <p className="text-slate-400 text-xs mb-3 italic">{cv.domaines_recherche}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                      {cv.etablissement && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{cv.etablissement}</span>}
                      {cv.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{cv.email}</span>}
                      {cv.telephone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{cv.telephone}</span>}
                      {cv.orcid && <a href={`https://orcid.org/${cv.orcid}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><Globe className="w-3.5 h-3.5" />ORCID: {cv.orcid}</a>}
                      {cv.scopus_id && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Scopus: {cv.scopus_id}</span>}
                      {cv.google_scholar_url && <a href={cv.google_scholar_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><Globe className="w-3.5 h-3.5" />Google Scholar</a>}
                      {cv.linkedin && <a href={cv.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><Globe className="w-3.5 h-3.5" />LinkedIn</a>}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setEditing(editing === "header" ? null : "header")} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all print:hidden flex-shrink-0">
                {editing === "header" ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* ── Bio ── */}
            <CVSection title="Profil" icon={<User className="w-4 h-4" />} onEdit={() => setEditing(editing === "bio" ? null : "bio")} isEditing={editing === "bio"}>
              {editing === "bio" ? (
                <textarea value={cv.bio} onChange={e => setCv(p => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Décrivez votre profil de recherche, vos domaines d'expertise..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              ) : (
                <p className="text-slate-600 text-sm leading-relaxed">{cv.bio || <span className="text-slate-400 italic">Cliquez sur Modifier pour ajouter votre profil...</span>}</p>
              )}
            </CVSection>

            {/* ── Formations ── */}
            <CVSection title="Formation" icon={<GraduationCap className="w-4 h-4" />} onEdit={() => setEditing(editing === "diplomes" ? null : "diplomes")} isEditing={editing === "diplomes"}>
              <div className="space-y-3">
                {(cv.diplomes || []).map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-1">
                      {editing === "diplomes" ? (
                        <div className="grid grid-cols-4 gap-2">
                          <input value={f.intitule} onChange={e => updateItem("diplomes", i, { ...f, intitule: e.target.value })} placeholder="Diplôme" className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                          <input value={f.institution} onChange={e => updateItem("diplomes", i, { ...f, institution: e.target.value })} placeholder="Institution" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                          <input value={f.annee} onChange={e => updateItem("diplomes", i, { ...f, annee: e.target.value })} placeholder="Année" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm font-semibold text-slate-800">{f.intitule}</span>
                          <span className="text-sm text-slate-500">{f.institution}</span>
                          {f.pays && <span className="text-xs text-slate-400">{f.pays}</span>}
                          <span className="text-xs text-slate-400 ml-auto">{f.annee}</span>
                        </div>
                      )}
                    </div>
                    {editing === "diplomes" && <button onClick={() => removeItem("diplomes", i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                {editing === "diplomes" && (
                  <button onClick={() => addItem("diplomes", { intitule: "", institution: "", annee: "", pays: "" })} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-4 h-4" />Ajouter une formation
                  </button>
                )}
                {(cv.diplomes || []).length === 0 && editing !== "diplomes" && <p className="text-slate-400 text-sm italic">Aucune formation ajoutée</p>}
              </div>
            </CVSection>

            {/* ── Expériences ── */}
            <CVSection title="Expériences professionnelles" icon={<Briefcase className="w-4 h-4" />} onEdit={() => setEditing(editing === "experiences" ? null : "experiences")} isEditing={editing === "experiences"}>
              <div className="space-y-4">
                {cv.experiences.map((e, i) => (
                  <div key={i} className="border-l-2 border-blue-200 pl-4">
                    {editing === "experiences" ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={e.poste} onChange={ev => updateItem("experiences", i, { ...e, poste: ev.target.value })} placeholder="Poste" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                          <input value={e.periode} onChange={ev => updateItem("experiences", i, { ...e, periode: ev.target.value })} placeholder="Période" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <input value={e.etablissement} onChange={ev => updateItem("experiences", i, { ...e, etablissement: ev.target.value })} placeholder="Établissement" className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                        <textarea value={e.description} onChange={ev => updateItem("experiences", i, { ...e, description: ev.target.value })} placeholder="Description" rows={2} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                        <button onClick={() => removeItem("experiences", i)} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" />Supprimer</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold text-slate-800">{e.poste}</span>
                          <span className="text-xs text-slate-400">{e.periode}</span>
                        </div>
                        <p className="text-sm text-blue-600 font-medium">{e.etablissement}</p>
                        {e.description && <p className="text-sm text-slate-500 mt-1">{e.description}</p>}
                      </>
                    )}
                  </div>
                ))}
                {editing === "experiences" && (
                  <button onClick={() => addItem("experiences", { poste: "", etablissement: "", periode: "", description: "" })} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-4 h-4" />Ajouter une expérience
                  </button>
                )}
                {cv.experiences.length === 0 && editing !== "experiences" && <p className="text-slate-400 text-sm italic">Aucune expérience ajoutée</p>}
              </div>
            </CVSection>

            {/* ── Publications (auto) ── */}
            <CVSection title={`Publications (${pubs.length})`} icon={<BookOpen className="w-4 h-4" />} onEdit={null} isEditing={false}>
              {pubs.length === 0 ? (
                <p className="text-slate-400 text-sm italic">Aucune publication synchronisée</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pubs.slice(0, 20).map((p, i) => (
                    <div key={i} className="text-sm text-slate-700 border-b border-slate-50 pb-2">
                      <span className="font-medium">{p.titre}</span>
                      {p.journal_ou_editeur && <span className="text-slate-500 italic"> — {p.journal_ou_editeur}</span>}
                      {p.annee && <span className="text-slate-400"> ({p.annee})</span>}
                      {p.indexation && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{p.indexation}</span>}
                    </div>
                  ))}
                  {pubs.length > 20 && <p className="text-xs text-slate-400 italic">... et {pubs.length - 20} autres publications</p>}
                </div>
              )}
            </CVSection>

            {/* ── Thèses encadrées (auto) ── */}
            {theses.length > 0 && (
              <CVSection title={`Thèses encadrées (${theses.length})`} icon={<GraduationCap className="w-4 h-4" />} onEdit={null} isEditing={false}>
                <div className="space-y-2">
                  {theses.map((t, i) => (
                    <div key={i} className="text-sm text-slate-700 border-b border-slate-50 pb-2">
                      <span className="font-medium">{t.titre}</span>
                      {t.annee && <span className="text-slate-400"> ({t.annee})</span>}
                      {t.sujet && <p className="text-slate-500 text-xs mt-0.5">{t.sujet}</p>}
                    </div>
                  ))}
                </div>
              </CVSection>
            )}

            {/* ── Compétences ── */}
            <CVSection title="Compétences & Domaines" icon={<Award className="w-4 h-4" />} onEdit={() => setEditing(editing === "competences" ? null : "competences")} isEditing={editing === "competences"}>
              <div className="flex flex-wrap gap-2">
                {cv.competences.map((c, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-full">
                    {c}
                    {editing === "competences" && <button onClick={() => removeItem("competences", i)} className="text-blue-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>}
                  </span>
                ))}
                {editing === "competences" && (
                  <button onClick={() => { const v = prompt("Nouvelle compétence :"); if (v?.trim()) addItem("competences", v.trim()); }} className="flex items-center gap-1 px-3 py-1 border border-dashed border-blue-300 text-blue-500 text-sm rounded-full hover:border-blue-500 transition-colors">
                    <Plus className="w-3 h-3" />Ajouter
                  </button>
                )}
                {cv.competences.length === 0 && editing !== "competences" && <p className="text-slate-400 text-sm italic">Aucune compétence ajoutée</p>}
              </div>
            </CVSection>

            {/* ── Langues ── */}
            <CVSection title="Langues" icon={<Globe className="w-4 h-4" />} onEdit={() => setEditing(editing === "langues" ? null : "langues")} isEditing={editing === "langues"}>
              <div className="flex flex-wrap gap-3">
                {cv.langues.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    {editing === "langues" ? (
                      <>
                        <input value={l.langue} onChange={e => updateItem("langues", i, { ...l, langue: e.target.value })} placeholder="Langue" className="w-20 px-1 py-0.5 border border-slate-200 rounded text-xs outline-none" />
                        <select value={l.niveau} onChange={e => updateItem("langues", i, { ...l, niveau: e.target.value })} className="px-1 py-0.5 border border-slate-200 rounded text-xs outline-none">
                          {["Natif","Courant","Avancé","Intermédiaire","Débutant"].map(n => <option key={n}>{n}</option>)}
                        </select>
                        <button onClick={() => removeItem("langues", i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <><span className="font-medium text-slate-700">{l.langue}</span><span className="text-slate-400">·</span><span className="text-slate-500">{l.niveau}</span></>
                    )}
                  </div>
                ))}
                {editing === "langues" && (
                  <button onClick={() => addItem("langues", { langue: "", niveau: "Courant" })} className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-slate-300 text-slate-500 text-sm rounded-lg hover:border-slate-500 transition-colors">
                    <Plus className="w-3 h-3" />Ajouter
                  </button>
                )}
                {cv.langues.length === 0 && editing !== "langues" && <p className="text-slate-400 text-sm italic">Aucune langue ajoutée</p>}
              </div>
            </CVSection>

            {/* ── Distinctions ── */}
            <CVSection title="Distinctions & Prix" icon={<Award className="w-4 h-4" />} onEdit={() => setEditing(editing === "distinctions" ? null : "distinctions")} isEditing={editing === "distinctions"}>
              <div className="space-y-2">
                {cv.distinctions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {editing === "distinctions" ? (
                      <>
                        <input value={d} onChange={e => updateItem("distinctions", i, e.target.value)} className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                        <button onClick={() => removeItem("distinctions", i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    ) : <span>{d}</span>}
                  </div>
                ))}
                {editing === "distinctions" && (
                  <button onClick={() => addItem("distinctions", "")} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-4 h-4" />Ajouter
                  </button>
                )}
                {cv.distinctions.length === 0 && editing !== "distinctions" && <p className="text-slate-400 text-sm italic">Aucune distinction ajoutée</p>}
              </div>
            </CVSection>

            {/* ── Enseignement ── */}
            {(cv.enseignement || []).length > 0 && (
              <CVSection title="Enseignement" icon={<GraduationCap className="w-4 h-4" />} onEdit={() => setEditing(editing === "enseignement" ? null : "enseignement")} isEditing={editing === "enseignement"}>
                <div className="space-y-2">
                  {(cv.enseignement || []).map((e, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex-1">
                        {editing === "enseignement" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <input value={e.institution} onChange={ev => updateItem("enseignement", i, { ...e, institution: ev.target.value })} placeholder="Institution" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                            <input value={e.cours} onChange={ev => updateItem("enseignement", i, { ...e, cours: ev.target.value })} placeholder="Cours" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-3">
                            <span className="text-sm font-semibold text-slate-800 min-w-[120px]">{e.institution}</span>
                            <span className="text-sm text-slate-500">{e.cours}</span>
                          </div>
                        )}
                      </div>
                      {editing === "enseignement" && <button onClick={() => removeItem("enseignement", i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  {editing === "enseignement" && (
                    <button onClick={() => addItem("enseignement", { institution: "", cours: "" })} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      <Plus className="w-4 h-4" />Ajouter
                    </button>
                  )}
                </div>
              </CVSection>
            )}

            {/* ── Autres activités ── */}
            {(cv.autres_activites || []).length > 0 && (
              <CVSection title="Activités académiques & professionnelles" icon={<Briefcase className="w-4 h-4" />} onEdit={() => setEditing(editing === "autres_activites" ? null : "autres_activites")} isEditing={editing === "autres_activites"}>
                <div className="space-y-2">
                  {(cv.autres_activites || []).map((a, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">{a.annee}</span>
                      <div className="flex-1">
                        {editing === "autres_activites" ? (
                          <div className="grid grid-cols-3 gap-2">
                            <input value={a.annee} onChange={e => updateItem("autres_activites", i, { ...a, annee: e.target.value })} placeholder="Année" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                            <input value={a.type} onChange={e => updateItem("autres_activites", i, { ...a, type: e.target.value })} placeholder="Type" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                            <input value={a.detail} onChange={e => updateItem("autres_activites", i, { ...a, detail: e.target.value })} placeholder="Détail" className="px-2 py-1.5 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-slate-700">{a.type}</span>
                            {a.detail && <span className="text-slate-500"> — {a.detail}</span>}
                          </>
                        )}
                      </div>
                      {editing === "autres_activites" && <button onClick={() => removeItem("autres_activites", i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  {editing === "autres_activites" && (
                    <button onClick={() => addItem("autres_activites", { annee: "", type: "", detail: "" })} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      <Plus className="w-4 h-4" />Ajouter
                    </button>
                  )}
                </div>
              </CVSection>
            )}

          </div>
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: white; } }`}</style>
    </div>
  );
}

function User(props: any) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }

function CVSection({ title, icon, onEdit, isEditing, children }: { title: string; icon: React.ReactNode; onEdit: (() => void) | null; isEditing: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
          <span className="text-blue-600">{icon}</span>{title}
        </h3>
        {onEdit && (
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all print:hidden">
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        )}
      </div>
      <div className="border-t border-slate-100 pt-3">{children}</div>
    </div>
  );
}
