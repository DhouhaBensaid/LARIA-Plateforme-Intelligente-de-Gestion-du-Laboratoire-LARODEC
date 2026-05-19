import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { thesesApi } from "../../lib/api";

interface Thesis {
  id: number;
  titre: string;
  annee: number;
  annee_premiere_inscription: number;
  sujet: string;
  chercheur_id: number;
  created_at: string;
}

export function MesTheses() {
  const { session } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    titre: "",
    annee: new Date().getFullYear(),
    annee_premiere_inscription: new Date().getFullYear(),
    sujet: "",
  });

  // Fetch theses
  useEffect(() => {
    fetchTheses();
  }, []);

  const fetchTheses = async () => {
    try {
      setIsLoading(true);
      const data = await thesesApi.getAll();
      console.log("Theses loaded:", data);
      setTheses(data);
      setError(null);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Erreur lors du chargement des thèses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await thesesApi.update(editingId, formData);
      } else {
        await thesesApi.create(formData);
      }

      await fetchTheses();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        titre: "",
        annee: new Date().getFullYear(),
        annee_premiere_inscription: new Date().getFullYear(),
        sujet: "",
      });
      setError(null);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (thesis: Thesis) => {
    setFormData({
      titre: thesis.titre,
      annee: thesis.annee,
      annee_premiere_inscription: thesis.annee_premiere_inscription,
      sujet: thesis.sujet,
    });
    setEditingId(thesis.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette thèse?")) return;

    try {
      await thesesApi.delete(id);
      await fetchTheses();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      titre: "",
      annee: new Date().getFullYear(),
      annee_premiere_inscription: new Date().getFullYear(),
      sujet: "",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Thèses</h1>
            <p className="text-gray-600 mt-2">Gérez les thèses que vous encadrez</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Ajouter une thèse
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? "Modifier la thèse" : "Ajouter une nouvelle thèse"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Titre de la thèse"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année *
                  </label>
                  <input
                    type="number"
                    value={formData.annee}
                    onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année de la première inscription *
                  </label>
                  <input
                    type="number"
                    value={formData.annee_premiere_inscription}
                    onChange={(e) =>
                      setFormData({ ...formData, annee_premiere_inscription: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet *
                </label>
                <textarea
                  value={formData.sujet}
                  onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Sujet de la thèse"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  {editingId ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Theses List */}
        {theses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Aucune thèse ajoutée pour le moment</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {theses.map((thesis) => (
              <div key={thesis.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{thesis.titre}</h3>
                    <p className="text-sm text-gray-600 mt-1">{thesis.sujet}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(thesis)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(thesis.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Année</p>
                    <p className="text-lg font-semibold text-gray-900">{thesis.annee}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">1ère inscription</p>
                    <p className="text-lg font-semibold text-gray-900">{thesis.annee_premiere_inscription}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Ajoutée le</p>
                    <p className="text-sm text-gray-700">{new Date(thesis.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
