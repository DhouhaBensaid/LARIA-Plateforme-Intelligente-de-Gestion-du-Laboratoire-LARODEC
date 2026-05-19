import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Building2, Lock, Mail, User, CreditCard, School, GraduationCap, ArrowLeft, Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { authApi } from "../../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"admin" | "chercheur">("chercheur");

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [cin, setCin] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [universite, setUniversite] = useState("");
  const [grade, setGrade] = useState("");
  const [telephone, setTelephone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [googleScholarUrl, setGoogleScholarUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      // Redirect based on userType selected
      if (userType === "admin") {
        navigate("/admin");
      } else {
        navigate("/chercheur");
      }
    }
  }, [session, navigate, userType]);

  useEffect(() => {
    if (searchParams.get("register") === "true") setIsRegister(true);
  }, [searchParams]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("image/png")) {
        setError("Veuillez sélectionner une image PNG");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 5 MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error: err } = await login(email, password);
    if (err) {
      setError(err);
      setIsLoading(false);
      return;
    }
    // navigation handled by the useEffect above
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("nom", nom);
      formData.append("prenom", prenom);
      formData.append("cin", cin);
      formData.append("etablissement", etablissement);
      formData.append("universite", universite);
      formData.append("grade", grade);
      formData.append("telephone", telephone);
      formData.append("google_scholar_url", googleScholarUrl);
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de l'inscription");
      }

      const { token, user } = await response.json();
      localStorage.setItem("larodec_token", token);
      const { error: err } = await login(email, password);
      if (err) setError(err);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick-fill helpers for demo
  const fillAdmin = () => { setEmail("admin@larodec.tn"); setPassword("admin123"); setUserType("admin"); };
  const fillChercheur = () => { setEmail("chercheur@larodec.tn"); setPassword("chercheur123"); setUserType("chercheur"); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button onClick={() => navigate("/")} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all">
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LARODEC</h1>
          <p className="text-gray-600">Laboratoire de Recherche Opérationnelle, de Décision et de Contrôle de Processus</p>
          <p className="text-sm text-gray-500 mt-2">ISG - Institut Supérieur de Gestion</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button type="button" onClick={() => setIsRegister(false)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${!isRegister ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
              Connexion
            </button>
            <button type="button" onClick={() => setIsRegister(true)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${isRegister ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
              Inscription
            </button>
          </div>

          {!isRegister ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Connexion</h2>

              {/* Demo credentials hint */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <p className="font-semibold mb-1">Comptes de démonstration :</p>
                <button onClick={fillAdmin} className="underline mr-3">Admin — admin@larodec.tn / admin123</button>
                <button onClick={fillChercheur} className="underline">Chercheur — chercheur@larodec.tn / chercheur123</button>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setUserType("chercheur")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${userType === "chercheur" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                  Chercheur
                </button>
                <button type="button" onClick={() => setUserType("admin")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${userType === "admin" ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                  Administrateur
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="votre.email@exemple.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="••••••••" required />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Se connecter
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Créer un compte chercheur</h2>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <form onSubmit={handleRegister} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <label className="block text-sm font-semibold text-gray-900 mb-4">Photo de profil (PNG) *</label>
                  <div className="flex gap-6 items-start">
                    {/* Photo Preview */}
                    <div className="flex-shrink-0">
                      {photoPreview ? (
                        <div className="relative">
                          <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover border-2 border-blue-300" />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Upload Input */}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".png"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      <p className="text-xs text-gray-600 mt-2">Format: PNG • Taille max: 5 MB</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                      <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                      <input
                        type="text"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CIN *</label>
                      <input
                        type="text"
                        value={cin}
                        onChange={(e) => setCin(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Numéro de CIN"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="+216 XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Informations académiques
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Établissement *</label>
                      <input
                        type="text"
                        value={etablissement}
                        onChange={(e) => setEtablissement(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ex: Institut Supérieur de Gestion"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Université *</label>
                      <input
                        type="text"
                        value={universite}
                        onChange={(e) => setUniversite(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ex: Université de Tunis"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade *</label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                      >
                        <option value="">Sélectionnez votre grade</option>
                        <option value="Professeur">Professeur d'Enseignement Supérieur</option>
                        <option value="Maître de Conférences">Maître de Conférences</option>
                        <option value="Maître Assistant">Maître Assistant</option>
                        <option value="Assistant">Assistant</option>
                        <option value="Doctorant">Doctorant</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact & Scholar */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Contact & Profil académique
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="votre.email@exemple.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Lien Google Scholar
                      </label>
                      <input
                        type="url"
                        value={googleScholarUrl}
                        onChange={(e) => setGoogleScholarUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="https://scholar.google.com/citations?user=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Optionnel - Lien vers votre profil Google Scholar</p>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Sécurité
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères recommandé</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Créer mon compte
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          © 2025 LARODEC - ISG. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
