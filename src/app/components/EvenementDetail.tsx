import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";
import { useLang } from "../../lib/useLang";
import { BackgroundLogo } from "./BackgroundLogo";

export function EvenementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ position:"relative", overflow:"hidden" }}>
      <BackgroundLogo size={320} opacity={0.10} rotate={-8} top={40} right={-50} />
      {/* ── Header banner ── */}
      <div className="relative h-96 overflow-hidden bg-gray-900">
        {event.url_photo ? (
          <img
            src={event.url_photo}
            alt={event.titre}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600" />
        )}

        {/* Improved gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,20,50,0.30) 0%, rgba(10,20,50,0.75) 100%)" }} />

        {/* Header content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          {/* Back button — pill style */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 w-fit px-4 py-2 rounded-full transition-all backdrop-blur-sm border border-white/30 text-white font-semibold text-sm hover:bg-white/20"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.eventDetail.back}</span>
          </button>

          <div>
            {/* Glassmorphism badge */}
            <div className="inline-block px-4 py-2 mb-4 rounded-full border border-white/30 backdrop-blur-[8px] font-bold text-white text-sm"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              Événement LARODEC
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-3 drop-shadow-lg leading-tight">{event.titre}</h1>
            <p className="text-white/85 text-lg font-medium drop-shadow-md">Événement du laboratoire LARODEC</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ color: "#374151" }}>{t.eventDetail.about}</h2>
              <p className="text-gray-700 leading-[1.7] whitespace-pre-wrap" style={{ fontSize: 16, color: "#374151" }}>
                {event.description}
              </p>
            </div>

            {/* Lieu */}
            {event.lieu && (
              <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t.eventDetail.practical}</h3>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">{t.eventDetail.lieu}</p>
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
            )}

            {/* Official site */}
            {event.url_site && (
              <a href={event.url_site} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-all font-semibold text-blue-700">
                <ExternalLink className="w-5 h-5 flex-shrink-0" />
                {t.eventDetail.officialSite}
              </a>
            )}
          </div>

          {/* Sidebar — Details (no heure) */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl overflow-hidden sticky top-6 shadow-md"
              style={{ background: "#F8FAFF", border: "1px solid #e2e8f0" }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 h-1" />
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-8">{t.eventDetail.details}</h3>

                {/* Date only — no heure */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6" style={{ color: "#00D4FF" }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t.eventDetail.date}</p>
                      {event.date_debut && (
                        <p className="text-base font-bold text-gray-900">
                          {new Date(event.date_debut).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
                            weekday: "short", year: "numeric", month: "long", day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Type */}
                {event.type && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Type</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{event.type}</span>
                  </div>
                )}

                {/* Status */}
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
