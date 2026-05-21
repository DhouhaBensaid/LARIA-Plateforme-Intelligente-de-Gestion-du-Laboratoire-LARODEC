import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { AccueilLarodec } from "./components/AccueilLarodec";
import { ProfilPublic } from "./components/ProfilPublic";
import { AnnuaireMembres } from "./components/AnnuaireMembres";
import { AdminDashboard } from "./components/AdminDashboard";
import { DashboardChercheur } from "./components/DashboardChercheur";
import { GestionChercheurs } from "./components/GestionChercheurs";
import { GestionPublications } from "./components/GestionPublications";
import { GestionOuvrages } from "./components/GestionOuvrages";
import { GestionTheses } from "./components/GestionTheses";
import { ProfilChercheur } from "./components/ProfilChercheur";
import { GestionEvenements } from "./components/GestionEvenements";
import { GestionConventions } from "./components/GestionConventions";
import { RapportAnnuel } from "./components/RapportAnnuel";
import { InfoLaboratoire } from "./components/InfoLaboratoire";
import { MesContributions } from "./components/MesContributions";
import { ScraperPublications } from "./components/ScraperPublications";
import { MesTheses } from "./components/MesTheses";
import { EvenementDetail } from "./components/EvenementDetail";
import { PublicationsPage } from "./components/PublicationsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AccueilLarodec,
  },
  {
    path: "/annuaire",
    Component: AnnuaireMembres,
  },
  {
    path: "/publications",
    Component: PublicationsPage,
  },
  {
    path: "/public/researcher/:nomPrenom",
    Component: ProfilPublic,
  },
  {
    path: "/evenement/:id",
    Component: EvenementDetail,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/admin",
    Component: Layout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "laboratoire", Component: InfoLaboratoire },
      { path: "chercheurs", Component: GestionChercheurs },
      { path: "publications", Component: GestionPublications },
      { path: "ouvrages", Component: GestionOuvrages },
      { path: "theses", Component: GestionTheses },
      { path: "evenements", Component: GestionEvenements },
      { path: "conventions", Component: GestionConventions },
      { path: "rapport", Component: RapportAnnuel },
      { path: "scraper", Component: ScraperPublications },
    ],
  },
  {
    path: "/chercheur",
    Component: Layout,
    children: [
      { index: true, Component: DashboardChercheur },
      { path: "contributions", Component: MesContributions },
      { path: "publications", Component: GestionPublications },
      { path: "theses", Component: MesTheses },
      { path: "evenements", Component: GestionEvenements },
      { path: "profil", Component: ProfilChercheur },
    ],
  },
]);