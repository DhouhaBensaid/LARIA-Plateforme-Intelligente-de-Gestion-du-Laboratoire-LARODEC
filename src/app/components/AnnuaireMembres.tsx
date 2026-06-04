import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, Users, X } from "lucide-react";
import { BackgroundLogo } from "./BackgroundLogo";

// ── Compact member avatar (80px circle) ──────────────────────────────────────
function MemberAvatar({ memberId, name }: { memberId?: number; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!memberId) return;
    fetch(`http://localhost:3001/api/public/researcher-photo/${memberId}`)
      .then(r => r.json())
      .then(d => { if (d.photo_url) setUrl(d.photo_url); else setErr(true); })
      .catch(() => setErr(true));
  }, [memberId]);

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (url && !err) {
    return (
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
        <img src={url} alt={name} className="w-full h-full object-cover" onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md"
      style={{ background: "linear-gradient(135deg, #1A73E8 0%, #00a8cc 100%)" }}>
      <span className="text-lg font-bold text-white">{initials}</span>
    </div>
  );
}

const ALL_CATS = ["Corps A", "Corps B", "Doctorant", "Post-Doc"];

export function AnnuaireMembres() {
  const navigate = useNavigate();
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [filtered, setFiltered]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load all members from all categories at once
  useEffect(() => {
    setLoading(true);
    Promise.allSettled(
      ALL_CATS.map(cat =>
        fetch(`http://localhost:3001/api/public/researchers?categorie=${cat}`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      )
    ).then(results => {
      const all: any[] = [];
      results.forEach(r => {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          all.push(...r.value);
        }
      });
      // Deduplicate by id
      const seen = new Set<number>();
      const unique = all.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setAllMembers(unique);
      setFiltered(unique);
    }).finally(() => setLoading(false));
  }, []);

  // Generic search — name, grade, etablissement, universite, categorie
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(allMembers);
      return;
    }
    const q = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    setFiltered(
      allMembers.filter(m =>
        norm(m.nom_prenom).includes(q) ||
        norm(m.grade).includes(q) ||
        norm(m.categorie).includes(q) ||
        norm(m.etablissement).includes(q) ||
        norm(m.universite).includes(q) ||
        norm(m.specialite).includes(q)
      )
    );
  }, [searchTerm, allMembers]);

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFF", position: "relative", overflow: "hidden" }}>

      {/* ── Watermark BackgroundLogo ── */}
      <BackgroundLogo size={340} opacity={0.10} rotate={10} bottom={-40} right={-60} />
      {/* ── Header ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1A1A4E 0%, #1A73E8 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border border-white/30 hover:bg-white/20"
            style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </button>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1">Membres du laboratoire</h1>
              <p className="text-blue-200 text-sm">Équipe de recherche LARODEC — ISG Tunis</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Users className="w-5 h-5 text-white/80" />
              <span className="text-white font-bold text-lg">{filtered.length}</span>
              <span className="text-white/70 text-sm">chercheur{filtered.length > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ── Generic search bar ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un membre, une thématique, une institution…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2 ml-1">
              {filtered.length > 0
                ? <><span className="font-semibold text-gray-800">{filtered.length}</span> membre{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</>
                : "Aucun membre trouvé pour cette recherche — essayez d'autres mots-clés"}
            </p>
          )}
        </div>

        {/* ── Results ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((member: any, idx: number) => (
              <button key={idx}
                onClick={() => navigate(`/public/researcher/${encodeURIComponent(member.nom_prenom)}`)}
                className="group relative text-left bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,115,232,0.13)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}>

                {/* Hover top accent */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "linear-gradient(90deg, #1A73E8, #00a8cc)" }} />

                <MemberAvatar memberId={member.id} name={member.nom_prenom} />

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5 group-hover:text-blue-600 transition-colors truncate">
                    {member.nom_prenom}
                  </h3>
                  <p className="text-xs font-semibold mb-1 truncate" style={{ color: "#1A73E8" }}>
                    {member.grade || member.categorie}
                  </p>
                  {member.etablissement && (
                    <p className="text-xs text-gray-400 truncate">{member.etablissement}</p>
                  )}
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1A73E8" }}>
                    Voir le profil →
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">Aucun membre trouvé pour cette recherche</p>
            <p className="text-gray-400 text-sm">Essayez d'autres mots-clés</p>
          </div>
        )}
      </div>
    </div>
  );
}
