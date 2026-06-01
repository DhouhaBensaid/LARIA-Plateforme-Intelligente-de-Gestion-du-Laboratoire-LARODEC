import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPin, Clock, Share2, Heart, ExternalLink } from "lucide-react";
import { useLang } from "../../lib/useLang";

export function EvenementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/public/events`);
        if (response.ok) {
          const data = await response.json();
          const found = data.find((e: any) => e.id === parseInt(id || "0"));
          setEvent(found);
        }
      } catch (err) {
        console.error("Erreur chargement événement:", err);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement de l'événement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 font-medium">Événement non trouvé</p>
          <button onClick={() => navigate("/")} className="text-blue-600 hover:text-blue-700 font-bold">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header avec image de fond */}
      <div className="relative h-96 overflow-hidden bg-gray-900">
        {event.url_photo ? (
          <img 
            src={event.url_photo}
            alt={event.titre}
            className="w-full h-full object-cover"
            style={{
              filter: 'brightness(1.1) contrast(1.15) saturate(1.1) blur(0px)',
              WebkitFontSmoothing: 'antialiased',
              backfaceVisibility: 'hidden',
            }}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600" />
        )}
        
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Contenu du header */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 w-fit hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">{t.eventDetail.back}</span>
          </button>
          
          <div>
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-4">
              <span className="text-white text-sm font-bold">Événement LARODEC</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-lg">{event.titre}</h1>
            <p className="text-white/90 text-lg font-medium drop-shadow-md">Événement du laboratoire LARODEC</p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Actions rapides */}
            <div className="flex gap-3">
              <button 
                onClick={() => setLiked(!liked)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  liked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                <span>{liked ? t.eventDetail.liked : t.eventDetail.like}</span>
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                <Share2 className="w-5 h-5" />
                <span>{t.eventDetail.share}</span>
              </button>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.eventDetail.about}</h2>
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {event.description}
              </p>
            </div>

            {/* Informations pratiques */}
            {event.lieu && (
              <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t.eventDetail.practical}</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">{t.eventDetail.lieu}</p>
                      {/* Lieu cliquable → Google Maps */}
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(event.lieu)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 font-bold text-lg hover:underline flex items-center gap-1.5"
                      >
                        {event.lieu}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lien site officiel IBI 2026 */}
            {event.url_site && (
              <a href={event.url_site} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-all font-semibold text-blue-700">
                <ExternalLink className="w-5 h-5 flex-shrink-0" />
                {t.eventDetail.officialSite}
              </a>
            )}
          </div>

          {/* Sidebar - Détails */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 sticky top-6">
              {/* Header coloré */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 h-1" />
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">{t.eventDetail.details}</h3>

                {/* Date */}
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t.eventDetail.date}</p>
                      {event.date_debut && (
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(event.date_debut).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
                            weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Heure */}
                {event.date_debut && (
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t.eventDetail.heure}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(event.date_debut).toLocaleTimeString(lang === "en" ? "en-GB" : "fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statut */}
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-bold text-gray-900">{t.eventDetail.confirmed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
