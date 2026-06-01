export type Lang = "fr" | "en";

export const translations = {
  fr: {
    nav: {
      laboratoire: "Laboratoire",
      actualites: "Actualités",
      membres: "Membres",
      recherche: "Recherche",
      liens: "Liens",
      contact: "Contact",
      connexion: "Connexion",
      inscription: "Inscription",
      espaceMembers: "Espace Membre",
    },
    hero: {
      subtitle: "Laboratoire de Recherche",
      tagline: "Recherche Operationnelle, Aide a la Decision et Processus de Controle",
      description: "Unite de recherche de reference affiliee a l Institut Superieur de Gestion de Tunis (ISG), Universite de Tunis. Nos travaux couvrent la recherche operationnelle, l aide a la decision multicritere et le controle de processus.",
    },
    stats: {
      title: "LARODEC en chiffres",
      subtitle: "Nos accomplissements et notre impact scientifique",
      chercheurs: "Chercheurs",
      publications: "Publications",
      doctorants: "Doctorants",
      conventions: "Conventions",
      projets: "Projets de recherche",
    },
    events: {
      title: "Actualités",
      subtitle: "Événements et actualités du laboratoire",
      featured: "Événement à la une",
      others: "Autres événements",
      empty: "Aucun événement pour le moment",
      date: "Date",
      more: "Savoir plus",
      details: "Détails",
    },
    members: {
      title: "Equipe de recherche",
      subtitle: "Membres permanents, doctorants et post-doctorants",
      conseilScientifique: "Conseil Scientifique",
      maitresAssistants: "Maitres Assistants",
      doctorants: "Doctorants",
      postDoc: "Post-Doctorants",
    },
    eventDetail: {
      about: "À propos de cet événement",
      practical: "Informations pratiques",
      lieu: "LIEU",
      details: "Détails",
      date: "DATE",
      heure: "HEURE",
      confirmed: "Événement confirmé",
      officialSite: "Site officiel",
      back: "Retour",
      like: "Aimer",
      liked: "Aimé",
      share: "Partager",
    },
  },
  en: {
    nav: {
      laboratoire: "Laboratory",
      actualites: "News",
      membres: "Members",
      recherche: "Research",
      liens: "Links",
      contact: "Contact",
      connexion: "Login",
      inscription: "Register",
      espaceMembers: "Member Area",
    },
    hero: {
      subtitle: "Research Laboratory",
      tagline: "Operational Research, Decision Aid and Control Processes",
      description: "A reference research unit affiliated with the Institut Superieur de Gestion de Tunis (ISG), University of Tunis. Our work covers operational research, multi-criteria decision aid and process control.",
    },
    stats: {
      title: "LARODEC in numbers",
      subtitle: "Our achievements and scientific impact",
      chercheurs: "Researchers",
      publications: "Publications",
      doctorants: "PhD Students",
      conventions: "Conventions",
      projets: "Research Projects",
    },
    events: {
      title: "News",
      subtitle: "Events and news from the laboratory",
      featured: "Featured Event",
      others: "Other events",
      empty: "No events at the moment",
      date: "Date",
      more: "Learn more",
      details: "Details",
    },
    members: {
      title: "Research Team",
      subtitle: "Permanent members, PhD students and post-docs",
      conseilScientifique: "Scientific Council",
      maitresAssistants: "Assistant Professors",
      doctorants: "PhD Students",
      postDoc: "Post-Doctoral",
    },
    eventDetail: {
      about: "About this event",
      practical: "Practical information",
      lieu: "VENUE",
      details: "Details",
      date: "DATE",
      heure: "TIME",
      confirmed: "Event confirmed",
      officialSite: "Official website",
      back: "Back",
      like: "Like",
      liked: "Liked",
      share: "Share",
    },
  },
} as const;

export function useLang(): [Lang, (l: Lang) => void] {
  const stored = (typeof window !== "undefined" ? localStorage.getItem("larodec_lang") : null) as Lang | null;
  const current: Lang = stored === "en" ? "en" : "fr";
  const setLang = (l: Lang) => {
    localStorage.setItem("larodec_lang", l);
    window.dispatchEvent(new Event("larodec_lang_change"));
  };
  return [current, setLang];
}
