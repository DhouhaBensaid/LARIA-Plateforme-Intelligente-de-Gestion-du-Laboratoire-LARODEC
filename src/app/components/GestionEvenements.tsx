import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Calendar, MapPin, CheckCircle, Clock, RefreshCw, X, Filter } from "lucide-react";
import { useLocation } from "react-router";
import { evenementsApi } from "../../lib/api";

const TYPE_COLORS: Record<string, string> = {
  "Seminaire":       "bg-blue-50 text-blue-700 border-blue-200",
  "Conference":      "bg-purple-50 text-purple-700 border-purple-200",
  "Atelier":         "bg-amber-50 text-amber-700 border-amber-200",
  "Workshop":        "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Journee d'etude": "bg-rose-50 text-rose-700 border-rose-200",
};

const EMPTY_FORM = { titre: "", description: "", type: "Seminaire", date: "", date_debut: "", date_fin: "", lieu: "", url_photo: "" };

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function getDaysUntil(d?: string) {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return days;
}

export function GestionEvenements() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const [evenements, setEvenements] = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatut, setFilterStatut] = useState<"all" | "valide" | "en_attente">("all");
  const [form, setForm]             = useState(EMPTY_FORM);

  const load = async () => {
    setIsLoading(true);
    try { setEvenements(await evenementsApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.titre || (!form.date && !form.date_debut)) return;
    setIsSaving(true);
    try {
      await evenementsApi.create({ ...form, date: form.date || form.date_debut });
      await load();
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (e: any) { alert(e.message); }
    finally { setIsSaving(false); }
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

  const filtered = evenements.filter((e: any) => {
    const matchSearch = !search ||
      (e.titre || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.lieu || "").toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || e.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const upcoming = filtered.filter(e => e.date && new Date(e.date) >= new Date());
  const past     = filtered.filter(e => !e.date || new Date(e.date) < new Date());
  const pending  = evenements.filter(e => e.statut === "en_attente").length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-purple-600 to-violet-700 p-7">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
              <Calendar className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">LARODEC</p>
              <h1 className="text-2xl font-black text-white">Événements</h1>
              <p className="text-white/70 text-xs mt-0.5">Séminaires, ateliers et journées scientifiques</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pending > 0 && (
              <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="px-3 py-1.5 bg-amber-400/90 text-white text-xs font-bold rounded-xl">
                {pending} en attente
              </motion.span>
            )}
            <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium border border-white/20 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-bold shadow-lg">
              <Plus className="w-4 h-4" /> Ajouter
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total",      value: evenements.length,                                    color: "blue"   },
          { label: "À venir",    value: evenements.filter(e => e.date && new Date(e.date) >= new Date()).length, color: "emerald" },
          { label: "En attente", value: pending,                                               color: "amber"  },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
            <p className={`text-2xl font-black text-${color}-600`}>{value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm bg-white transition-all" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
        <div className="flex gap-2">
          {(["all", "valide", "en_attente"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatut(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterStatut === s ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
              {s === "all" ? "Tous" : s === "valide" ? "Validés" : "En attente"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucun événement trouvé</p>
        </motion.div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">À venir ({upcoming.length})</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcoming.map((event, i) => <EventCard key={event.id} event={event} isAdmin={isAdmin} onValidate={handleValidate} onDelete={handleDelete} index={i} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Passés ({past.length})</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {past.map((event, i) => <EventCard key={event.id} event={event} isAdmin={isAdmin} onValidate={handleValidate} onDelete={handleDelete} index={i} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-purple-600 to-violet-700 px-6 py-4 flex items-center justify-between sticky top-0">
                <h2 className="text-white font-bold">Ajouter un événement</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white">
                    {["Seminaire", "Conference", "Atelier", "Journee d'etude", "Workshop"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                    <input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value, date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                    <input type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                  <input type="text" value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Photo</label>
                  <input type="url" value={form.url_photo} onChange={e => setForm(f => ({ ...f, url_photo: e.target.value }))}
                    placeholder="https://..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none" />
                </div>
                {!isAdmin && (
                  <p className="text-xs text-purple-600 bg-purple-50 p-3 rounded-xl">Votre événement sera soumis à validation par un administrateur.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-all">Annuler</button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAdd} disabled={isSaving || !form.titre || !form.date_debut}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {isSaving && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-4 h-4" /></motion.div>}
                  Ajouter
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventCard({ event, isAdmin, onValidate, onDelete, index }: {
  event: any; isAdmin: boolean;
  onValidate: (id: number) => void; onDelete: (id: number) => void; index: number;
}) {
  const days = getDaysUntil(event.date);
  const isUpcoming = days !== null && days >= 0;
  const typeStyle = TYPE_COLORS[event.type] || "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {event.url_photo && (
        <div className="h-36 w-full overflow-hidden">
          <img src={event.url_photo} alt={event.titre} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${event.statut === "valide" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              {event.statut === "valide" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {event.statut === "valide" ? "Validé" : "En attente"}
            </span>
            {event.type && <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeStyle}`}>{event.type}</span>}
          </div>
          {isUpcoming && days !== null && days <= 30 && (
            <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full font-bold flex-shrink-0">
              {days === 0 ? "Aujourd'hui" : `J-${days}`}
            </motion.span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.titre}</h3>
        {event.description && <p className="text-gray-500 text-xs mb-3 line-clamp-2">{event.description}</p>}
        <div className="space-y-1.5 mb-4">
          {(event.date_debut || event.date) && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span>
                {event.date_debut
                  ? `Du ${formatDate(event.date_debut)}${event.date_fin ? ` au ${formatDate(event.date_fin)}` : ""}`
                  : formatDate(event.date)}
              </span>
            </div>
          )}
          {event.lieu && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span>{event.lieu}</span>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            {event.statut === "en_attente" && (
              <button onClick={() => onValidate(event.id)}
                className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-all flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Valider
              </button>
            )}
            <button onClick={() => onDelete(event.id)}
              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-all flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
