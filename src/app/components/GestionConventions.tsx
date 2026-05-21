import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Handshake, Globe, RefreshCw, X, MapPin, Calendar, Tag, Building } from "lucide-react";
import { conventionsApi } from "../../lib/api";

const TYPE_STYLES: Record<string, string> = {
  "Multilateral": "bg-blue-50 text-blue-700 border-blue-200",
  "Bilateral":    "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Formation":    "bg-amber-50 text-amber-700 border-amber-200",
};
const EMPTY = { titre: "", partenaire: "", annee: new Date().getFullYear(), type: "Multilateral", programme: "", budget: "", pays: "" };

export function GestionConventions() {
  const [tab, setTab]         = useState<"entreprise" | "cooperation">("entreprise");
  const [showModal, setModal] = useState(false);
  const [search, setSearch]   = useState("");
  const [items, setItems]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    try { setItems(await conventionsApi.getAll()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.titre) return;
    setSaving(true);
    try { await conventionsApi.create({ ...form, categorie: tab }); await load(); setModal(false); setForm(EMPTY); }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ?")) return;
    await conventionsApi.delete(id);
    setItems(p => p.filter((c: any) => c.id !== id));
  };

  const entreprises  = items.filter((c: any) => !c.categorie || c.categorie === "entreprise");
  const cooperations = items.filter((c: any) => c.categorie === "cooperation");
  const list = (tab === "entreprise" ? entreprises : cooperations)
    .filter((c: any) => (c.titre || "").toLowerCase().includes(search.toLowerCase()) || (c.partenaire || "").toLowerCase().includes(search.toLowerCase()));

  const isEnt = tab === "entreprise";
  const grad  = isEnt ? "from-blue-600 to-cyan-500" : "from-violet-600 to-purple-700";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.3 }}
          className={`relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br ${grad} p-7`}>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                {isEnt ? <Handshake className="w-7 h-7 text-white" /> : <Globe className="w-7 h-7 text-white" />}
              </motion.div>
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">LARODEC</p>
                <h1 className="text-2xl font-black text-white">{isEnt ? "Conventions" : "Cooperation Internationale"}</h1>
                <p className="text-white/70 text-xs mt-0.5">{isEnt ? "Partenariats avec entreprises et institutions" : "Projets et accords de cooperation internationale"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="px-4 py-2 bg-white/20 text-white text-sm font-bold rounded-xl border border-white/30">
                {list.length} convention{list.length !== 1 ? "s" : ""}
              </motion.span>
              <button onClick={load} className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/20 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => setModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold shadow-lg">
                <Plus className="w-4 h-4" /> Ajouter
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Conventions", value: entreprises.length, icon: Handshake, g: "from-blue-500 to-cyan-500", color: "text-blue-600" },
          { label: "Cooperation internationale", value: cooperations.length, icon: Globe, g: "from-violet-500 to-purple-600", color: "text-violet-600" },
        ].map(({ label, value, icon: Icon, g, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} whileHover={{ y: -3, scale: 1.02 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g} flex items-center justify-center shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { key: "entreprise",  label: "Conventions",             icon: Handshake, cls: "bg-blue-600 text-white shadow-sm"   },
          { key: "cooperation", label: "Cooperation Internationale", icon: Globe,  cls: "bg-violet-600 text-white shadow-sm" },
        ].map(t => {
          const TIcon = t.icon;
          const active = tab === t.key;
          return (
            <motion.button key={t.key} onClick={() => setTab(t.key as any)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? t.cls : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
              <TIcon className="w-4 h-4" />
              {t.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {t.key === "entreprise" ? entreprises.length : cooperations.length}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher titre, partenaire..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white transition-all" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 h-24" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-gray-400">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mx-auto mb-4 opacity-30`}>
            {isEnt ? <Handshake className="w-8 h-8 text-white" /> : <Globe className="w-8 h-8 text-white" />}
          </div>
          <p className="font-medium">Aucune convention enregistree</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {list.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
              <div className="flex">
                <div className={`w-1 bg-gradient-to-b ${grad} flex-shrink-0`} />
                <div className="flex gap-4 p-5 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {isEnt ? <Handshake className="w-5 h-5 text-white" /> : <Globe className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors line-clamp-1">{c.titre}</h3>
                    {c.partenaire && (
                      <p className="text-sm text-gray-500 mb-2.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 flex-shrink-0" />{c.partenaire}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {c.annee && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" />{c.annee}</span>}
                      {c.type && <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${TYPE_STYLES[c.type] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{c.type}</span>}
                      {c.pays && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 font-medium"><MapPin className="w-3 h-3" />{c.pays}</span>}
                      {c.programme && <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 font-medium"><Tag className="w-3 h-3" />{c.programme}</span>}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0 self-start opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className={`bg-gradient-to-r ${grad} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  {isEnt ? <Handshake className="w-5 h-5 text-white" /> : <Globe className="w-5 h-5 text-white" />}
                  <h2 className="text-white font-bold">Ajouter une convention</h2>
                </div>
                <button onClick={() => setModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                    placeholder="Titre de la convention..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Partenaire(s)</label>
                  <input type="text" value={form.partenaire} onChange={e => setForm(p => ({ ...p, partenaire: e.target.value }))}
                    placeholder="Nom de l institution..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Annee</label>
                    <input type="number" value={form.annee} onChange={e => setForm(p => ({ ...p, annee: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                      <option>Multilateral</option><option>Bilateral</option><option>Formation</option>
                    </select>
                  </div>
                </div>
                {tab === "cooperation" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                    <input type="text" value={form.pays} onChange={e => setForm(p => ({ ...p, pays: e.target.value }))}
                      placeholder="Ex: France, Allemagne..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Programme</label>
                  <input type="text" value={form.programme} onChange={e => setForm(p => ({ ...p, programme: e.target.value }))}
                    placeholder="Ex: Erasmus+, Tempus..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-6">
                <button onClick={() => setModal(false)} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-all">Annuler</button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAdd} disabled={saving || !form.titre}
                  className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${grad} text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50`}>
                  {saving && <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-4 h-4" /></motion.div>}
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