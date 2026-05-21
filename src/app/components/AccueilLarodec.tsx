import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Users, BookOpen, Globe, Award, TrendingUp, Target, Lightbulb,
  LogIn, UserPlus, ChevronRight, Mail, Phone, MapPin,
  GraduationCap, Handshake, Menu, X, ExternalLink, Calendar,
} from "lucide-react";
import { AxeRecherche } from "./AxeRecherche";
import logoLarodec from "../../imports/image-1.png";
import drapeau from "../../imports/drapeau.png";
import isg from "../../imports/isg.png";

const NAV_ITEMS = [
  { id: "laboratoire", label: "Laboratoire" },
  { id: "actualites", label: "Actualités" },
  { id: "membres",     label: "Membres"     },
  { id: "recherche",   label: "Recherche"   },
  { id: "liens",       label: "Liens"       },
  { id: "contact",     label: "Contact"     },
];

const LIENS_UTILES = [
  {
    titre: "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique",
    description: "Portail officiel du ministère tunisien de l'enseignement supérieur",
    url: "http://www.mes.tn/"
  },
  {
    titre: "Thomson Reuters Impact Factor",
    description: "Facteur d'impact et métriques de citation des revues scientifiques",
    url: "http://wokinfo.com/essays/impact-factor/"
  },
  {
    titre: "Ressources électroniques pour les chercheurs (CNUDST)",
    description: "Accès aux ressources numériques et bases de données scientifiques",
    url: "http://www.cnudst.rnrt.tn/"
  },
  {
    titre: "Centre National Universitaire de Documentation Scientifique et Technique",
    description: "Centre de documentation et d'information scientifique tunisien",
    url: "http://www.cnudst.rnrt.tn/"
  },
  {
    titre: "Moteur de recherche des thèses de doctorat en Tunisie",
    description: "Plateforme de recherche et consultation des thèses tunisiennes",
    url: "http://www.theses-tn.net/"
  },
  {
    titre: "Appels d'offres de projets de recherche",
    description: "Annonces et appels d'offres pour les projets de recherche",
    url: "http://www.mes.tn/evenement_video.php?code_menu=113&code_menu_parent=28"
  },
  {
    titre: "Université Virtuelle de Tunis (UVT)",
    description: "Plateforme d'enseignement et de formation en ligne",
    url: "http://www.uvt.rnu.tn/uvt/"
  },
  {
    titre: "Agence Nationale de Promotion de la Recherche Scientifique (ANPR)",
    description: "Agence de promotion et financement de la recherche scientifique",
    url: "http://www.anpr.tn/index.php?id=12"
  },
  {
    titre: "Belief Functions and Applications Society",
    description: "Société internationale pour les fonctions de croyance et applications",
    url: "http://www.bfasociety.org/"
  }
];

function getPartners(convs: any[]): string[] {
  const def = ["Universite Paris-Saclay","Universite de Sousse","Universite de Helwan","Universite de Madeira","Institut Pasteur","Faculte de Medecine de Tunis"];
  if (!convs || convs.length === 0) return def;
  const r: string[] = [];
  convs.forEach((c: any) => {
    String(c.partenaire || "").split(",").forEach((p: string) => {
      const t = p.trim();
      if (t && !r.includes(t)) r.push(t);
    });
  });
  return r.length > 0 ? r : def;
}

function ContactCard() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 text-left group"
      >
        <h3 className="font-bold text-gray-900 text-lg mb-6">Coordonnees</h3>
        <div className="space-y-5">
          {[
            { icon: MapPin, text: "Institut Superieur de Gestion de Tunis", label: "Localisation" },
            { icon: Mail,   text: "contact@larodec.rnu.tn", label: "Email" },
            { icon: Phone,  text: "+216 71 588 514",        label: "Telephone" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="flex items-start gap-4 group/item">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:bg-blue-500 transition-colors">
                  <Icon className="w-5 h-5 text-blue-600 group-hover/item:text-white transition-colors" />
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-xs text-gray-500 font-semibold mb-1">{c.label}</p>
                  <p className="text-gray-700 text-sm font-medium group-hover/item:text-blue-600 transition-colors">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-2 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Voir tous les details</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Modal détails */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-8 relative">
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold mb-2">Localisation & Contact</h2>
              <p className="text-white/90">Institut Superieur de Gestion de Tunis</p>
            </div>

            {/* Contenu */}
            <div className="p-8 space-y-8">
              {/* Adresse */}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Adresse</p>
                    <p className="text-gray-900 font-bold text-lg">41 rue de la Liberté</p>
                    <p className="text-gray-700 text-lg">2000 Le Bardo, Tunisie</p>
                  </div>
                </div>
              </div>

              {/* Téléphone */}
              <div className="flex items-start gap-4 pb-8 border-b border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Telephone</p>
                  <p className="text-gray-900 font-bold text-lg mb-1">(+216) 71 588 514</p>
                  <p className="text-gray-600 text-sm">Fax: (+216) 71 588 487</p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</p>
                <div className="space-y-2">
                  <a href="mailto:contact@larodec.rnu.tn" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all group/email">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-900 font-semibold group-hover/email:text-blue-600 transition-colors">contact@larodec.rnu.tn</span>
                  </a>
                  <a href="mailto:directeur@larodec.rnu.tn" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all group/email">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-900 font-semibold group-hover/email:text-blue-600 transition-colors">directeur@larodec.rnu.tn</span>
                  </a>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Fermer
                </button>
                <a
                  href="https://maps.google.com/?q=41+rue+de+la+Liberté,+2000+Le+Bardo,+Tunisie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-lg transition-all text-center"
                >
                  Voir sur Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AccueilLarodec() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("laboratoire");
  const [menuOpen, setMenuOpen]           = useState(false);
  const [activeTab, setActiveTab]         = useState("partenaires");
  const [stats, setStats]                 = useState<any>({ chercheurs: 53, publications: 881, conventions: 2 });
  const [conventions, setConventions]     = useState<any[]>([]);
  const [events, setEvents]               = useState<any[]>([]);
  const [memberStats, setMemberStats]     = useState<any>({ "Corps A": 17, "Corps B": 36, "Doctorant": 32, "Post-Doc": 48 });
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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
      if (ev.status === "fulfilled" && Array.isArray(ev.value)) setEvents(ev.value);
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

  const scrollTo = (id: string) => {
    if (id === "recherche") {
      navigate("/publications");
      return;
    }
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };
  const partners = getPartners(conventions);
  const ref = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Bandeau institutionnel tunisien ── */}
      <div className="relative border-b border-gray-200 py-2 px-6 flex items-center justify-between text-xs overflow-hidden" style={{ minHeight: 44 }}>
        {/* Drapeau tunisien en arrière-plan, très discret */}
        <div
          className="absolute inset-0 opacity-[0.06] bg-no-repeat bg-center bg-contain pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Crect width='900' height='600' fill='%23E70013'/%3E%3Ccircle cx='450' cy='300' r='160' fill='white'/%3E%3Ccircle cx='480' cy='300' r='128' fill='%23E70013'/%3E%3Ccircle cx='440' cy='268' r='80' fill='white'/%3E%3Ccircle cx='464' cy='268' r='64' fill='%23E70013'/%3E%3Cpolygon points='490,220 500,250 530,250 507,267 516,298 490,280 464,298 473,267 450,250 480,250' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: "120px",
            backgroundRepeat: "repeat-x",
          }}
        />
        {/* Fond blanc légèrement teinté */}
        <div className="absolute inset-0 bg-white/95 pointer-events-none" />

        {/* Contenu texte en noir */}
        <div className="relative flex items-center gap-3">
          {/* Drapeau tunisien */}
          <img src={drapeau} alt="Drapeau Tunisie" className="h-8 object-contain" />
          <span className="font-semibold text-gray-800 hidden md:block">
            REPUBLIQUE TUNISIENNE &nbsp;·&nbsp; MINISTERE DE L'ENSEIGNEMENT SUPERIEUR &nbsp;·&nbsp; UNIVERSITE DE TUNIS
          </span>
          <span className="font-semibold text-gray-800 md:hidden">Rep. Tunisienne · Univ. de Tunis</span>
        </div>
        <div className="relative flex items-center gap-2 ml-auto">
          <img src={isg} alt="ISG Logo" className="h-8 object-contain" />
          <span className="font-semibold text-gray-800 hidden md:block text-sm">INSTITUT SUPERIEUR DE GESTION DE TUNIS</span>
        </div>
      </div>

      {/* ── Navigation — bleu ciel sobre ── */}
      <nav className="sticky top-0 z-50 shadow-sm border-b border-sky-200" style={{ background: "#e0f2fe" }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center">

          {/* Liens desktop */}
          <div className="hidden md:flex items-center">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-5 py-3.5 text-sm font-semibold transition-all ${
                  activeSection === item.id
                    ? "text-sky-800 border-b-2 border-sky-700 bg-sky-100"
                    : "text-sky-700 hover:text-sky-900 hover:bg-sky-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Burger mobile */}
          <button className="md:hidden ml-auto p-3 text-sky-700" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Boutons auth */}
          <div className="hidden md:flex items-center gap-2 ml-auto pl-4 border-l border-sky-300">
            <span className="text-xs font-semibold text-sky-700 mr-2">Espace Membre</span>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-sky-700 hover:text-sky-900 hover:bg-sky-100 rounded-lg transition-all font-medium"
            >
              <LogIn className="w-4 h-4" /> Connexion
            </button>
            <button
              onClick={() => navigate("/login?register=true")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition-all font-semibold shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Inscription
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-sky-200 bg-sky-50">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="w-full text-left px-6 py-3 text-sm text-sky-800 hover:bg-sky-100 font-medium"
              >
                {item.label}
              </button>
            ))}
            <div className="flex gap-2 px-4 py-3 border-t border-sky-200">
              <button onClick={() => navigate("/login")} className="flex-1 py-2 text-sm text-center text-sky-700 hover:bg-sky-100 rounded-lg font-medium">Connexion</button>
              <button onClick={() => navigate("/login?register=true")} className="flex-1 py-2 text-sm text-center bg-sky-700 text-white rounded-lg font-semibold">Inscription</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero / Laboratoire — sans carte "Excellence" ── */}
      <section id="laboratoire" ref={ref("laboratoire")}
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 right-32 w-96 h-96 bg-blue-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-cyan-200 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative">
          {/* Texte centré puisqu'on retire la carte de droite */}
          <div className="max-w-3xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  LARODEC
                </h1>
                <p className="text-lg font-semibold text-gray-700">Laboratoire de Recherche</p>
              </div>
            </div>
            <p className="text-gray-600 text-xl leading-relaxed mb-4">
              Recherche Operationnelle, Aide a la Decision et Processus de Controle
            </p>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-2xl">
              Unite de recherche de reference affiliee a l Institut Superieur de Gestion de Tunis (ISG),
              Universite de Tunis. Nos travaux couvrent la recherche operationnelle, l aide a la decision
              multicritere et le controle de processus.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Code: LR01ES02", "ISG · Universite de Tunis", "Dir: Pr. Latifa Ben Arfa Rabai"].map(tag => (
                <span key={tag} className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Actualités ── */}
      <section id="actualites" ref={ref("actualites")} className="py-20 px-6 bg-gradient-to-b from-white via-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h2 className="text-4xl font-bold text-gray-900">Actualités</h2>
            </div>
            <p className="text-gray-600 text-lg">Événements et actualités du laboratoire</p>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
          </div>

          {events.length > 0 ? (
            <div className="space-y-8">
              {/* Featured Event */}
              {events.length > 0 && (
                <button
                  onClick={() => navigate(`/evenement/${events[0].id}`)}
                  className="group w-full text-left"
                >
                  <div className="relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Background with image or gradient */}
                    {events[0].url_photo ? (
                      <img 
                        src={events[0].url_photo}
                        alt={events[0].titre}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          filter: 'brightness(1.1) contrast(1.15) saturate(1.1) blur(0px)',
                          WebkitFontSmoothing: 'antialiased',
                          backfaceVisibility: 'hidden',
                        }}
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600" />
                    )}
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/50" />
                    
                    {/* Content */}
                    <div className="relative p-8 md:p-12 text-white">
                      <div className="flex items-start justify-between gap-6 mb-6">
                        <div className="flex-1">
                          <div className="inline-block px-4 py-2 bg-white/30 backdrop-blur-md rounded-full mb-4">
                            <span className="text-sm font-bold text-white drop-shadow-lg">Événement à la une</span>
                          </div>
                          <h3 className="text-3xl md:text-4xl font-bold mb-3 leading-tight group-hover:text-white transition-colors drop-shadow-lg">
                            {events[0].titre}
                          </h3>
                          <p className="text-white text-lg leading-relaxed max-w-2xl line-clamp-3 drop-shadow-md font-medium">
                            {events[0].description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 hidden md:block">
                          <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Calendar className="w-12 h-12 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Date and CTA */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-white/30">
                        <div>
                          {events[0].date_debut && (
                            <p className="text-white text-sm font-semibold mb-1 drop-shadow-md">Date</p>
                          )}
                          {events[0].date_debut && (
                            <p className="text-white font-bold text-lg drop-shadow-lg">
                              {new Date(events[0].date_debut).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-white font-bold group-hover:gap-4 transition-all drop-shadow-lg">
                          <span>Savoir plus</span>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Other Events Grid */}
              {events.length > 1 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Autres événements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.slice(1, 7).map((event: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => navigate(`/evenement/${event.id}`)}
                        className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
                      >
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3" />
                        <div className="p-6">
                          <div className="flex items-start gap-3 mb-3">
                            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-base mb-1 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                {event.titre}
                              </h4>
                              {event.date_debut && (
                                <p className="text-xs text-gray-500 font-medium">
                                  {new Date(event.date_debut).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Détails</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun événement pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gradient-to-b from-white via-blue-50 to-cyan-50 border-b border-gray-100 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">LARODEC en chiffres</h2>
            <p className="text-gray-600 text-lg">Nos accomplissements et notre impact scientifique</p>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users,         val: stats.chercheurs    || 53,  label: "Chercheurs",   color: "from-blue-600 to-blue-400",   icon_bg: "bg-blue-100",   icon_color: "text-blue-600"   },
              { icon: BookOpen,      val: stats.publications  || 881, label: "Publications", color: "from-emerald-600 to-emerald-400",icon_bg: "bg-emerald-100", icon_color: "text-emerald-600"},
              { icon: GraduationCap, val: memberStats["Doctorant"] || 32, label: "Doctorants", color: "from-purple-600 to-purple-400",icon_bg: "bg-purple-100", icon_color: "text-purple-600" },
              { icon: Handshake,     val: stats.conventions   || 2,   label: "Conventions",  color: "from-orange-600 to-orange-400", icon_bg: "bg-orange-100", icon_color: "text-orange-600" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="group relative">
                  <div className={`absolute inset-0 bg-gradient-to-r ${s.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl`} />
                  <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className={`w-14 h-14 ${s.icon_bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${s.icon_color}`} />
                    </div>
                    <p className={`text-5xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-2`}>{s.val}</p>
                    <p className="text-sm text-gray-600 font-semibold">{s.label}</p>
                    <div className={`mt-4 h-1 w-8 bg-gradient-to-r ${s.color} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Membres ── */}
      <section id="membres" ref={ref("membres")} className="py-16 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Equipe de recherche</h2>
            <p className="text-gray-600 text-lg">Membres permanents, doctorants et post-doctorants</p>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Conseil Scientifique",  val: memberStats["Corps A"]   || 17, icon: Award,          teamKey: "Corps A" },
              { label: "Maitres Assistants",    val: memberStats["Corps B"]   || 36, icon: Users,          teamKey: "Corps B" },
              { label: "Doctorants",            val: memberStats["Doctorant"] || 32, icon: GraduationCap,  teamKey: "Doctorant" },
              { label: "Post-Doctorants",       val: memberStats["Post-Doc"]  || 48, icon: TrendingUp,     teamKey: "Post-Doc" },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(`/annuaire?categorie=${m.teamKey}`)}
                  className="group relative text-left transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl" />
                  <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-2">{m.val}</p>
                    <p className="text-sm text-gray-600 font-semibold">{m.label}</p>
                    <div className="mt-4 h-1 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Recherche ── */}
      <AxeRecherche />

      {/* ── Partenaires / Liens ── */}
      <section id="liens" ref={ref("liens")} className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Partenaires et Ressources</h2>
            <p className="text-gray-600 text-lg">Collaborations nationales et internationales, ressources pour la recherche</p>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-12 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("partenaires")}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === "partenaires"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Partenaires
            </button>
            <button
              onClick={() => setActiveTab("liens")}
              className={`px-6 py-3 font-bold transition-all ${
                activeTab === "liens"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Liens Utiles
            </button>
          </div>

          {/* Partenaires */}
          {activeTab === "partenaires" && (
            <div className="space-y-6">
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Le LARODEC a plusieurs partenaires (laboratoires et organismes internationaux) avec lesquels des relations de collaboration régulières ont déjà été établies (projets, thèses cotutelles, conventions etc.):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map((p, i) => (
                  <div key={i} className="group flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liens Utiles */}
          {activeTab === "liens" && (
            <div className="space-y-4">
              {LIENS_UTILES.map((lien, i) => (
                <a
                  key={i}
                  href={lien.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-base mb-1">
                      {lien.titre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{lien.description}</p>
                    <p className="text-xs text-gray-500 truncate">{lien.url}</p>
                  </div>
                  <div className="flex-shrink-0 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" ref={ref("contact")} className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Contact et Accès</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Carte de contact interactive */}
            <ContactCard />

            {/* Accès au portail */}
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 text-white shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-2xl mb-3">Acceder au portail</h3>
                <p className="text-blue-100 text-base leading-relaxed mb-8">
                  Gerez vos publications, consultez les activites du laboratoire et collaborez avec l equipe de recherche.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate("/login")}
                  className="flex-1 py-3 bg-white text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all duration-300">
                  Se connecter
                </button>
                <button onClick={() => navigate("/login?register=true")}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-400 transition-all duration-300 border border-blue-400">
                  S inscrire
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300 py-8 px-6 border-t border-gray-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center gap-3">
              <img src={logoLarodec} alt="LARODEC" className="h-10 object-contain opacity-90" />
              <div>
                <p className="text-sm font-bold text-white">LARODEC</p>
                <p className="text-xs text-gray-400">ISG Tunis · Universite de Tunis</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className="text-gray-400 hover:text-white transition-colors font-medium">
                  {item.label}
                </button>
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Copyright {new Date().getFullYear()} LARODEC</p>
              <p className="text-xs text-gray-500 mt-1">Tous droits reserves</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">Universite de Tunis · Institut Superieur de Gestion</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Politique de confidentialite</a>
              <span className="text-gray-600">•</span>
              <a href="#" className="hover:text-white transition-colors">Conditions d utilisation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
