import { useState } from "react";
import { Building2, Save, Edit2 } from "lucide-react";

export function InfoLaboratoire() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    universite: "UNIVERSITE DE TUNIS",
    etablissement: "INSTITUT SUPERIEUR DE GESTION DE TUNIS",
    denomination: "Recherche Opérationnelle, Aide à la Décision et Processus de Contrôle",
    code: "LR01ES02",
    chef: "BEN ARFA RABAI Latifa",
    grade: "Professeur d'Enseignement Supérieur",
    fonction: "Ancien Labo LR11ES03",
    tel: "0021698385982",
    fax: "21671588350",
    email: "latifa.rabai@gmail.com",
    siteWeb: "http://www.larodec.com",
  });

  const handleSave = () => {
    setIsEditing(false);
    // Simulation de sauvegarde
    alert("Informations sauvegardées avec succès !");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Informations du Laboratoire</h1>
          <p className="text-gray-600">Gérer les informations générales de LARODEC</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">LARODEC</h2>
            <p className="text-gray-600">Laboratoire de Recherche - ISG Tunis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Université/Centre de recherche
            </label>
            <input
              type="text"
              value={formData.universite}
              onChange={(e) => setFormData({ ...formData, universite: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Établissement
            </label>
            <input
              type="text"
              value={formData.etablissement}
              onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dénomination LR/UR
            </label>
            <input
              type="text"
              value={formData.denomination}
              onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code structure
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chef LR/UR
            </label>
            <input
              type="text"
              value={formData.chef}
              onChange={(e) => setFormData({ ...formData, chef: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fonction administrative
            </label>
            <input
              type="text"
              value={formData.fonction}
              onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone fixe
            </label>
            <input
              type="text"
              value={formData.tel}
              onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fax
            </label>
            <input
              type="text"
              value={formData.fax}
              onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Web LR/UR
            </label>
            <input
              type="url"
              value={formData.siteWeb}
              onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-700"
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
