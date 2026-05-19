import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Handshake, Globe, Loader2, RefreshCw } from "lucide-react";
import { conventionsApi } from "../../lib/api";

export function GestionConventions() {
  const [activeTab, setActiveTab] = useState("entreprise");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [conventions, setConventions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ titre: "", partenaire: "", annee: 2025, type: "Multilateral", programme: "", budget: "", pays: "" });

  const load = async () => {
    setIsLoading(true);
    try { setConventions(await conventionsApi.getAll()); }
    catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.titre) return;
    setIsSaving(true);
    try {
      await conventionsApi.create({ ...form, categorie: activeTab });
      await load();
      setShowModal(false);
      setForm({ titre: "", partenaire: "", annee: 2025, type: "Multilateral", programme: "", budget: "", pays: "" });
    } catch (err) { alert(err.message); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ?")) return;
    await conventionsApi.delete(id);
    setConventions(prev => prev.filter(c => c.id !== id));
  };

  const entreprises = conventions.filter(c => !c.categorie || c.categorie === "entreprise");
  const cooperations = conventions.filter(c => c.categorie === "cooperation");
  const filtered = (activeTab === "entreprise" ? entreprises : cooperations)
    .filter(c => (c.titre || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.partenaire || "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conventions et Cooperation</h1>
          <p className="text-gray-600">Partenariats et projets de cooperation internationale</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[{ key: "entreprise", label: "Conventions", icon: Handshake, count: entreprises.length }, { key: "cooperation", label: "Cooperation Internationale", icon: Globe, count: cooperations.length }].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all relative ${activeTab === tab.key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
              <Icon className="w-4 h-4" />{tab.label}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tab.count}</span>
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          );
        })}
      </div>
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Handshake className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune convention.</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === "entreprise" ? "bg-blue-50" : "bg-purple-50"}`}>
                    {activeTab === "entreprise" ? <Handshake className="w-5 h-5 text-blue-600" /> : <Globe className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">{c.titre}</h3>
                    {c.partenaire && <p className="text-sm text-gray-600 mb-2">{c.partenaire}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Annee: {c.annee}</span>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{c.type}</span>
                      {c.pays && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{c.pays}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Ajouter une convention</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label><input type="text" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Partenaire(s)</label><input type="text" value={form.partenaire} onChange={e => setForm(p => ({ ...p, partenaire: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Annee</label><input type="number" value={form.annee} onChange={e => setForm(p => ({ ...p, annee: Number(e.target.value) }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option>Multilateral</option><option>Bilateral</option><option>Formation</option></select></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleAdd} disabled={isSaving || !form.titre} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}