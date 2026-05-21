import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Mail, Phone, MapPin, ArrowLeft, BookOpen, Users, ExternalLink } from "lucide-react";
import { PhotoAvatar } from "./PhotoAvatar";

export function ProfilPublic() {
  const { nomPrenom } = useParams();
  const navigate = useNavigate();
  const [researcher, setResearcher] = useState<any>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResearcher = async () => {
      try {
        // Decode the parameter in case it's URL encoded
        const decodedName = nomPrenom ? decodeURIComponent(nomPrenom) : "";
        const url = `http://localhost:3001/api/public/researcher/${encodeURIComponent(decodedName)}`;
        console.log("Fetching researcher from:", url);
        console.log("Decoded name:", decodedName);
        
        const response = await fetch(url);
        console.log("Response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Researcher data:", data);
          setResearcher(data);
          
          // Charger les publications
          const pubResponse = await fetch(`http://localhost:3001/api/public/researcher-publications/${encodeURIComponent(decodedName)}`);
          if (pubResponse.ok) {
            const pubData = await pubResponse.json();
            setPublications(Array.isArray(pubData) ? pubData : []);
          }
        } else {
          console.error("Failed to fetch researcher, status:", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
          setError(`Erreur: ${response.status}`);
        }
      } catch (err) {
        console.error("Erreur chargement profil:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    loadResearcher();
  }, [nomPrenom]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chercheur non trouvé</p>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <p className="text-gray-500 text-sm mb-4">Paramètre: {nomPrenom}</p>
          <button onClick={() => navigate("/")} className="text-blue-600 hover:underline">Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-6 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/")} className="hover:bg-white/20 p-2 rounded-lg transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">{researcher.nom_prenom}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Profil Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-6">
                  <PhotoAvatar
                    photoUrl={researcher.id ? `http://localhost:3001/api/public/researcher-photo/${researcher.id}` : undefined}
                    name={researcher.nom_prenom}
                    size="profile"
                    isJsonResponse={true}
                  />
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{researcher.nom_prenom}</h2>
                <p className="text-lg text-blue-600 font-semibold mb-8">{researcher.grade || researcher.categorie}</p>
                
                <div className="space-y-5 mb-8 pb-8 border-b border-gray-200">
                  {researcher.telephone && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <a href={`tel:${researcher.telephone}`} className="text-blue-600 hover:underline font-medium break-all">
                        {researcher.telephone}
                      </a>
                    </div>
                  )}
                  {researcher.email && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <a href={`mailto:${researcher.email}`} className="text-blue-600 hover:underline font-medium break-all">
                        {researcher.email}
                      </a>
                    </div>
                  )}
                  {researcher.etablissement && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{researcher.etablissement}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold text-gray-900 text-lg">{publications.length}</span>
                    <span className="ml-2">publication{publications.length > 1 ? "s" : ""}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Publications */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h3 className="text-3xl font-bold text-gray-900">Publications</h3>
              </div>

              {publications.length > 0 ? (
                <div className="space-y-4">
                  {publications.map((pub: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{pub.titre}</h4>
                      
                      {(pub.journal || pub.journal_ou_editeur) && (
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-semibold">Journal:</span> {pub.journal || pub.journal_ou_editeur}
                        </p>
                      )}

                      {pub.auteurs && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Auteurs:</p>
                          <div className="flex flex-wrap gap-2">
                            {pub.auteurs.split(",").map((auteur: string, i: number) => {
                              const trimmedAuteur = auteur.trim();
                              const isInLab = publications.some((p: any) => p.auteurs?.includes(trimmedAuteur));
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    if (isInLab) navigate(`/public/researcher/${encodeURIComponent(trimmedAuteur)}`);
                                  }}
                                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                                    isInLab
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {trimmedAuteur}
                                  {isInLab && <ExternalLink className="w-3 h-3 inline ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {pub.annee && <span>📅 {pub.annee}</span>}
                        {pub.indexation && <span>📊 {pub.indexation}</span>}
                        {pub.impact_factor && <span>⭐ IF: {pub.impact_factor}</span>}
                      </div>

                      {pub.doi && (
                        <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-3 inline-block">
                          DOI: {pub.doi}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune publication trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
