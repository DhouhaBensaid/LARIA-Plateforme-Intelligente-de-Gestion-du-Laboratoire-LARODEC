
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, AlertCircle, GraduationCap, Calendar, BookOpen, X, Check } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { thesesApi } from "../../lib/api";

interface Thesis {
  id: number; titre: string; annee: number;
  annee_premiere_inscription: number; sujet: string;
  chercheur_id: number; created_at: string;
}

const emptyForm = () => ({
  titre: "", annee: new Date().getFullYear(),
  annee_premiere_inscription: new Date().getFullYear(), sujet: "",
});

export function MesTheses() {
  const { session } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); setTheses(await thesesApi.getAll()); setError(null); }
    catch (e: any) { setError(e.message || "Erreur chargement"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingId) await thesesApi.update(editingId, form);
      else await thesesApi.create(form);
      await load(); closeForm();
    } catch (e: any) { setError(e.message || "Erreur sauvegarde"); }
    finally { setSaving(false); }
  };

  const handleEdit = (t: Thesis) => {
    setForm({ titre: t.titre, annee: t.annee, annee_premiere_inscription: t.annee_premiere_inscription, sujet: t.sujet });
    setEditingId(t.id); setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette thèse ?")) return;
    try { await thesesApi.delete(id); await load(); }
    catch (e: any) { setError(e.message || "Erreur suppression"); }
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm()); setError(null); };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-blue-50/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-8 py-8 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
              <GraduationCap className="w-8 h-8" />Mes Thèses
            </h1>
            <p className="text-violet-100 text-sm">Gérez les thèses que vous encadrez</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-700 rounded-xl font-semibold hover:bg-violet-50 transition-all shadow-md text-sm">
            <Plus className="w-4 h-4" />Ajouter une thèse
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-violet-100 p-5 shadow-sm">
            <p className="text-3xl font-bold text-violet-600">{theses.length}</p>
            <p className="text-sm text-slate-500 mt-1">Thèses encadrées</p>
          </div>
          <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm">
            <p className="text-3xl font-bold text-blue-600">{new Set(theses.map(t => t.annee)).size}</p>
            <p className="text-sm text-slate-500 mt-1">Années distinctes</p>
          </div>
          <div className="bg-white rounded-xl border border-cyan-100 p-5 shadow-sm">
            <p className="text-3xl font-bold text-cyan-600">{theses.length > 0 ? Math.max(...theses.map(t => t.annee)) : "—"}</p>
            <p className="text-sm text-slate-500 mt-1">Année la plus récente</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="font-bold text-lg">{editingId ? "Modifier la thèse" : "Nouvelle thèse"}</h2>
                <button onClick={closeForm} className="p-1.5 hover:bg-white/20 rounded-lg transition-all"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} required placeholder="Titre de la thèse" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Année *</label>
                    <input type="number" value={form.annee} onChange={e => setForm(p => ({ ...p, annee: parseInt(e.target.value) }))} required min={1990} max={2030} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">1ère inscription *</label>
                    <input type="number" value={form.annee_premiere_inscription} onChange={e => setForm(p => ({ ...p, annee_premiere_inscription: parseInt(e.target.value) }))} required min={1990} max={2030} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Sujet *</label>
                  <textarea value={form.sujet} onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))} required rows={3} placeholder="Sujet de la thèse..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-50">
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingId ? "Modifier" : "Ajouter"}
                  </button>
                  <button type="button" onClick={closeForm} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all">Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {theses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <GraduationCap className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-2">Aucune thèse enregistrée</p>
            <p className="text-slate-400 text-sm mb-6">Commencez par ajouter les thèses que vous encadrez</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all text-sm">
              <Plus className="w-4 h-4" />Ajouter une thèse
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {theses.map(t => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="flex items-start gap-4 p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base mb-1 leading-snug">{t.titre}</h3>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{t.sujet}</p>
                    <div className="flex flex-wrap gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full font-medium">
                        <Calendar className="w-3 h-3" />Soutenance : {t.annee}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                        <BookOpen className="w-3 h-3" />1ère inscription : {t.annee_premiere_inscription}
                      </span>
                      <span className="text-xs text-slate-400">Ajoutée le {new Date(t.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Modifier">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
