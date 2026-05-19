import { useState } from "react";
import { Plus, Search, Edit2, Trash2, GraduationCap, Award } from "lucide-react";

export function GestionTheses() {
  const [activeTab, setActiveTab] = useState<'habilitations' | 'theses' | 'masteres'>('habilitations');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const habilitations = [
    {
      id: 1,
      titre: 'Intelligence Artificielle et Systèmes d\'Aide à la Décision',
      titulaire: 'Dr. Ahmed Ben Salah',
      cin: '02345678',
      annee: 2025,
      encadreur: 'Prof. Mohamed Trabelsi (01234567)',
    },
  ];

  const theses = [
    {
      id: 1,
      titre: 'Optimisation des Chaînes Logistiques par Apprentissage Automatique',
      doctorant: 'Khalil Mejri',
      anneeInscription: 2021,
      anneeSoutenance: 2025,
      encadrant: 'Prof. Mohamed Trabelsi (01234567)',
    },
    {
      id: 2,
      titre: 'Analyse de Données Massives pour la Santé Connectée',
      doctorant: 'Sarah Azizi',
      anneeInscription: 2022,
      anneeSoutenance: 2025,
      encadrant: 'Dr. Ahmed Ben Salah (02345678)',
    },
  ];

  const masteres = [
    {
      id: 1,
      titre: 'Blockchain et Sécurité des Transactions Financières',
      etudiant: 'Youssef Ben Ali',
      anneeInscription: 2023,
      anneeSoutenance: 2025,
      encadrant: 'Dr. Nadia Gharbi (03456789)',
    },
  ];

  const tabs = [
    { key: 'habilitations', label: 'Habilitations', count: habilitations.length, icon: Award },
    { key: 'theses', label: 'Thèses de Doctorat', count: theses.length, icon: GraduationCap },
    { key: 'masteres', label: 'Mastères', count: masteres.length, icon: GraduationCap },
  ];

  const getCurrentData = () => {
    if (activeTab === 'habilitations') return habilitations;
    if (activeTab === 'theses') return theses;
    return masteres;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Habilitations, Thèses & Mastères</h1>
          <p className="text-gray-600">Gérer les soutenances de l'année 2025</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tab.count}
              </span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {getCurrentData().map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'habilitations' ? 'bg-purple-50' : 'bg-blue-50'
                  }`}>
                    {activeTab === 'habilitations' ? (
                      <Award className="w-6 h-6 text-purple-600" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{item.titre}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          {activeTab === 'habilitations' ? 'Titulaire' : activeTab === 'theses' ? 'Doctorant' : 'Étudiant'}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {activeTab === 'habilitations' ? item.titulaire : activeTab === 'theses' ? (item as any).doctorant : (item as any).etudiant}
                        </p>
                      </div>
                      {activeTab === 'habilitations' ? (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">CIN</p>
                            <p className="text-sm font-medium text-gray-900">{item.cin}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Année</p>
                            <p className="text-sm font-medium text-gray-900">{item.annee}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Inscription</p>
                            <p className="text-sm font-medium text-gray-900">{(item as any).anneeInscription}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Soutenance</p>
                            <p className="text-sm font-medium text-gray-900">{(item as any).anneeSoutenance}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {activeTab === 'habilitations' ? 'Encadreur' : 'Encadrant'}
                      </p>
                      <p className="text-sm text-gray-700">
                        {activeTab === 'habilitations' ? item.encadreur : (item as any).encadrant}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Ajouter {activeTab === 'habilitations' ? 'une habilitation' : activeTab === 'theses' ? 'une thèse' : 'un mastère'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {activeTab === 'habilitations' ? 'Titulaire' : activeTab === 'theses' ? 'Doctorant' : 'Étudiant'}
                  </label>
                  <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                {activeTab === 'habilitations' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CIN</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                  </div>
                )}
              </div>

              {activeTab !== 'habilitations' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année d'inscription</label>
                    <input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Année de soutenance</label>
                    <input type="number" defaultValue={2025} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                  </div>
                </div>
              )}

              {activeTab === 'habilitations' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                  <input type="number" defaultValue={2025} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeTab === 'habilitations' ? 'Encadreur (Nom + CIN)' : 'Encadrant (Nom + CIN)'}
                </label>
                <input type="text" placeholder="Ex: Prof. Mohamed Trabelsi (01234567)" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
