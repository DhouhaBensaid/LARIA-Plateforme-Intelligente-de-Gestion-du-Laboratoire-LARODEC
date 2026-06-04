import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Users, BookOpen, Globe, Award, TrendingUp, Target, Lightbulb,
  LogIn, UserPlus, ChevronRight, Mail, Phone, MapPin,
  GraduationCap, Handshake, Menu, X, ExternalLink, Calendar, FlaskConical, Clock,
  Building2, User, Radio,
} from "lucide-react";
import drapeau from "../../imports/drapeau.png";
import isg from "../../imports/isg.png";
import { useLang } from "../../lib/useLang";
import { useCountUp } from "../../lib/useCountUp";

import { BackgroundLogo } from "./BackgroundLogo";

/* ─── Palette ────────────────────────────────────────────────────────────── */
const C = {
  primary:    "#1A73E8",
  dark:       "#1E293B",
  darkest:    "#1A1A4E",
  lightBg:    "#EEF4FF",
  lightBdr:   "#BFDBFE",
  pageBg:     "#F8FAFF",
  textMain:   "#374151",
  textSec:    "#64748B",
  borderGray: "#E2E8F0",
  cardBg:     "#F1F5F9",
  white:      "#FFFFFF",
  success:    "#10B981",
};

/* ─── Typewriter ─────────────────────────────────────────────────────────── */
const TYPEWRITER_PHRASES = [
  "Recherche Opérationnelle & Aide à la Décision",
  "Intelligence Artificielle & Apprentissage Automatique",
  "Modèles Graphiques & Web Sémantique",
];
function TypewriterSubtitle() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting]   = useState(false);
  const [paused, setPaused]       = useState(false);
  useEffect(() => {
    if (paused) { const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 2600); return () => clearTimeout(t); }
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    if (!deleting) {
      if (displayed.length < phrase.length) { const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 38); return () => clearTimeout(t); }
      else setPaused(true);
    } else {
      if (displayed.length > 0) { const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18); return () => clearTimeout(t); }
      else { setDeleting(false); setPhraseIdx((phraseIdx + 1) % TYPEWRITER_PHRASES.length); }
    }
  }, [displayed, deleting, paused, phraseIdx]);
  return (
    <>
      <p className="tw-line" style={{ fontSize:17, color:C.primary, fontWeight:600, minHeight:26, letterSpacing:"0.005em", background:"none" }}>
        {displayed}
      </p>
      <style>{`
        .tw-line::after {
          content: '';
          display: inline-block;
          width: 2px;
          height: 1em;
          background: ${C.primary};
          margin-left: 2px;
          vertical-align: middle;
          animation: tw-blink 0.7s step-end infinite;
        }
      `}</style>
    </>
  );
}

/* ─── Axes de recherche ──────────────────────────────────────────────────── */
const AXES_RECHERCHE = [
  { id:1, titre:"Aide à la décision et théorie de jeux",       icon:Target,    description:"Modèles formels, analyses axiomatiques et aide à la décision", megaDesc:"Modèles formels, analyses axiomatiques et aide à la décision",      shortDesc:"Décision multicritère & jeux",      resume:"Cet axe couvre les fondements théoriques de l'aide à la décision multicritère et la théorie des jeux.",        objectifs:["Développement de méthodes d'aide à la décision multicritère","Application de la théorie des jeux","Modélisation formelle des processus de décision","Analyse axiomatique des systèmes de préférences"],           applications:["Optimisation des stratégies d'entreprise","Résolution de conflits multi-acteurs","Aide à la décision en gestion de projets","Analyse de risques stratégiques"],               color:"from-blue-600 to-blue-400"   },
  { id:2, titre:"Gestion de l'incertitude et modèles graphiques", icon:Lightbulb, description:"Représentation de problèmes complexes sous incertitude", megaDesc:"Représentation de problèmes complexes sous incertitude",    shortDesc:"Modèles probabilistes & bayésiens", resume:"Développement de modèles graphiques probabilistes pour la représentation et le traitement de l'incertitude.",   objectifs:["Modélisation graphique probabiliste","Inférence bayésienne avancée","Traitement de l'incertitude épistémique","Représentation de connaissances incertaines"],                     applications:["Diagnostic de systèmes complexes","Prédiction sous incertitude","Systèmes d'aide à la décision robustes","Analyse de fiabilité"],                                          color:"from-yellow-600 to-yellow-400"},
  { id:3, titre:"Apprentissage automatique de données complexes",icon:TrendingUp, description:"Systèmes d'apprentissage et data science", megaDesc:"Systèmes d'apprentissage et data science", shortDesc:"Deep learning & data science",  resume:"Développement d'algorithmes d'apprentissage automatique pour l'analyse de données complexes.",                objectifs:["Apprentissage profond et réseaux de neurones","Apprentissage non supervisé et clustering","Traitement du big data","Extraction de connaissances"],                              applications:["Classification et prédiction","Analyse de données massives","Reconnaissance de patterns","Systèmes de recommandation"],                                                     color:"from-green-600 to-green-400"  },
  { id:4, titre:"Logistique et production, management qualité", icon:Globe,      description:"Sûreté de fonctionnement et optimisation", megaDesc:"Sûreté de fonctionnement et optimisation", shortDesc:"Optimisation & qualité industrielle", resume:"Application des techniques mathématiques à la gestion industrielle et amélioration de la qualité.",              objectifs:["Contrôle des procédés industriels","Amélioration continue de la qualité","Optimisation de la maintenance","Fiabilité des systèmes et réseaux"],                                applications:["Automatisation de processus","Gestion de la qualité totale","Optimisation logistique","Sûreté des systèmes informatiques"],                                                  color:"from-purple-600 to-purple-400"},
  { id:5, titre:"Statistique Appliquée et Algorithmes stochastiques", icon:Award, description:"Production d'algorithmes pour résolution exacte ou approchée", megaDesc:"Production d'algorithmes pour résolution exacte ou approchée", shortDesc:"Méthodes MCMC & stochastiques", resume:"Développement de modèles statistiques et algorithmes stochastiques pour l'optimisation.",                  objectifs:["Méthodes MCMC et SMC","Évaluation des risques financiers","Prévision des changements climatiques","Simulation numérique complexe"],                                            applications:["Gestion des risques financiers","Prévision climatique","Optimisation de systèmes complexes","Analyse de données massives"],                                                  color:"from-red-600 to-red-400"     },
  { id:6, titre:"Gestion de connaissances et Web sémantique",    icon:BookOpen,  description:"Systèmes à bases de connaissances et web sémantique", megaDesc:"Systèmes à bases de connaissances et web sémantique",       shortDesc:"Ontologies & linked data",         resume:"Développement de systèmes de gestion des connaissances et technologies du web sémantique.",                     objectifs:["Ontologies et représentation des connaissances","Web sémantique et linked data","Systèmes d'information intelligents","Interopérabilité des données"],                          applications:["Systèmes d'information d'entreprise","Portails de connaissances","Intégration de données hétérogènes","Web sémantique appliqué"],                                           color:"from-cyan-600 to-cyan-400"   },
];

const LIENS_UTILES = [
  { titre:"Ministère de l'Enseignement Supérieur et de la Recherche Scientifique", description:"Portail officiel du ministère tunisien de l'enseignement supérieur", url:"http://www.mes.tn/" },
  { titre:"Thomson Reuters Impact Factor", description:"Facteur d'impact et métriques de citation des revues scientifiques", url:"http://wokinfo.com/essays/impact-factor/" },
  { titre:"Ressources électroniques pour les chercheurs (CNUDST)", description:"Accès aux ressources numériques et bases de données scientifiques", url:"http://www.cnudst.rnrt.tn/" },
  { titre:"Moteur de recherche des thèses de doctorat en Tunisie", description:"Plateforme de recherche et consultation des thèses tunisiennes", url:"http://www.theses-tn.net/" },
  { titre:"Université Virtuelle de Tunis (UVT)", description:"Plateforme d'enseignement et de formation en ligne", url:"http://www.uvt.rnu.tn/uvt/" },
  { titre:"Agence Nationale de Promotion de la Recherche Scientifique (ANPR)", description:"Agence de promotion et financement de la recherche scientifique", url:"http://www.anpr.tn/index.php?id=12" },
  { titre:"Belief Functions and Applications Society", description:"Société internationale pour les fonctions de croyance et applications", url:"http://www.bfasociety.org/" },
];

function getPartners(convs: any[]): string[] {
  const def = ["Université Paris-Saclay","Université de Sousse","Université de Helwan","Université de Madeira","Institut Pasteur","Faculté de Médecine de Tunis"];
  if (!convs || convs.length === 0) return def;
  const r: string[] = [];
  convs.forEach((c: any) => { String(c.partenaire || "").split(",").forEach((p: string) => { const t = p.trim(); if (t && !r.includes(t)) r.push(t); }); });
  return r.length > 0 ? r : def;
}

function getInitials(name: string): string {
  const words = name.replace(/^(Université|Université de|Institut|Faculté de)/i, "").trim().split(/\s+/);
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || name.slice(0, 2).toUpperCase();
}

/* ─── StatCard ───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, target, label, color, iconBg, iconColor, visible }: {
  icon: any; target: number; label: string; color: string; iconBg: string; iconColor: string; visible: boolean;
}) {
  const val = useCountUp(target, 1800, visible);
  return (
    <div className="group relative">
      <div className="relative bg-white rounded-2xl border p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ borderColor: C.borderGray }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ background: C.lightBg }}>
          <Icon className="w-5 h-5" style={{ color: C.primary }} />
        </div>
        <p className="font-bold mb-1" style={{ fontSize: 46, color: C.darkest, lineHeight: 1 }}>{val}</p>
        <p className="text-[13px] font-semibold" style={{ color: C.textSec }}>{label}</p>
        <div className="mt-3 h-0.5 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: C.primary }} />
      </div>
    </div>
  );
}

/* ─── Logo LARODEC SVG ────────────────────────────────────────────────────── */
function LogoLarodecSVG({ height = 34 }: { height?: number }) {
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ height, width: "auto", flexShrink: 0 }} aria-label="LARODEC">
      <circle cx="20" cy="20" r="11" stroke={C.primary} strokeWidth="2.2"/>
      <circle cx="20" cy="20" r="6"  stroke={C.primary} strokeWidth="1.8"/>
      <circle cx="20" cy="20" r="2.2" fill={C.primary}/>
      <line x1="22.5" y1="20" x2="31" y2="20" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="27.5" y1="16.5" x2="31" y2="20" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="27.5" y1="23.5" x2="31" y2="20" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round"/>
      <text x="38" y="27" fontFamily="'Inter','Segoe UI',sans-serif" fontWeight="800" fontSize="18"
        fill={C.darkest} letterSpacing="0.04em">LARODEC</text>
    </svg>
  );
}

/* ─── LangSwitcher ───────────────────────────────────────────────────────── */
function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1 rounded-lg p-0.5 border" style={{ background: C.lightBg, borderColor: C.lightBdr }}>
      {(["fr","en"] as const).map(l => (
        <button key={l} onClick={() => setLang(l)}
          className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
          style={lang === l ? { background: C.darkest, color: C.white } : { color: C.darkest }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ─── ThemesMegaMenu ──────────────────────────────────────────────────────── */
function ThemesMegaMenu({ onNavigate, visible, onHighlight }: { onNavigate: (id: string) => void; visible: boolean; onHighlight?: (id: number) => void }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
      width: 700, background: C.white, borderRadius: 16, border: `1px solid ${C.borderGray}`,
      boxShadow: "0 8px 32px rgba(0,0,0,0.10)", zIndex: 100, padding: "20px",
      animation: "mega-in 0.18s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <p style={{ fontSize:11, fontWeight:700, color:C.textSec, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Axes de recherche</p>
      <div className="grid grid-cols-2 gap-1.5">
        {AXES_RECHERCHE.map(axe => {
          const Icon = axe.icon;
          return (
            <button key={axe.id} onClick={() => { onNavigate("recherche-section"); onHighlight?.(axe.id); }}
              className="flex items-start gap-3 p-3 rounded-xl text-left transition-all"
              style={{ background:"transparent", border:"none", cursor:"pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.lightBg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div style={{ width:34, height:34, borderRadius:9, background:C.lightBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                <Icon size={15} style={{ color:C.primary }} />
              </div>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.darkest, lineHeight:1.35, marginBottom:2, wordBreak:"break-word", whiteSpace:"normal" }}>{axe.titre}</p>
                <p style={{ fontSize:11, color:C.textSec, lineHeight:1.3 }}>{axe.megaDesc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Composant principal ───────────────────────────────────────────────── */
export function AccueilLarodec() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [activeSection, setActiveSection] = useState("laboratoire");
  const [menuOpen, setMenuOpen]           = useState(false);
  const [activeTab, setActiveTab]         = useState("partenaires");
  const [stats, setStats]                 = useState<any>({ chercheurs:53, publications:881, conventions:2, projets:0 });
  const [conventions, setConventions]     = useState<any[]>([]);
  const [events, setEvents]               = useState<any[]>([]);
  const [memberStats, setMemberStats]     = useState<any>({ "Corps A":17, "Corps B":36, "Doctorant":32, "Post-Doc":48 });
  const [statsVisible, setStatsVisible]   = useState(false);
  const [axesVisible, setAxesVisible]     = useState(false);
  const [selectedAxe, setSelectedAxe]     = useState<typeof AXES_RECHERCHE[0] | null>(null);
  const [scrolled, setScrolled]           = useState(false);
  const [highlightedAxe, setHighlightedAxe] = useState<number | null>(null);

  const statsRef    = useRef<HTMLElement | null>(null);
  const axesRef     = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const NAV_ITEMS = [
    { id:"laboratoire", label:"Accueil"          },
    { id:"actualites",  label:t.nav.actualites   },
    { id:"membres",     label:t.nav.membres      },
    { id:"recherche",   label:t.nav.recherche    },
    { id:"liens",       label:t.nav.liens        },
    { id:"contact",     label:t.nav.contact      },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const B = "http://localhost:3001/api";
    Promise.allSettled([
      fetch(B+"/public/stats").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(B+"/public/conventions").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(B+"/public/events").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(B+"/researchers/stats").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([st, co, ev, me]) => {
      if (st.status === "fulfilled" && st.value) setStats((p: any) => ({ ...p, ...st.value }));
      if (co.status === "fulfilled" && Array.isArray(co.value)) setConventions(co.value);
      if (ev.status === "fulfilled" && Array.isArray(ev.value)) {
        const now = Date.now();
        setEvents([...ev.value].sort((a: any, b: any) => {
          const da = new Date(a.date_debut || 0).getTime(), db = new Date(b.date_debut || 0).getTime();
          const aF = da >= now, bF = db >= now;
          if (aF && bF) return da - db; if (aF) return -1; if (bF) return 1; return db - da;
        }));
      }
      if (me.status === "fulfilled" && me.value) setMemberStats((p: any) => ({ ...p, ...me.value }));
    });
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    obs.observe(statsRef.current); return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!axesRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAxesVisible(true); }, { threshold: 0.1 });
    obs.observe(axesRef.current); return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    if (id === "recherche") { navigate("/publications"); return; }
    if (id === "recherche-section") {
      sectionRefs.current["laboratoire"]?.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false); return;
    }
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const handleHighlight = (axeId: number) => {
    setHighlightedAxe(axeId);
    setTimeout(() => setHighlightedAxe(null), 1500);
  };
  const ref = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };
  const partners = getPartners(conventions);

  const statCards = [
    { icon:Users,         target:stats.chercheurs    || 53,  label:t.stats.chercheurs,   color:"from-blue-700 to-blue-500", iconBg:"bg-blue-50", iconColor:"text-blue-600" },
    { icon:BookOpen,      target:stats.publications  || 881, label:t.stats.publications, color:"from-blue-700 to-blue-500", iconBg:"bg-blue-50", iconColor:"text-blue-600" },
    { icon:GraduationCap, target:memberStats["Doctorant"] || 32, label:t.stats.doctorants, color:"from-blue-700 to-blue-500", iconBg:"bg-blue-50", iconColor:"text-blue-600" },
    { icon:Handshake,     target:stats.conventions   || 2,   label:t.stats.conventions,  color:"from-blue-700 to-blue-500", iconBg:"bg-blue-50", iconColor:"text-blue-600" },
    ...(stats.projets ? [{ icon:FlaskConical, target:stats.projets, label:t.stats.projets, color:"from-blue-700 to-blue-500", iconBg:"bg-blue-50", iconColor:"text-blue-600" }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>

      {/* ── Barre institutionnelle ── */}
      <div style={{ height: 32, background: C.white, borderBottom: `1px solid ${C.borderGray}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
          <img src={drapeau} alt="Drapeau Tunisie" style={{ height: 18, objectFit:"contain" }} />
          <span style={{ fontSize: 11, color: C.textMain, fontWeight: 500 }} className="hidden md:block">
            République Tunisienne&nbsp;&nbsp;·&nbsp;&nbsp;Ministère de l'Enseignement Supérieur&nbsp;&nbsp;·&nbsp;&nbsp;Université de Tunis
          </span>
          <span style={{ fontSize: 11, color: C.textMain, fontWeight: 500 }} className="md:hidden">Rép. Tunisienne · Univ. de Tunis</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
          <img src={isg} alt="ISG Tunis" style={{ height: 22, objectFit:"contain" }} />
          <span style={{ fontSize: 11, color: C.textMain, fontWeight: 500 }} className="hidden md:block">Institut Supérieur de Gestion de Tunis</span>
        </div>
      </div>

      {/* ── Navbar sticky ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.white,
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        borderBottom: `1px solid ${C.borderGray}`,
        transition: "box-shadow 250ms ease",
      }}>
        <div className="max-w-7xl mx-auto px-4" style={{ display:"flex", alignItems:"center", height: scrolled ? 52 : 56, transition:"height 200ms ease" }}>
          {/* Logo — cliquable */}
          <button onClick={() => scrollTo("laboratoire")} style={{ marginRight: 20, flexShrink: 0, display:"flex", alignItems:"center", background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <LogoLarodecSVG height={34} />
          </button>

          {/* Nav desktop */}
          <div className="hidden md:flex items-center flex-1">
            {/* Accueil */}
            <button onClick={() => scrollTo("laboratoire")}
              style={{ padding:"0 16px", height:scrolled?52:56, fontSize:14, fontWeight:600, color:activeSection==="laboratoire"?C.primary:C.textMain, background:"none", border:"none", borderBottom:`2px solid ${activeSection==="laboratoire"?C.primary:"transparent"}`, cursor:"pointer", transition:"color 150ms, border-color 150ms" }}>
              Accueil
            </button>

            {/* Thèmes — scroll vers section thématiques */}
            <button onClick={() => { 
              const themesSection = document.getElementById("themes");
              if (themesSection) {
                themesSection.scrollIntoView({ behavior: "smooth" });
              } else {
                scrollTo("laboratoire");
              }
            }}
              style={{ padding:"0 16px", height:scrolled?52:56, fontSize:14, fontWeight:600, color:C.textMain, background:"none", border:"none", borderBottom:`2px solid transparent`, cursor:"pointer", transition:"color 150ms, border-color 150ms" }}>
              Thèmes
            </button>

            {/* Autres items */}
            {NAV_ITEMS.filter(i => !["laboratoire"].includes(i.id)).map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                style={{ padding:"0 16px", height:scrolled?52:56, fontSize:14, fontWeight:600, color:activeSection===item.id?C.primary:C.textMain, background:"none", border:"none", borderBottom:`2px solid ${activeSection===item.id?C.primary:"transparent"}`, cursor:"pointer", transition:"color 150ms, border-color 150ms" }}>
                {item.label}
              </button>
            ))}
            
            {/* PulsAR — avec description au hover */}
            <button onClick={() => navigate("/radar")}
              className="group relative"
              style={{ padding:"0 16px", height:scrolled?52:56, fontSize:14, fontWeight:600, background:"none", border:"none", borderBottom:`2px solid transparent`, cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderBottom=`2px solid ${C.primary}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderBottom="2px solid transparent"; }}>
              <Radio size={18} style={{ color:C.primary }} />
              <span style={{ color:C.textMain }}>PulsAR</span>
              {/* Point pulsant */}
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full" style={{ background:C.primary, animation:"pulse-green 1.5s ease-in-out infinite", opacity:0.75 }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:C.primary }} />
              </span>
              {/* Tooltip descriptif */}
              <span
                className="absolute top-full left-1/2 mt-2 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                  transform: "translateX(-50%)",
                  background: "#1E293B",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  transition: "opacity 0.2s ease",
                  zIndex: 100,
                }}
              >
                Veille Scientifique IA • Dernières publications
              </span>
            </button>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2 ml-auto pl-4" style={{ borderLeft: `1px solid ${C.borderGray}` }}>
            <LangSwitcher />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, marginLeft: 8 }}>{t.nav.espaceMembers}</span>
            <button onClick={() => navigate("/login")}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", fontSize:13, color:C.textMain, borderRadius:8, background:"none", border:"none", fontWeight:500, cursor:"pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.lightBg)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <LogIn size={15} />{t.nav.connexion}
            </button>
            <button onClick={() => navigate("/login?register=true")}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 18px", fontSize:13, color:C.white, borderRadius:999, background:C.primary, border:"none", fontWeight:700, cursor:"pointer", boxShadow:"0 2px 8px rgba(26,115,232,0.25)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(26,115,232,0.45)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(26,115,232,0.25)"; }}>
              <UserPlus size={15} />{t.nav.inscription}
            </button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden ml-auto p-2" onClick={() => setMenuOpen(!menuOpen)} style={{ color:C.textMain, background:"none", border:"none", cursor:"pointer" }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop:`1px solid ${C.borderGray}`, background:C.pageBg }}>
            <button onClick={() => scrollTo("laboratoire")} className="w-full text-left" style={{ padding:"12px 24px", fontSize:14, color:C.primary, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>Accueil</button>
            {/* Thèmes — scroll vers section thématiques mobile */}
            <button onClick={() => {
              const themesSection = document.getElementById("themes");
              if (themesSection) {
                themesSection.scrollIntoView({ behavior: "smooth" });
                setMenuOpen(false);
              } else {
                scrollTo("laboratoire");
                setMenuOpen(false);
              }
            }} className="w-full text-left" style={{ padding:"12px 24px", fontSize:14, color:C.textMain, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>Thèmes</button>
            {NAV_ITEMS.filter(i => i.id !== "laboratoire").map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="w-full text-left"
                style={{ padding:"12px 24px", fontSize:14, color:activeSection===item.id?C.primary:C.textMain, fontWeight:600, background:"none", border:"none", cursor:"pointer" }}>
                {item.label}
              </button>
            ))}
            {/* PulsAR mobile */}
            <button onClick={() => navigate("/radar")} className="w-full text-left" 
              style={{ padding:"12px 24px", fontSize:14, color:C.textMain, fontWeight:600, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Radio size={18} style={{ color:C.primary }} />
              <span>PulsAR</span>
              <span style={{ fontSize:11, color:C.textSec, marginLeft:"auto" }}>Veille IA</span>
            </button>
            <div style={{ display:"flex", gap:8, padding:"12px 16px", borderTop:`1px solid ${C.borderGray}`, alignItems:"center" }}>
              <LangSwitcher />
              <button onClick={() => navigate("/login")} style={{ flex:1, padding:"8px", fontSize:13, textAlign:"center", color:C.primary, borderRadius:8, background:C.lightBg, border:"none", fontWeight:600, cursor:"pointer" }}>{t.nav.connexion}</button>
              <button onClick={() => navigate("/login?register=true")} style={{ flex:1, padding:"8px", fontSize:13, textAlign:"center", color:C.white, borderRadius:999, background:C.primary, border:"none", fontWeight:700, cursor:"pointer" }}>{t.nav.inscription}</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HÉRO ── */}
      <section id="laboratoire" ref={ref("laboratoire")}
        className="relative overflow-hidden"
        style={{ background:`linear-gradient(180deg, #F0F7FF 0%, ${C.white} 100%)`, padding:"64px 24px 56px" }}>

        {/* Filigrane en haut à droite — loin du texte */}
        <BackgroundLogo size={420} opacity={0.08} rotate={-8} top={-20} right={-60} />

        {/* Bulles déco */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[{w:200,h:200,t:"-4%",l:"-4%",d:"18s",dl:"0s"},{w:120,h:120,t:"60%",l:"1%",d:"20s",dl:"4s"}].map((c,i) => (
            <div key={i} className="absolute rounded-full" style={{ width:c.w, height:c.h, top:c.t, left:c.l, background:"rgba(191,219,254,0.06)", animation:`lar-float ${c.d} ease-in-out ${c.dl} infinite` }} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative" style={{ zIndex:1 }}>
          <div className="flex flex-col lg:flex-row gap-12 items-start">

            {/* ── Colonne gauche 52% ── */}
            <div className="lg:w-[52%] w-full" style={{ zIndex:1 }}>

              <div style={{ animation:"lar-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both" }}>
                <h1 style={{
                  fontSize: "clamp(40px,7vw,68px)",
                  fontWeight: 900,
                  letterSpacing: "0.01em",
                  lineHeight: 1.1,
                  marginBottom: 12,
                  color: C.primary,
                  background: "none",
                }}>
                  LARODEC
                </h1>
                <TypewriterSubtitle />
              </div>

              <div style={{ animation:"lar-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both", marginTop:20 }}>
                <p style={{ fontSize:15, lineHeight:1.75, color:"#4B5563", fontWeight:400, background:"none" }}>
                  Les actions de recherche menées au sein du Laboratoire de Recherche Opérationnelle, de Décision et de
                  Contrôle de processus couvrent un large spectre, incluant des aspects théoriques (modèles
                  formels, analyses axiomatiques, études de complexité), la représentation de problèmes complexes et la
                  production d'algorithmes pour leur résolution exacte ou approchée, ainsi que la conception de systèmes
                  intelligents et leur mise en œuvre au sein d'applications réelles.
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2" style={{ animation:"lar-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.25s both", marginTop:24 }}>
                <span style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:500, background:C.cardBg, color:C.textMain, border:`1px solid ${C.borderGray}` }}>
                  <MapPin size={12} style={{ color:C.primary, opacity:0.7 }} />Code: LR01ES02
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:500, background:C.cardBg, color:C.textMain, border:`1px solid ${C.borderGray}` }}>
                  <Building2 size={12} style={{ color:C.primary, opacity:0.7 }} />ISG · Université de Tunis
                </span>
                <button onClick={() => navigate("/public/researcher/Latifa%20Ben%20Arfa%20Rabai")}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, fontSize:12, fontWeight:600, background:C.lightBg, color:C.primary, border:`1px solid ${C.lightBdr}`, cursor:"pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#DBEAFE"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=C.lightBg; }}>
                  <User size={12} />Dir: Pr. Latifa Ben Arfa Rabai<ChevronRight size={12} />
                </button>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3" style={{ animation:"lar-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.35s both", marginTop:32 }}>
                <button onClick={() => navigate("/publications")}
                  style={{ padding:"12px 28px", borderRadius:10, fontSize:15, fontWeight:600, background:C.primary, color:C.white, border:"none", cursor:"pointer", boxShadow:"0 4px 12px rgba(26,115,232,0.3)", transition:"all 0.2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#1557B0"; (e.currentTarget as HTMLElement).style.boxShadow="0 6px 20px rgba(26,115,232,0.45)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background=C.primary; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 12px rgba(26,115,232,0.3)"; }}>
                  Nos Publications
                </button>
                <button onClick={() => navigate("/annuaire")}
                  style={{ padding:"12px 28px", borderRadius:10, fontSize:15, fontWeight:600, background:"transparent", color:C.primary, border:`1.5px solid ${C.primary}`, cursor:"pointer", transition:"all 0.2s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=C.lightBg; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}>
                  Notre Équipe
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── Bouton flottant PulsAR ── */}
      <button
        onClick={() => navigate("/radar")}
        className="fixed bottom-6 right-6 z-50 group"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1A73E8, #0EA5E9)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(26,115,232,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(26,115,232,0.6)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(26,115,232,0.4)";
        }}
      >
        <Radio size={24} color="white" />
        {/* Point pulsant vert */}
        <span
          className="absolute top-1 right-1"
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#22C55E",
            border: "2px solid white",
            animation: "pulse-green 1.5s ease-in-out infinite",
          }}
        />
        {/* Tooltip au hover */}
        <span
          className="absolute right-full mr-3 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            background: "#1E293B",
            color: "white",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            transition: "opacity 0.2s ease",
          }}
        >
          PulsAR — Veille Scientifique
          <span
            className="absolute right-0 top-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: "5px solid #1E293B",
              transform: "translate(5px, -50%)",
            }}
          />
        </span>
      </button>

      {/* ── Section Thématiques pleine largeur ── */}
      <section id="themes" className="py-16 px-6" style={{ background:C.pageBg, position:"relative" }}>
        {/* Second filigrane SVG */}
        <BackgroundLogo size={300} opacity={0.10} rotate={8} bottom={-60} left={-40} />
        
        <div className="max-w-7xl mx-auto" style={{ position:"relative", zIndex:1 }}>
          <div className="mb-12">
            <h2 style={{ fontSize:32, fontWeight:800, color:C.darkest, marginBottom:8, letterSpacing:"-0.02em" }}>Nos thématiques de recherche</h2>
            <p style={{ fontSize:15, color:C.textSec }}>Les axes scientifiques du laboratoire LARODEC</p>
            <div style={{ marginTop:14, height:3, width:56, borderRadius:99, background:`linear-gradient(90deg, ${C.primary}, #0891B2)` }} />
          </div>
          <div ref={axesRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AXES_RECHERCHE.map((axe, i) => {
              const Icon = axe.icon;
              return (
                <button key={axe.id} onClick={() => setSelectedAxe(axe)}
                  className="group text-left"
                  style={{
                    borderRadius:14, border:`1px solid ${highlightedAxe===axe.id?"#1A73E8":C.borderGray}`, borderTop:`3px solid ${C.primary}`,
                    boxShadow: highlightedAxe===axe.id ? "0 0 0 3px rgba(26,115,232,0.2), 0 8px 24px rgba(26,115,232,0.15)" : "0 2px 12px rgba(0,0,0,0.06)",
                    background:C.white, cursor:"pointer",
                    opacity:axesVisible?1:0, transform:axesVisible?"translateY(0)":"translateY(20px)",
                    transition:`opacity 0.5s ease-out ${i*80}ms, transform 0.5s ease-out ${i*80}ms, box-shadow 0.3s ease, border-color 0.3s ease`,
                    animation: highlightedAxe===axe.id ? "axe-pulse 0.5s ease-in-out 3" : "none",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow="0 8px 24px rgba(26,115,232,0.15)"; (e.currentTarget as HTMLElement).style.transform="translateY(-5px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow="0 2px 12px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.transform=axesVisible?"translateY(0)":"translateY(20px)"; }}>
                  <div className="p-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background:C.lightBg }}>
                      <Icon size={20} style={{ color:C.primary }} />
                    </div>
                    <h3 style={{ fontWeight:700, fontSize:14, marginBottom:4, lineHeight:"1.3", color:C.darkest }} className="line-clamp-2">{axe.titre}</h3>
                    <p style={{ fontSize:12, lineHeight:"1.5", color:"#6B7280" }} className="line-clamp-2">{axe.description}</p>
                    <p className="mt-3 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:C.primary }}>En savoir plus →</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Modal axe ── */}
      {selectedAxe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedAxe(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="text-white p-7 relative" style={{ background:`linear-gradient(135deg, ${C.darkest} 0%, ${C.primary} 100%)` }}>
              <button onClick={() => setSelectedAxe(null)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full" style={{ background:"rgba(255,255,255,0.2)" }}>
                <X size={16} />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(255,255,255,0.15)" }}>
                  <selectedAxe.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-bold mb-1" style={{ fontSize:22 }}>{selectedAxe.titre}</h2>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{selectedAxe.description}</p>
                </div>
              </div>
            </div>
            <div className="p-7 space-y-5">
              {[{ title:"Résumé", text:selectedAxe.resume, items:null },{ title:"Objectifs", text:null, items:selectedAxe.objectifs },{ title:"Applications", text:null, items:selectedAxe.applications }].map(block => (
                <div key={block.title} className="rounded-xl p-4" style={{ background:C.pageBg }}>
                  <h3 className="font-bold mb-2 pl-3" style={{ fontSize:14, color:C.dark, borderLeft:`3px solid ${C.primary}` }}>{block.title}</h3>
                  {block.text && <p style={{ color:"#374151", lineHeight:1.7, fontSize:14 }}>{block.text}</p>}
                  {block.items && <ul className="space-y-1">{block.items.map((it:string,i:number)=>(
                    <li key={i} className="flex items-start gap-2"><span className="mt-1 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background:C.lightBg, color:C.primary }}>✓</span><span style={{ color:"#374151", fontSize:13 }}>{it}</span></li>
                  ))}</ul>}
                </div>
              ))}
              <button onClick={() => setSelectedAxe(null)} className="w-full py-3 rounded-xl font-bold" style={{ background:C.cardBg, color:C.dark, border:"none", cursor:"pointer" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes lar-fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lar-float { 0%,100%{transform:translateY(0) translateX(0)} 33%{transform:translateY(-12px) translateX(8px)} 66%{transform:translateY(8px) translateX(-8px)} }
        @keyframes tw-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-green { 0%,100%{opacity:.75;transform:scale(1)} 50%{opacity:.25;transform:scale(1.5)} }
        @keyframes mega-in { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes axe-pulse { 0%,100%{box-shadow:0 0 0 3px rgba(26,115,232,0.25)} 50%{box-shadow:0 0 0 6px rgba(26,115,232,0.10)} }
        button:active { transform:scale(0.97); }
        button,-webkit-tap-highlight-color{-webkit-tap-highlight-color:transparent}
      `}</style>

      {/* ── Actualités ── */}
      <section id="actualites" ref={ref("actualites")} className="py-20 px-6" style={{ background:`linear-gradient(180deg, ${C.white} 0%, #F0F7FF 50%, ${C.white} 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <Calendar size={26} style={{ color:C.primary, flexShrink:0 }} />
              <h2 style={{ fontSize:32, fontWeight:800, color:C.darkest, letterSpacing:"-0.02em" }}>{t.events.title}</h2>
            </div>
            <p style={{ fontSize:15, color:C.textSec }}>{t.events.subtitle}</p>
            <div style={{ marginTop:14, height:3, width:56, borderRadius:99, background:`linear-gradient(90deg, ${C.primary}, #0891B2)` }} />
          </div>
          {events.length > 0 ? (
            <div className="space-y-8">
              <button onClick={() => navigate(`/evenement/${events[0].id}`)} className="group w-full text-left">
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ height:280 }}>
                  {events[0].url_photo ? <img src={events[0].url_photo} alt={events[0].titre} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background:`linear-gradient(135deg, ${C.darkest}, ${C.primary})` }} />}
                  <div className="absolute inset-0" style={{ background:"rgba(10,20,50,0.58)" }} />
                  <div className="relative p-6 md:p-8 text-white h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="inline-block px-3 py-1 mb-3 rounded-full text-white text-xs font-bold" style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)" }}>{t.events.featured}</div>
                        <h3 className="text-2xl font-bold leading-tight line-clamp-2">{events[0].titre}</h3>
                        <p className="text-white/80 text-sm mt-2 line-clamp-2">{events[0].description}</p>
                      </div>
                      <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-xl text-white font-bold text-center flex-shrink-0" style={{ background:C.primary }}>
                        {events[0].date_debut && (<><span className="text-xl font-black leading-none">{new Date(events[0].date_debut).getDate()}</span><span className="text-xs uppercase">{new Date(events[0].date_debut).toLocaleDateString("fr-FR",{month:"short"})}</span></>)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} style={{ color:"#93C5FD" }} />
                        {events[0].date_debut && <p className="text-white text-sm font-medium">{new Date(events[0].date_debut).toLocaleDateString(lang==="en"?"en-GB":"fr-FR",{weekday:"short",year:"numeric",month:"long",day:"numeric"})}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs" style={{ background:"rgba(255,255,255,0.85)", color:C.darkest }}>{t.events.more}<ChevronRight size={13} /></div>
                    </div>
                  </div>
                </div>
              </button>
              {events.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.slice(1, 3).map((event: any, i: number) => (
                    <button key={i} onClick={() => navigate(`/evenement/${event.id}`)}
                      className="group bg-white border overflow-hidden text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex"
                      style={{ borderRadius:14, borderColor:C.borderGray, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", border:`1px solid ${C.borderGray}` }}>
                      <div style={{ width:4, background:C.primary, flexShrink:0 }} />
                      <div className="p-4 flex-1">
                        <h4 className="font-semibold text-sm mb-1 leading-snug line-clamp-2" style={{ color:C.darkest }}>{event.titre}</h4>
                        {event.date_debut && <div className="flex items-center gap-1 mt-1"><Calendar size={11} style={{ color:C.primary }} /><span className="text-xs" style={{ color:C.primary }}>{new Date(event.date_debut).toLocaleDateString(lang==="en"?"en-GB":"fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span></div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center" style={{ border:`1px solid ${C.borderGray}` }}>
              <Calendar size={48} className="mx-auto mb-4" style={{ color:"#CBD5E1" }} />
              <p style={{ color:C.textSec }}>{t.events.empty}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={el => { statsRef.current = el; }} className="border-b py-16 px-6" style={{ background:`linear-gradient(180deg, ${C.pageBg} 0%, ${C.lightBg} 100%)`, borderColor:C.borderGray }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 style={{ fontSize:32, fontWeight:800, color:C.darkest, marginBottom:8, letterSpacing:"-0.02em" }}>{t.stats.title}</h2>
            <p style={{ fontSize:15, color:C.textSec }}>{t.stats.subtitle}</p>
            <div style={{ marginTop:14, height:3, width:56, borderRadius:99, background:`linear-gradient(90deg, ${C.primary}, #0891B2)` }} />
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${statCards.length===5?"lg:grid-cols-5":"lg:grid-cols-4"}`}>
            {statCards.map((s,i) => <StatCard key={i} {...s} visible={statsVisible} />)}
          </div>
        </div>
      </section>

      {/* ── Membres ── */}
      <section id="membres" ref={ref("membres")} className="py-16 px-6" style={{ background:C.pageBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 style={{ fontSize:32, fontWeight:800, color:C.darkest, marginBottom:8, letterSpacing:"-0.02em" }}>Équipe de recherche</h2>
            <p style={{ fontSize:15, color:C.textSec }}>Membres permanents, doctorants et post-doctorants</p>
            <div style={{ marginTop:14, height:3, width:56, borderRadius:99, background:`linear-gradient(90deg, ${C.primary}, #0891B2)` }} />
          </div>

          {/* Grille des membres mis en avant - 3×2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { nom:"Latifa Ben Arfa Rabai", grade:"Professeur", institution:"ISG Tunis", axe:"Aide à la décision", photo:true },
              { nom:"Zied Elouedi", grade:"Professeur", institution:"ISG Tunis", axe:"Modèles graphiques", photo:true },
              { nom:"Nahla Ben Amor", grade:"Professeur", institution:"ISG Tunis", axe:"Modèles graphiques", photo:true },
              { nom:"Boutheina Ben Yaghlane", grade:"Professeur", institution:"ISG Tunis", axe:"Web sémantique", photo:true },
              { nom:"Hend Bouziri", grade:"Maître de Conférences", institution:"ISG Tunis", axe:"Apprentissage automatique", photo:true },
              { nom:"Abir Smiti", grade:"Maître de Conférences", institution:"ISG Tunis", axe:"Apprentissage automatique", photo:true },
            ].map((membre, i) => {
              const initials = membre.nom.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
              return (
                <button key={i} onClick={() => navigate(`/public/researcher/${encodeURIComponent(membre.nom)}`)}
                  className="group relative text-center transition-all duration-300 hover:-translate-y-2"
                  style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <div className="bg-white rounded-2xl border p-6 shadow-sm hover:shadow-xl transition-all duration-300" style={{ borderColor:C.borderGray }}>
                    {/* Photo de profil */}
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ background:`linear-gradient(135deg, ${C.primary}, #0EA5E9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:22, fontWeight:800 }}>
                        {membre.photo ? (
                          <img src={`http://localhost:3001/api/public/researcher-photo/${encodeURIComponent(membre.nom)}`}
                            alt={membre.nom}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : initials}
                      </div>
                      {/* Badge de l'axe de recherche */}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background:C.primary, border:`2px solid ${C.white}` }}>
                        <Target size={12} color="white" />
                      </div>
                    </div>
                    {/* Nom */}
                    <h3 style={{ fontSize:15, fontWeight:700, color:C.darkest, marginBottom:4 }}>{membre.nom}</h3>
                    {/* Grade */}
                    <p style={{ fontSize:13, fontWeight:600, color:C.primary, marginBottom:2 }}>{membre.grade}</p>
                    {/* Institution */}
                    <p style={{ fontSize:12, color:C.textSec }}>{membre.institution}</p>
                    {/* Bouton hover */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span style={{ fontSize:12, fontWeight:600, color:C.primary }}>Voir le profil →</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bouton Voir tous les membres */}
          <div className="flex justify-center">
            <button onClick={() => navigate("/annuaire")}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{ fontSize:14, background:C.primary, color:C.white, border:"none", cursor:"pointer", boxShadow:"0 4px 12px rgba(26,115,232,0.3)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow="0 6px 20px rgba(26,115,232,0.45)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow="0 4px 12px rgba(26,115,232,0.3)"; }}>
              Voir tous les membres <ChevronRight size={16} />
            </button>
          </div>

          {/* Stats membres (conservées en dessous) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { label:t.members.conseilScientifique, val:memberStats["Corps A"]   || 17, icon:Award,         teamKey:"Corps A"   },
              { label:t.members.maitresAssistants,   val:memberStats["Corps B"]   || 36, icon:Users,         teamKey:"Corps B"   },
              { label:t.members.doctorants,          val:memberStats["Doctorant"] || 32, icon:GraduationCap, teamKey:"Doctorant" },
              { label:t.members.postDoc,             val:memberStats["Post-Doc"]  || 48, icon:TrendingUp,    teamKey:"Post-Doc"  },
            ].map((m,i) => {
              const Icon = m.icon;
              return (
                <button key={i} onClick={() => navigate(`/annuaire?categorie=${m.teamKey}`)} className="group relative text-left transition-all duration-300 hover:-translate-y-1" style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" style={{ background:"rgba(26,115,232,0.08)" }} />
                  <div className="relative bg-white rounded-2xl border p-8 shadow-sm hover:shadow-xl transition-all duration-300" style={{ borderColor:C.borderGray }}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ background:C.lightBg }}>
                      <Icon size={28} style={{ color:C.primary }} />
                    </div>
                    <p style={{ fontSize:48, fontWeight:700, color:C.dark, marginBottom:8, lineHeight:1 }}>{m.val}</p>
                    <p style={{ fontSize:13, fontWeight:600, color:C.textSec }}>{m.label}</p>
                    <div style={{ marginTop:16, height:4, width:32, borderRadius:99, background:C.primary, opacity:0 }} className="group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Partenaires / Liens ── */}
      <section id="liens" ref={ref("liens")} className="py-20 px-6" style={{ background:`linear-gradient(180deg, ${C.pageBg} 0%, ${C.white} 100%)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 style={{ fontSize:32, fontWeight:800, color:C.darkest, marginBottom:8, letterSpacing:"-0.02em" }}>Partenaires et Ressources</h2>
            <p style={{ fontSize:15, color:C.textSec }}>Collaborations nationales et internationales, ressources pour la recherche</p>
            <div style={{ marginTop:14, height:3, width:56, borderRadius:99, background:`linear-gradient(90deg, ${C.primary}, #0891B2)` }} />
          </div>
          <div className="flex gap-4 mb-10 border-b" style={{ borderColor:C.borderGray }}>
            {["partenaires","liens"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding:"12px 24px", fontWeight:700, fontSize:14, color:activeTab===tab?C.primary:C.textSec, background:"none", border:"none", borderBottom:activeTab===tab?`2px solid ${C.primary}`:"2px solid transparent", cursor:"pointer", transition:"color 150ms, border-color 150ms" }}>
                {tab==="partenaires"?"Partenaires":"Liens Utiles"}
              </button>
            ))}
          </div>
          {activeTab==="partenaires" && (
            <div>
              <p style={{ fontSize:15, lineHeight:"1.7", color:C.textSec, marginBottom:24 }}>
                Le LARODEC entretient des partenariats avec des laboratoires et organismes internationaux (projets, thèses cotutelles, conventions) :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map((p,i) => (
                  <div key={i} className="group flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl transition-all duration-300" style={{ border:`1px solid ${C.borderGray}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=C.primary; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(26,115,232,0.12)"; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=C.borderGray; (e.currentTarget as HTMLElement).style.boxShadow="none"; (e.currentTarget as HTMLElement).style.transform="none"; }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:C.lightBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:800, color:C.primary, letterSpacing:"0.02em" }}>
                      {getInitials(p)}
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:C.dark, lineHeight:1.3 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab==="liens" && (
            <div className="space-y-3">
              {LIENS_UTILES.map((lien,i) => (
                <a key={i} href={lien.url} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-5 bg-white rounded-2xl transition-all duration-300"
                  style={{ border:`1px solid ${C.borderGray}`, textDecoration:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=C.primary; (e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(26,115,232,0.12)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=C.borderGray; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background:C.lightBg }}>
                    <ExternalLink size={20} style={{ color:C.primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontWeight:700, fontSize:14, marginBottom:3, color:C.dark }} className="group-hover:underline">{lien.titre}</h3>
                    <p style={{ fontSize:12, color:C.textSec, marginBottom:4 }}>{lien.description}</p>
                    <p style={{ fontSize:11, color:"#94A3B8" }} className="truncate">{lien.url}</p>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:C.primary }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" ref={ref("contact")} className="py-16 px-6" style={{ background:C.white }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 style={{ fontSize:28, fontWeight:800, color:C.darkest, marginBottom:4, letterSpacing:"-0.02em" }}>Contact et Accès</h2>
            <p style={{ fontSize:14, color:C.textSec, marginBottom:12 }}>Rejoignez la communauté scientifique LARODEC</p>
            <div style={{ height:3, width:40, borderRadius:99, background:C.primary }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border:`1px solid ${C.borderGray}`, borderLeft:`4px solid ${C.primary}` }}>
              <div className="p-7 space-y-5">
                <h3 style={{ fontWeight:700, fontSize:17, color:C.dark, marginBottom:16 }}>Coordonnées</h3>
                {[
                  { icon:MapPin, label:"Adresse",   value:"41 rue de la Liberté, 2000 Le Bardo, Tunisie", href:"https://maps.google.com/?q=41+rue+de+la+Liberté,+2000+Le+Bardo,+Tunisie" },
                  { icon:Mail,   label:"Email",     value:"contact@larodec.rnu.tn",                        href:"mailto:contact@larodec.rnu.tn" },
                  { icon:Phone,  label:"Téléphone", value:"(+216) 71 588 514",                             href:"tel:+21671588514" },
                  { icon:Clock,  label:"Horaires",  value:"Lundi – Vendredi, 8h00 – 17h00",               href:null },
                ].map(({ icon:Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:C.lightBg }}>
                      <Icon size={15} style={{ color:C.primary }} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:600, color:"#9ca3af", marginBottom:1 }}>{label}</p>
                      {href ? <a href={href} target={href.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" style={{ fontSize:13, fontWeight:500, color:C.dark }} className="hover:underline">{value}</a>
                            : <p style={{ fontSize:13, fontWeight:500, color:C.dark }}>{value}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-8 text-white shadow-lg flex flex-col justify-between" style={{ background:`linear-gradient(135deg, ${C.darkest} 0%, ${C.primary} 100%)`, minHeight:260 }}>
              <div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background:"rgba(255,255,255,0.15)" }}>
                  <GraduationCap size={24} />
                </div>
                <h3 style={{ fontWeight:800, fontSize:20, marginBottom:10 }}>Accéder au portail</h3>
                <p style={{ color:"#BFDBFE", fontSize:13, lineHeight:"1.6", marginBottom:20 }}>
                  Gérez vos publications, consultez les activités du laboratoire et collaborez avec l'équipe de recherche.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button onClick={() => navigate("/login")} style={{ flex:1, padding:"10px", borderRadius:999, fontSize:13, fontWeight:700, background:C.white, color:C.primary, border:"none", cursor:"pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="none"; }}>
                    {t.nav.connexion}
                  </button>
                  <button onClick={() => navigate("/login?register=true")} style={{ flex:1, padding:"10px", borderRadius:999, fontSize:13, fontWeight:700, background:"#1557B0", color:C.white, border:"1px solid rgba(255,255,255,0.3)", cursor:"pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="none"; }}>
                    {t.nav.inscription}
                  </button>
                </div>
                <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.4)" }}>ou connectez-vous avec votre compte institutionnel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background:"#0F1E3C", color:"#9CA3AF", padding:"48px 24px" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:30, height:30, flexShrink:0 }}>
                  <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5"/>
                  <circle cx="20" cy="20" r="8"  stroke="white" strokeWidth="2"/>
                  <circle cx="20" cy="20" r="3"  fill="white"/>
                  <line x1="24" y1="20" x2="34" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="30" y1="16" x2="34" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="30" y1="24" x2="34" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span style={{ fontWeight:900, color:"white", fontSize:14 }}>LARODEC</span>
              </div>
              <p style={{ fontSize:12, color:"#6B7280", lineHeight:"1.6" }}>Laboratoire de Recherche Opérationnelle, de Décision et de Contrôle de Processus — ISG Tunis</p>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>Navigation</p>
              <div className="space-y-2">
                {[...NAV_ITEMS, { id:"themes", label:"Thèmes de recherche" }].map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.id === "themes" ? "laboratoire" : item.id)}
                    style={{ display:"block", fontSize:13, color:"#6B7280", background:"none", border:"none", cursor:"pointer", padding:0, textAlign:"left" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="white"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="#6B7280"; }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>Contact rapide</p>
              <div className="space-y-3">
                <a href="mailto:contact@larodec.rnu.tn" style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#6B7280", textDecoration:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="#6B7280"; }}>
                  <Mail size={14} style={{ flexShrink:0 }} />contact@larodec.rnu.tn
                </a>
                <a href="tel:+21671588514" style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#6B7280", textDecoration:"none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="#6B7280"; }}>
                  <Phone size={14} style={{ flexShrink:0 }} />(+216) 71 588 514
                </a>
              </div>
            </div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:24, display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <p style={{ fontSize:12, color:"#4B5563" }}>© {new Date().getFullYear()} LARODEC — Université de Tunis · ISG</p>
            <div style={{ display:"flex", gap:16, fontSize:12, color:"#4B5563" }}>
              <a href="#" style={{ textDecoration:"none", color:"inherit" }}>Mentions légales</a>
              <a href="#" style={{ textDecoration:"none", color:"inherit" }}>Politique de confidentialité</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
