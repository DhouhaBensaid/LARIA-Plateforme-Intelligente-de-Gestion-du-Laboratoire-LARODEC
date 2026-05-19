import { useState, useEffect } from "react";
import { User, Mail, Building, GraduationCap, CreditCard, Phone, Link as LinkIcon, Upload, X, Edit3, Check, ExternalLink } from "lucide-react";
import { useAuth } from "../../lib/auth";

export function ProfilChercheur() {
  const { session, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [profile, setProfile] = useState({
    nom: session?.user.nom || "",
    prenom: session?.user.prenom || "",
    cin: session?.user.cin || "",
    email: session?.user.email || "",
    etablissement: session?.user.etablissement || "",
    universite: session?.user.universite || "",
    grade: session?.user.grade || "",
    telephone: session?.user.telephone || "",
    google_scholar_url: session?.user.google_scholar_url || "",
  });

  const getPrefix = (grade: string) => {
    if (!grade) return "Dr.";
    const gradeMap: Record<string, string> = {
      "Professeur": "Prof.",
      "Maître de Conférences": "Dr.",
      "Maître Assistant": "Dr.",
      "Assistant": "Dr.",
      "Doctorant": "Doctorant",
    };
    return gradeMap[grade] || "Dr.";
  };

  const userPrefix = profile.grade ? getPrefix(profile.grade) : "Dr.";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

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
      setError(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    
    setIsUploadingPhoto(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      
      const response = await fetch("http://localhost:3001/api/auth/photo", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("larodec_token")}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erreur lors de l'upload");
      }
      
      setPhotoFile(null);
      setPhotoPreview(null);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'upload de la photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = () => {
    setError(null);
    try {
      updateProfile(profile);
      setShowSuccess(true);
      setIsEditing(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
              <p className="text-sm text-slate-300">Gérez vos informations</p>
            </div>
            {!isEditing ? (
              <button 
                onClick={() => { setIsEditing(true); setError(null); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
              >
                <Edit3 className="w-4 h-4" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsEditing(false); setError(null); }}
                  className="px-5 py-2.5 border border-slate-600 text-slate-200 rounded-lg font-medium hover:bg-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Notifications */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Profil mis à jour avec succès!</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
              <X className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Header background */}
            <div className="h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"></div>
            
            <div className="px-8 pb-8">
              {/* Photo and Name */}
              <div className="flex items-end gap-6 mb-8 -mt-12 relative z-10">
                <div className="relative w-28 h-28">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-md" />
                  ) : session?.user.id ? (
                    <img src={`http://localhost:3001/api/auth/photo/${session.user.id}`} alt={`${profile.prenom} ${profile.nom}`} className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-md" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : null}
                  {!photoPreview && !session?.user.id && (
                    <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border-4 border-white shadow-md">
                      <span className="text-4xl font-bold text-slate-700">{(profile.prenom?.[0] || "").toUpperCase()}{(profile.nom?.[0] || "").toUpperCase()}</span>
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-2.5 rounded-full cursor-pointer hover:from-emerald-600 hover:to-teal-700 transition-all z-10 shadow-md">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept=".png" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{userPrefix} {profile.prenom} {profile.nom}</h2>
                  <p className="text-base text-emerald-600 font-medium">{profile.grade}</p>
                  {photoFile && isEditing && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={handleUploadPhoto} disabled={isUploadingPhoto} className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all">
                        {isUploadingPhoto ? "Upload..." : "Valider photo"}
                      </button>
                      <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-all">
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <User className="w-4 h-4 text-emerald-600" />
                    Informations Personnelles
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Nom</label>
                    <input type="text" name="nom" value={profile.nom} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Prénom</label>
                    <input type="text" name="prenom" value={profile.prenom} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      CIN
                    </label>
                    <input type="text" name="cin" value={profile.cin} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <input type="email" name="email" value={profile.email} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Téléphone
                    </label>
                    <input type="tel" name="telephone" value={profile.telephone} onChange={handleChange} disabled={!isEditing} placeholder="+216 XX XXX XXX" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Informations Professionnelles
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      Grade
                    </label>
                    <select name="grade" value={profile.grade} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm">
                      <option value="Professeur">Professeur</option>
                      <option value="Maître de Conférences">Maître de Conférences</option>
                      <option value="Maître Assistant">Maître Assistant</option>
                      <option value="Assistant">Assistant</option>
                      <option value="Doctorant">Doctorant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Établissement
                    </label>
                    <input type="text" name="etablissement" value={profile.etablissement} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Université</label>
                    <input type="text" name="universite" value={profile.universite} onChange={handleChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Google Scholar
                    </label>
                    <div className="flex gap-2">
                      <input type="url" name="google_scholar_url" value={profile.google_scholar_url} onChange={handleChange} disabled={!isEditing} placeholder="https://scholar.google.com/..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all text-sm" />
                      {profile.google_scholar_url && !isEditing && (
                        <a href={profile.google_scholar_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
