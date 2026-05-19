import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, Users, CheckCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { useLocation } from "react-router";
import { evenementsApi } from "../../lib/api";

export function GestionEvenements() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const [evenements, setEvenements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [form, setForm] = useState({
    titre: "", description: "", type: "Seminaire",
    date: "", date_debut: "", date_fin: "", lieu: "", url_photo: "",
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await evenementsApi.getAll();
      setEvenements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.titre || !form.date) return;
    setIsSaving(true);
    try {
      const created = await evenementsApi.create({
        titre: form.titre,
        description: form.description,
        type: form.type,
        date: form.date || form.date_debut,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        lieu: form.lieu,
        url_photo: form.url_photo || null,
      });
      // Re-fetch to get the full object with id from DB
      await load();
      setShowModal(false);
      setForm({ titre: "", description: "", type: "Seminaire", date: "", date_debut: "", date_fin: "", lieu: "", url_photo: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async (id: number) => {
    await evenementsApi.updateStatut(id, "valide");
    setEvenements(prev => prev.map((e: any) => e.id === id ? { ...e, statut: "valide" } : e));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet événement ?")) return;
    await evenementsApi.delete(id);
    setEvenements(prev => prev.filter((e: any) => e.id !== id));
  };

  const filtered = evenements.filter((e: any) =>
    (e.titre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.lieu || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Événements</h1>
          <p className="text-gray-600">Séminaires, ateliers et journées scientifiques</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
            <Plus className="w-4 h-4" /> Ajouter un événement
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun événement. Cliquez sur "Ajouter" pour en créer un.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((event: any) => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              {/* Photo */}
              {event.url_photo && (
                <div className="h-40 w-full overflow-hidden">
                  <img src={event.url_photo} alt={event.titre} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    event.statut === "valide" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {event.statut === "valide" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {event.statut === "valide" ? "Valide" : "En attente"}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">{event.type}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{event.titre}</h3>
                {event.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>}

                <div className="space-y-1.5 mb-4">
                  {(event.date_debut || event.date) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>
                        {event.date_debut
                          ? `Du ${new Date(event.date_debut).toLocaleDateString("fr-FR")}${event.date_fin ? ` au ${new Date(event.date_fin).toLocaleDateString("fr-FR")}` : ""}`
                          : new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {event.lieu && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{event.lieu}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                  {isAdmin && event.statut === "en_attente" && (
                    <button onClick={() => handleValidate(event.id)}
                      className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-all">
                      Valider
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(event.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Ajouter un événement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>Seminaire</option>
                  <option>Conference</option>
                  <option>Atelier</option>
                  <option>Journee d'etude</option>
                  <option>Workshop</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date debut *</label>
                  <input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value, date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <input type="text" value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Photo (optionnel)</label>
                <input type="url" value={form.url_photo} onChange={e => setForm(f => ({ ...f, url_photo: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {!isAdmin && (
                <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
                  Votre evenement sera soumis a validation par un administrateur.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleAdd} disabled={isSaving || !form.titre || !form.date_debut}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
