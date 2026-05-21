import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, GraduationCap, Award, BookOpen, X, RefreshCw, User, Calendar } from "lucide-react";
import { thesesApi } from "../../lib/api";

const TABS = [
  { key: "theses",  label: "Thèses de Doctorat", icon: GraduationCap, color: "blue",   gradient: "from-blue-600 to-cyan-600"   },
  { key: "masters", label: "Mastères",            icon: BookOpen,      color: "violet", gradient: "from-violet-600 to-purple-600" },
];

const EMPTY_FORM = { titre: "", annee: new Date().getFullYear(), annee_premiere_inscription: new Date().getFullYear() - 3, sujet: "" };

export function GestionTheses() {
  const [activeTab, setActiveTab] = useState<"theses" | "masters">("theses");
  const [items, setItems]         = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [search, setSearch]       = useState("");
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await thesesApi.getAllAdmin();
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filter by tab: theses = annee_premiere_inscription exists and sujet contains "doctorat" or just all
  // Since the DB has one table, we split by a heuristic: masters have shorter sujet or we use a type field
  // For now: tab "theses" shows all, "masters" shows items where sujet contains "master" or "mastère"
  // Actually we'll just show all in both tabs for now since there's one table — split by sujet keyword
  const filtered = items.filter(item => {
    const matchSearch = !search ||
      (item.titre || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.sujet || "").toLowerCase().includes(search.toLowerCase()) ||
      (`${item.prenom || ""} ${item.nom || ""}`).toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeTab === "masters") return (item.sujet || "").toLowerCase().includes("master") || (item.titre || "").toLowerCase().includes("master");
    return true; // theses tab shows all
  });

  const handleSave = async () => {
    if (!form.titre || !form.annee) return;
    setIsSaving(true);
    try {
      if (editId) {
        await thesesApi.update(editId, form);
      } else {
        await thesesApi.create(form);
      }
      await load();
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette thèse ?")) return;
    try {
      await thesesApi.deleteAdmin(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const cfg = TABS.find(t => t.key === activeTab)!;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br ${cfg.gradient} p-7`}>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">LARODEC</p>
              <h1 className="text-2xl font-black text-white">Thèses & Mastères</h1>
              <p className="text-white/70 text-xs mt-0.5">Travaux de recherche supervisés</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium border border-white/20 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold shadow-lg">
              <Plus className="w-4 h-4" /> Ajouter
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(tab => {
          const TIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <motion.button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? `bg-${tab.color}-600 text-white shadow-sm` : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}>
              <TIcon className="w-4 h-4" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {filtered.length}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher titre, sujet, chercheur..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white transition-all" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucune thèse enregistrée</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.07)" }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex gap-4 p-5">
                <div className={`w-1 rounded-full bg-gradient-to-b ${cfg.gradient} flex-shrink-0`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                  {item.annee || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">{item.titre}</h3>
                  {item.sujet && <p className="text-xs text-gray-500 italic mb-2 line-clamp-1">{item.sujet}</p>}
                  <div className="flex gap-2 flex-wrap">
                    {(item.prenom || item.nom) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                        <User className="w-3 h-3" />{item.prenom} {item.nom}
                      </span>
                    )}
                    {item.annee_premiere_inscription && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />Inscrit {item.annee_premiere_inscription}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color === "blue" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                      Soutenance {item.annee}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className={`bg-gradient-to-r ${cfg.gradient} px-6 py-4 flex items-center justify-between`}>
                <h2 className="text-white font-bold">{editId ? "Modifier" : "Ajouter"} une thèse</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sujet / Résumé</label>
                  <textarea rows={3} value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année 1ère inscription</label>
                    <input type="number" value={form.annee_premiere_inscription}
                      onChange={e => setForm(f => ({ ...f, annee_premiere_inscription: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année soutenance *</label>
                    <input type="number" value={form.annee}
                      onChange={e => setForm(f => ({ ...f, annee: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSave} disabled={isSaving || !form.titre}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white rounded-xl text-sm font-semibold disabled:opacity-50`}>
                  {isSaving && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-4 h-4" /></motion.div>}
                  {editId ? "Modifier" : "Ajouter"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
