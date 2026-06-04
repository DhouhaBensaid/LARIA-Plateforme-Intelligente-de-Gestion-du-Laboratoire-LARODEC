import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Mail, Phone, MapPin, ArrowLeft, BookOpen, ExternalLink, Link2 } from "lucide-react";
import { BackgroundLogo } from "./BackgroundLogo";

// ── Initials avatar (circle, no photo dependency) ──────────────────────────
function InitialsAvatar({ name, size = 120 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg, #1A73E8 0%, #00a8cc 100%)",
      }}
    >
      <span className="font-bold text-white" style={{ fontSize: size * 0.32 }}>{initials}</span>
    </div>
  );
}

// ── Profile photo circle ──────────────────────────────────────────────────
function ProfilePhoto({ researcherId, name, size = 120 }: { researcherId?: number; name: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!researcherId) return;
    fetch(`http://localhost:3001/api/public/researcher-photo/${researcherId}`)
      .then(r => r.json())
      .then(d => { if (d.photo_url) setUrl(d.photo_url); else setError(true); })
      .catch(() => setError(true));
  }, [researcherId]);

  if (url && !error) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-lg" style={{ width: size, height: size }}>
        <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} />
      </div>
    );
  }
  return <InitialsAvatar name={name} size={size} />;
}

export function ProfilPublic() {
  const { nomPrenom } = useParams();
  const navigate = useNavigate();
  const [researcher, setResearcher] = useState<any>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const decoded = nomPrenom ? decodeURIComponent(nomPrenom) : "";

        // Load researcher
        const res = await fetch(`http://localhost:3001/api/public/researcher/${encodeURIComponent(decoded)}`);
        if (!res.ok) { setError(`Erreur: ${res.status}`); return; }
        const data = await res.json();
        setResearcher(data);

        // Load publications, sorted by year desc
        const pubRes = await fetch(`http://localhost:3001/api/public/researcher-publications/${encodeURIComponent(decoded)}`);
        if (pubRes.ok) {
          const pubs = await pubRes.json();
          const sorted = Array.isArray(pubs) ? [...pubs].sort((a, b) => (b.annee || 0) - (a.annee || 0)) : [];
          setPublications(sorted);
        }

        // Load all member names for coauthor linking
        const cats = ["Corps A", "Corps B", "Doctorant", "Post-Doc"];
        const names: string[] = [];
        await Promise.allSettled(cats.map(async c => {
          const r = await fetch(`http://localhost:3001/api/public/researchers?categorie=${c}`);
          if (r.ok) {
            const d = await r.json();
            (Array.isArray(d) ? d : []).forEach((m: any) => { if (m.nom_prenom) names.push(m.nom_prenom); });
          }
        }));
        setAllMembers(names);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [nomPrenom]);

  // Fuzzy match: remove accents, lowercase, check if names overlap
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const findMemberMatch = (authorName: string): string | null => {
    const normAuthor = normalize(authorName);
    // Check exact or reversed name match
    for (const m of allMembers) {
      const normMember = normalize(m);
      if (normMember === normAuthor) return m;
      // Try "Prenom Nom" vs "Nom Prenom" reversal
      const parts = normMember.split(" ");
      if (parts.length >= 2) {
        const reversed = [...parts].reverse().join(" ");
        if (reversed === normAuthor) return m;
      }
      // Try partial: both words present
      const authorParts = normAuthor.split(" ").filter(p => p.length > 2);
      if (authorParts.length >= 2 && authorParts.every(p => normMember.includes(p))) return m;
    }
    return null;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!researcher) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <p className="text-gray-600 mb-2">Chercheur non trouvé</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button onClick={() => navigate("/annuaire")} className="text-blue-600 hover:underline font-semibold">← Retour à l'annuaire</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ position:"relative", overflow:"hidden" }}>
      <BackgroundLogo size={320} opacity={0.10} rotate={-8} top={60} right={-50} />

      {/* ── Header compact ── */}
      <div className="bg-gradient-to-r from-[#1A1A4E] to-[#1A73E8] text-white py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/annuaire")}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:bg-white/20 border border-white/30"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Membres</span>
          </button>
          <h1 className="text-xl font-bold truncate">{researcher.nom_prenom}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Profile card ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden sticky top-6">
              {/* Photo centered */}
              <div className="flex flex-col items-center pt-8 pb-5 px-6 border-b border-gray-100">
                <ProfilePhoto researcherId={researcher.id} name={researcher.nom_prenom} size={120} />
                <h2 className="mt-4 text-xl font-bold text-gray-900 text-center leading-tight">{researcher.nom_prenom}</h2>
                {(researcher.grade || researcher.categorie) && (
                  <p className="text-sm font-semibold text-center mt-1 italic" style={{ color: "#1A73E8" }}>
                    {researcher.grade || researcher.categorie}
                  </p>
                )}
              </div>

              {/* Contact info */}
              <div className="px-6 py-5 space-y-3">
                {researcher.telephone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <a href={`tel:${researcher.telephone}`} className="text-sm text-blue-600 hover:underline break-all">{researcher.telephone}</a>
                  </div>
                )}
                {researcher.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <a href={`mailto:${researcher.email}`} className="text-sm text-blue-600 hover:underline break-all">{researcher.email}</a>
                  </div>
                )}
                {researcher.etablissement && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">{researcher.etablissement}</span>
                  </div>
                )}
              </div>

              {/* Academic profile links */}
              <div className="px-6 pb-6 flex flex-wrap gap-2">
                {researcher.url_google_scholar && (
                  <a href={researcher.url_google_scholar} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm"
                    style={{ background: "#EEF4FF", color: "#1A73E8", borderColor: "#c7d9f9" }}>
                    <Link2 className="w-3 h-3" /> Google Scholar
                  </a>
                )}
                {researcher.orcid && (
                  <a href={`https://orcid.org/${researcher.orcid}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm"
                    style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
                    <Link2 className="w-3 h-3" /> ORCID
                  </a>
                )}
                {researcher.url_scopus && (
                  <a href={researcher.url_scopus} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm"
                    style={{ background: "#fff7ed", color: "#ea6c00", borderColor: "#fed7aa" }}>
                    <Link2 className="w-3 h-3" /> Scopus
                  </a>
                )}
              </div>

              {/* Pub count */}
              <div className="mx-6 mb-6 px-5 py-3 rounded-xl flex items-center gap-3" style={{ background: "#EEF4FF" }}>
                <BookOpen className="w-5 h-5 flex-shrink-0" style={{ color: "#1A73E8" }} />
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900 text-lg">{publications.length}</span>
                  <span className="ml-1">publication{publications.length > 1 ? "s" : ""}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ── Publications ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6" style={{ color: "#1A73E8" }} />
              <h3 className="text-2xl font-bold text-gray-900">Publications</h3>
            </div>

            {publications.length > 0 ? (
              <div className="space-y-4">
                {publications.map((pub: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200" style={{ borderLeft: "3px solid #1A73E8" }}>
                    {/* Title — clickable if DOI */}
                    {pub.doi ? (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-1 leading-snug">
                        {pub.titre}
                      </a>
                    ) : (
                      <h4 className="text-base font-bold text-gray-900 mb-1 leading-snug">{pub.titre}</h4>
                    )}

                    {/* Journal italic + year pill */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {(pub.journal || pub.journal_ou_editeur) && (
                        <span className="text-sm text-gray-500 italic">{pub.journal || pub.journal_ou_editeur}</span>
                      )}
                      {pub.annee && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{pub.annee}</span>
                      )}
                      {pub.indexation && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#EEF4FF", color: "#1A73E8" }}>{pub.indexation}</span>
                      )}
                      {pub.impact_factor && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">IF {pub.impact_factor}</span>
                      )}
                    </div>

                    {/* Auteurs with LARODEC member linking */}
                    {pub.auteurs && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {pub.auteurs.split(",").map((auteur: string, i: number) => {
                          const name = auteur.trim();
                          const match = findMemberMatch(name);
                          if (match) {
                            return (
                              <button key={i}
                                onClick={() => navigate(`/public/researcher/${encodeURIComponent(match)}`)}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all hover:shadow-sm"
                                style={{ background: "#EEF4FF", color: "#1A73E8" }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                                {name}
                              </button>
                            );
                          }
                          return (
                            <span key={i} className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{name}</span>
                          );
                        })}
                      </div>
                    )}

                    {/* DOI link */}
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold mt-1 hover:underline"
                        style={{ color: "#1A73E8" }}>
                        <ExternalLink className="w-3 h-3" />
                        DOI: {pub.doi}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune publication trouvée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
