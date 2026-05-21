import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Save, Edit2, Phone, Mail, Globe, MapPin, User, Award, Hash, X, Check } from "lucide-react";
import logoLarodec from "../../imports/image-1.png";

const INITIAL = {
  universite:    "UNIVERSITE DE TUNIS",
  etablissement: "INSTITUT SUPERIEUR DE GESTION DE TUNIS",
  denomination:  "Recherche Opérationnelle, Aide à la Décision et Processus de Contrôle",
  code:          "LR01ES02",
  chef:          "BEN ARFA RABAI Latifa",
  grade:         "Professeur d'Enseignement Supérieur",
  fonction:      "Ancien Labo LR11ES03",
  tel:           "0021698385982",
  fax:           "21671588350",
  email:         "latifa.rabai@gmail.com",
  siteWeb:       "http://www.larodec.com",
};

const FIELDS = [
  { key: "universite",    label: "Université",          icon: Building2, span: 1 },
  { key: "etablissement", label: "Établissement",        icon: Building2, span: 1 },
  { key: "denomination",  label: "Dénomination LR/UR",  icon: Award,     span: 2 },
  { key: "code",          label: "Code structure",       icon: Hash,      span: 1 },
  { key: "chef",          label: "Chef LR/UR",           icon: User,      span: 1 },
  { key: "grade",         label: "Grade",                icon: Award,     span: 1 },
  { key: "fonction",      label: "Fonction administrative", icon: Building2, span: 1 },
  { key: "tel",           label: "Téléphone",            icon: Phone,     span: 1 },
  { key: "fax",           label: "Fax",                  icon: Phone,     span: 1 },
  { key: "email",         label: "E-mail",               icon: Mail,      span: 1 },
  { key: "siteWeb",       label: "Site Web",             icon: Globe,     span: 1 },
] as const;

export function InfoLaboratoire() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData]   = useState(INITIAL);
  const [saved, setSaved]         = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setFormData(INITIAL);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-slate-700 via-slate-600 to-blue-700 p-7">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
              <img src={logoLarodec} alt="LARODEC" className="w-10 h-10 object-contain" />
            </motion.div>
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">ISG Tunis</p>
              <h1 className="text-2xl font-black text-white">LARODEC</h1>
              <p className="text-white/70 text-xs mt-0.5">{formData.denomination}</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
              isEditing ? "bg-white/20 text-white border border-white/30" : "bg-white text-slate-700"
            }`}>
            {isEditing ? <><X className="w-4 h-4" /> Annuler</> : <><Edit2 className="w-4 h-4" /> Modifier</>}
          </motion.button>
        </div>
      </motion.div>

      {/* Info cards (read mode) */}
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Quick info strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Hash,   label: "Code",      value: formData.code,  color: "blue"   },
                { icon: User,   label: "Directeur", value: formData.chef,  color: "purple" },
                { icon: Phone,  label: "Tél",       value: formData.tel,   color: "emerald"},
                { icon: Mail,   label: "Email",      value: formData.email, color: "rose"   },
              ].map(({ icon: Icon, label, value, color }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }} whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className={`w-9 h-9 bg-${color}-50 rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 text-${color}-600`} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                </motion.div>
              ))}
            </div>

            {/* Full details */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Informations complètes</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {FIELDS.map(({ key, label, icon: Icon, span }) => (
                  <div key={key} className={span === 2 ? "md:col-span-2" : ""}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />{label}
                    </p>
                    {key === "siteWeb" ? (
                      <a href={formData[key]} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />{formData[key]}
                      </a>
                    ) : key === "email" ? (
                      <a href={`mailto:${formData[key]}`} className="text-sm text-blue-600 hover:underline font-medium">
                        {formData[key]}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-800 font-medium">{formData[key as keyof typeof formData]}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Modifier les informations</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {FIELDS.map(({ key, label, icon: Icon, span }) => (
                  <div key={key} className={span === 2 ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />{label}
                    </label>
                    <input
                      type={key === "email" ? "email" : key === "siteWeb" ? "url" : "text"}
                      value={formData[key as keyof typeof formData]}
                      onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 flex justify-end gap-3">
                <button onClick={handleCancel}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">
                  <Save className="w-4 h-4" /> Enregistrer
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save toast */}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2 shadow-2xl z-50">
            <Check className="w-4 h-4 text-green-400" /> Informations enregistrées
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
