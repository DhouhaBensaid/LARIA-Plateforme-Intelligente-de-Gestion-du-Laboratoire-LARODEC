import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Target, Lightbulb, TrendingUp, Globe, Award, BookOpen, ChevronRight, X } from "lucide-react";

const AXES_RECHERCHE = [
  {
    id: 1,
    titre: "Aide à la décision et théorie de jeux",
    icon: Target,
    description: "Modèles formels, analyses axiomatiques et aide à la décision",
    resume: "Cet axe couvre les fondements théoriques de l'aide à la décision multicritère et la théorie des jeux appliquée aux problèmes complexes.",
    objectifs: [
      "Développement de méthodes d'aide à la décision multicritère",
      "Application de la théorie des jeux aux problèmes industriels",
      "Modélisation formelle des processus de décision",
      "Analyse axiomatique des systèmes de préférences"
    ],
    applications: [
      "Optimisation des stratégies d'entreprise",
      "Résolution de conflits multi-acteurs",
      "Aide à la décision en gestion de projets",
      "Analyse de risques stratégiques"
    ],
    color: "from-blue-600 to-blue-400"
  },
  {
    id: 2,
    titre: "Gestion de l'incertitude et modèles graphiques",
    icon: Lightbulb,
    description: "Représentation de problèmes complexes sous incertitude",
    resume: "Développement de modèles graphiques probabilistes pour la représentation et le traitement de l'incertitude dans les systèmes complexes.",
    objectifs: [
      "Modélisation graphique probabiliste",
      "Inférence bayésienne avancée",
      "Traitement de l'incertitude épistémique",
      "Représentation de connaissances incertaines"
    ],
    applications: [
      "Diagnostic de systèmes complexes",
      "Prédiction sous incertitude",
      "Systèmes d'aide à la décision robustes",
      "Analyse de fiabilité"
    ],
    color: "from-yellow-600 to-yellow-400"
  },
  {
    id: 3,
    titre: "Apprentissage automatique de données complexes",
    icon: TrendingUp,
    description: "Systèmes d'apprentissage et data science",
    resume: "Développement d'algorithmes d'apprentissage automatique pour l'analyse de données complexes et la découverte de patterns.",
    objectifs: [
      "Apprentissage profond et réseaux de neurones",
      "Apprentissage non supervisé et clustering",
      "Traitement du big data",
      "Extraction de connaissances"
    ],
    applications: [
      "Classification et prédiction",
      "Analyse de données massives",
      "Reconnaissance de patterns",
      "Systèmes de recommandation"
    ],
    color: "from-green-600 to-green-400"
  },
  {
    id: 4,
    titre: "Logistique et production, management qualité",
    icon: Globe,
    description: "Sûreté de fonctionnement et optimisation",
    resume: "Application des techniques mathématiques à la gestion industrielle, contrôle des procédés et amélioration de la qualité.",
    objectifs: [
      "Contrôle des procédés industriels",
      "Amélioration continue de la qualité",
      "Optimisation de la maintenance",
      "Fiabilité des systèmes et réseaux"
    ],
    applications: [
      "Automatisation de processus",
      "Gestion de la qualité totale",
      "Optimisation logistique",
      "Sûreté des systèmes informatiques"
    ],
    color: "from-purple-600 to-purple-400"
  },
  {
    id: 5,
    titre: "Statistique Appliquée et Algorithmes stochastiques",
    icon: Award,
    description: "Production d'algorithmes pour résolution exacte ou approchée",
    resume: "Développement de modèles statistiques et algorithmes stochastiques pour l'optimisation des processus de décision.",
    objectifs: [
      "Méthodes MCMC et SMC",
      "Évaluation des risques financiers",
      "Prévision des changements climatiques",
      "Simulation numérique complexe"
    ],
    applications: [
      "Gestion des risques financiers",
      "Prévision climatique",
      "Optimisation de systèmes complexes",
      "Analyse de données massives"
    ],
    color: "from-red-600 to-red-400"
  },
  {
    id: 6,
    titre: "Gestion de connaissances et Web sémantique",
    icon: BookOpen,
    description: "Systèmes à bases de connaissances et web sémantique",
    resume: "Développement de systèmes de gestion des connaissances et technologies du web sémantique pour l'interopérabilité.",
    objectifs: [
      "Ontologies et représentation des connaissances",
      "Web sémantique et linked data",
      "Systèmes d'information intelligents",
      "Interopérabilité des données"
    ],
    applications: [
      "Systèmes d'information d'entreprise",
      "Portails de connaissances",
      "Intégration de données hétérogènes",
      "Web sémantique appliqué"
    ],
    color: "from-cyan-600 to-cyan-400"
  }
];

export function AxeRecherche() {
  const navigate = useNavigate();
  const [selectedAxe, setSelectedAxe] = useState<typeof AXES_RECHERCHE[0] | null>(null);

  return (
    <section id="recherche" className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Nos domaines de recherche</h2>
          <p className="text-gray-600 text-lg">Six axes couvrant les fondements théoriques et les applications pratiques</p>
          <div className="mt-4 h-1 w-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full" />
        </div>

        {/* Grille d'axes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AXES_RECHERCHE.map((axe) => {
            const Icon = axe.icon;
            return (
              <button
                key={axe.id}
                onClick={() => setSelectedAxe(axe)}
                className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${axe.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2 leading-snug group-hover:text-blue-600 transition-colors">{axe.titre}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{axe.description}</p>
                <div className="flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold">Savoir plus</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal détail */}
      {selectedAxe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`bg-gradient-to-r ${selectedAxe.color} text-white p-8 relative`}>
              <button
                onClick={() => setSelectedAxe(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {selectedAxe.icon && <selectedAxe.icon className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{selectedAxe.titre}</h2>
                  <p className="text-white/90 text-lg">{selectedAxe.description}</p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-8 space-y-8">
              {/* Résumé */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Résumé</h3>
                <p className="text-gray-700 leading-relaxed text-lg">{selectedAxe.resume}</p>
              </div>

              {/* Objectifs */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Objectifs spécifiques</h3>
                <ul className="space-y-3">
                  {selectedAxe.objectifs.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 bg-gradient-to-r ${selectedAxe.color} rounded-full mt-2 flex-shrink-0`} />
                      <span className="text-gray-700 text-lg">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Applications */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Applications</h3>
                <ul className="space-y-3">
                  {selectedAxe.applications.map((app, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 bg-gradient-to-r ${selectedAxe.color} rounded-full mt-2 flex-shrink-0`} />
                      <span className="text-gray-700 text-lg">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedAxe(null)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Fermer
                </button>
                <button className={`flex-1 py-3 px-6 bg-gradient-to-r ${selectedAxe.color} text-white rounded-xl font-bold hover:shadow-lg transition-all`}>
                  Contacter l'équipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
