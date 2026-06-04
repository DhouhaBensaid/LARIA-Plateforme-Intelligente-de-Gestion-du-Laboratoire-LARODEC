
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Lock, Mail, User, GraduationCap, ArrowLeft, Loader2,
  Upload, Link as LinkIcon, Eye, EyeOff, BookOpen,
  Users, Award, Globe, ChevronRight, Phone, CreditCard, X,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { BackgroundLogo } from "./BackgroundLogo";

// ── Stats shown on the left panel ──────────────────────────────────────────
const STATS = [
  { label: "Chercheurs", value: "53+", icon: Users },
  { label: "Publications", value: "880+", icon: BookOpen },
  { label: "Années d'excellence", value: "20+", icon: Award },
  { label: "Partenaires", value: "12+", icon: Globe },
];

const GRADES = [
  "Professeur",
  "Maître de Conférences",
  "Maître Assistant",
  "Assistant",
  "Doctorant",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");

  // login fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [userType, setUserType] = useState<"chercheur" | "admin">("chercheur");

  // register fields
  const [rNom, setRNom]           = useState("");
  const [rPrenom, setRPrenom]     = useState("");
  const [rCin, setRCin]           = useState("");
  const [rTel, setRTel]           = useState("");
  const [rEtab, setREtab]         = useState("");
  const [rUniv, setRUniv]         = useState("");
  const [rGrade, setRGrade]       = useState("");
  const [rEmail, setREmail]       = useState("");
  const [rPwd, setRPwd]           = useState("");
  const [rShowPwd, setRShowPwd]   = useState(false);
  const [rScholar, setRScholar]   = useState("");
  const [rPhoto, setRPhoto]       = useState<File | null>(null);
  const [rPhotoPreview, setRPhotoPreview] = useState<string | null>(null);
  const [step, setStep]           = useState(1); // multi-step register

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate(session.user.role?.includes("admin") ? "/admin" : "/chercheur");
  }, [session]);

  useEffect(() => {
    if (searchParams.get("register") === "true") setTab("register");
  }, [searchParams]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("image/png")) { setError("Format PNG uniquement"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Photo max 5 MB"); return; }
    setRPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setRPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error: err } = await login(email, password);
    if (err) { setError(err); setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("email", rEmail); fd.append("password", rPwd);
      fd.append("nom", rNom); fd.append("prenom", rPrenom);
      fd.append("cin", rCin); fd.append("telephone", rTel);
      fd.append("etablissement", rEtab); fd.append("universite", rUniv);
      fd.append("grade", rGrade); fd.append("google_scholar_url", rScholar);
      if (rPhoto) fd.append("photo", rPhoto);
      const res = await fetch("http://localhost:3001/api/auth/register", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur inscription"); }
      setSuccess("Compte créé ! Connexion en cours...");
      await login(rEmail, rPwd);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — branding ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative overflow-hidden flex-col"
        style={{ background: "linear-gradient(135deg, #1A1A4E 0%, #1A73E8 100%)" }}>

        {/* SVG watermark — BackgroundLogo composant réutilisable */}
        <BackgroundLogo dark size={420} opacity={0.07} rotate={-8} top={-40} right={-80} />

        <div className="relative flex flex-col h-full px-12 py-12">
          {/* Back button */}
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium w-fit">
            <ArrowLeft className="w-4 h-4" />Retour à l'accueil
          </button>

          {/* Logo SVG inline + title */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Radar icon alone — no text mixed into SVG to avoid truncation */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ width: 44, height: 44, flexShrink: 0 }}>
                <circle cx="22" cy="22" r="16" stroke="white" strokeWidth="2.5"/>
                <circle cx="22" cy="22" r="9"  stroke="white" strokeWidth="2"/>
                <circle cx="22" cy="22" r="3"  fill="white"/>
                <line x1="25.5" y1="22" x2="38" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="33"   y1="17" x2="38" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="33"   y1="27" x2="38" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: "'Inter','Segoe UI',Arial,sans-serif", fontWeight: 900, fontSize: 38, color: "white", letterSpacing: "0.05em", lineHeight: 1 }}>
                LARODEC
              </span>
            </div>

            <p className="text-white/80 text-base font-medium mb-1 leading-snug">
              Laboratoire de Recherche Opérationnelle,<br />de Décision et de Contrôle de Processus
            </p>
            <p className="text-white/60 text-sm mb-10">ISG · Université de Tunis</p>

            {/* Stats grid — all cards identical bg */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label}
                  className="border border-white/20 rounded-xl p-5 transition-all hover:border-white/40"
                  style={{ background: "rgba(255,255,255,0.12)" }}>
                  <Icon className="w-5 h-5 mb-3" style={{ color: "rgba(255,255,255,0.7)" }} />
                  <p className="text-3xl font-black text-white">{value}</p>
                  <p className="text-xs font-medium mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>© 2026 LARODEC · ISG Tunis</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        {/* Mobile back button */}
        <div className="lg:hidden px-6 pt-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Retour
          </button>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 36, height: 36 }}>
                  <circle cx="20" cy="20" r="14" stroke="#1A73E8" strokeWidth="2.5"/>
                  <circle cx="20" cy="20" r="8"  stroke="#1A73E8" strokeWidth="2"/>
                  <circle cx="20" cy="20" r="3"  fill="#1A73E8"/>
                  <line x1="24" y1="20" x2="34" y2="20" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="30" y1="16" x2="34" y2="20" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="30" y1="24" x2="34" y2="20" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <h1 className="text-2xl font-black" style={{ color: "#1A1A4E" }}>LARODEC</h1>
              </div>
              <p className="text-slate-500 text-sm">ISG · Université de Tunis</p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 mb-8 shadow-sm">
              {(["login", "register"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(null); setStep(1); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    tab === t
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-800"
                  }`}>
                  {t === "login" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
              </div>
            )}
            {success && (
              <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">{success}</div>
            )}

            {/* ── LOGIN FORM ── */}
            {tab === "login" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Bon retour</h2>
                  <p className="text-slate-500 text-sm mt-1">Connectez-vous à votre espace LARODEC</p>
                </div>


                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#1A73E8" }} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        placeholder="votre.email@exemple.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all" style={{ background: "#F0F7FF", border: "1px solid #d1dff8" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#1A73E8" }} />
                      <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all" style={{ background: "#F0F7FF", border: "1px solid #d1dff8" }} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1">
                      <button type="button" className="text-xs font-medium hover:underline" style={{ color: "#1A73E8" }}>
                        Mot de passe oublié ?
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 mt-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Se connecter
                    {!loading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Pas encore de compte ?{" "}
                  <button onClick={() => setTab("register")} className="text-blue-600 font-semibold hover:underline">S'inscrire</button>
                </p>
              </div>
            )}

            {/* ── REGISTER FORM — multi-step ── */}
            {tab === "register" && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-900">Créer un compte</h2>
                  <p className="text-slate-500 text-sm mt-1">Rejoignez la communauté LARODEC</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8">
                  {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step > s ? "bg-emerald-500 text-white" :
                        step === s ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" :
                        "bg-slate-200 text-slate-500"
                      }`}>
                        {step > s ? "✓" : s}
                      </div>
                      <div className={`flex-1 h-0.5 rounded-full transition-all ${s < 3 ? (step > s ? "bg-emerald-400" : "bg-slate-200") : "hidden"}`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-6 -mt-4">
                  <span className={step >= 1 ? "text-blue-600 font-semibold" : ""}>Identité</span>
                  <span className={step >= 2 ? "text-blue-600 font-semibold" : ""}>Académique</span>
                  <span className={step >= 3 ? "text-blue-600 font-semibold" : ""}>Sécurité</span>
                </div>

                <form onSubmit={step < 3 ? (e) => { e.preventDefault(); setStep(s => s + 1); } : handleRegister}>

                  {/* STEP 1 — Identity */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {/* Photo upload */}
                      <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          {rPhotoPreview ? (
                            <>
                              <img src={rPhotoPreview} alt="preview" className="w-16 h-16 rounded-xl object-cover border-2 border-blue-300" />
                              <button type="button" onClick={() => { setRPhoto(null); setRPhotoPreview(null); }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <label className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <input type="file" accept=".png" onChange={handlePhotoChange} className="hidden" />
                            </label>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">Photo de profil</p>
                          <p className="text-xs text-slate-400 mt-0.5">PNG · max 5 MB · optionnel</p>
                          {!rPhotoPreview && (
                            <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                              <Upload className="w-3 h-3" />Choisir une photo
                              <input type="file" accept=".png" onChange={handlePhotoChange} className="hidden" />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Nom *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" value={rNom} onChange={e => setRNom(e.target.value)} required placeholder="Nom"
                              className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Prénom *</label>
                          <input type="text" value={rPrenom} onChange={e => setRPrenom(e.target.value)} required placeholder="Prénom"
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">CIN *</label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" value={rCin} onChange={e => setRCin(e.target.value)} required placeholder="N° CIN"
                              className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Téléphone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="tel" value={rTel} onChange={e => setRTel(e.target.value)} placeholder="+216 XX XXX XXX"
                              className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 — Academic */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Établissement *</label>
                        <input type="text" value={rEtab} onChange={e => setREtab(e.target.value)} required placeholder="Ex: ISG Tunis"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Université *</label>
                        <input type="text" value={rUniv} onChange={e => setRUniv(e.target.value)} required placeholder="Ex: Université de Tunis"
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Grade *</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select value={rGrade} onChange={e => setRGrade(e.target.value)} required
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm appearance-none">
                            <option value="">Sélectionnez votre grade</option>
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Google Scholar</label>
                        <div className="relative">
                          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="url" value={rScholar} onChange={e => setRScholar(e.target.value)} placeholder="https://scholar.google.com/..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Optionnel — pour la synchronisation automatique</p>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 — Security */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="email" value={rEmail} onChange={e => setREmail(e.target.value)} required placeholder="votre.email@exemple.com"
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Mot de passe *</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type={rShowPwd ? "text" : "password"} value={rPwd} onChange={e => setRPwd(e.target.value)} required placeholder="••••••••" minLength={6}
                            className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm" />
                          <button type="button" onClick={() => setRShowPwd(!rShowPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                            {rShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {/* Password strength */}
                        {rPwd && (
                          <div className="mt-2">
                            <div className="flex gap-1">
                              {[1,2,3,4].map(i => (
                                <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                                  rPwd.length >= i * 3
                                    ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-orange-400" : i <= 3 ? "bg-yellow-400" : "bg-emerald-400"
                                    : "bg-slate-200"
                                }`} />
                              ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {rPwd.length < 4 ? "Trop court" : rPwd.length < 7 ? "Faible" : rPwd.length < 10 ? "Moyen" : "Fort"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-1.5">
                        <p className="font-semibold text-slate-700 mb-2">Récapitulatif</p>
                        <p className="text-slate-600"><span className="font-medium">Nom :</span> {rPrenom} {rNom}</p>
                        <p className="text-slate-600"><span className="font-medium">Grade :</span> {rGrade}</p>
                        <p className="text-slate-600"><span className="font-medium">Établissement :</span> {rEtab}</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex gap-3 mt-6">
                    {step > 1 && (
                      <button type="button" onClick={() => setStep(s => s - 1)}
                        className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all">
                        Retour
                      </button>
                    )}
                    <button type="submit" disabled={loading}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 ${
                        step === 3
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600"
                          : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-500/25 hover:from-blue-700 hover:to-cyan-600"
                      }`}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {step < 3 ? <><span>Suivant</span><ChevronRight className="w-4 h-4" /></> : "Créer mon compte"}
                    </button>
                  </div>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Déjà un compte ?{" "}
                  <button onClick={() => setTab("login")} className="text-blue-600 font-semibold hover:underline">Se connecter</button>
                </p>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-6">© 2026 LARODEC · ISG Tunis · Tous droits réservés</p>
      </div>
    </div>
  );
}
