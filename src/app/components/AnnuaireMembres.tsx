import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Mail, Phone, ArrowLeft, Search } from "lucide-react";
import { PhotoAvatar } from "./PhotoAvatar";

export function AnnuaireMembres() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categorie") || "Corps A");

  const categories = [
    { key: "Corps A", label: "Conseil Scientifique" },
    { key: "Corps B", label: "Maitres Assistants" },
    { key: "Doctorant", label: "Doctorants" },
    { key: "Post-Doc", label: "Post-Doctorants" },
  ];

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/public/researchers?categorie=${selectedCategory}`);
        if (response.ok) {
          const data = await response.json();
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Erreur chargement membres:", err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [selectedCategory]);

  useEffect(() => {
    const filtered = members.filter(member =>
      member.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 hover:bg-white/20 px-3 py-2 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          <h1 className="text-4xl font-bold mb-2">Annuaire des Membres</h1>
          <p className="text-blue-100">Découvrez l'équipe de recherche du LARODEC</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filtres */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSearchTerm("");
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  selectedCategory === cat.key
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des membres...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div>
            <p className="text-gray-600 mb-8 font-semibold">{filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""} trouvé{filteredMembers.length > 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMembers.map((member: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/public/researcher/${encodeURIComponent(member.nom_prenom)}`)}
                  className="group text-left bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                >
                  <PhotoAvatar
                    photoUrl={member.url_photo ? `http://localhost:3001${member.url_photo}` : undefined}
                    name={member.nom_prenom}
                    size="card"
                  />
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{member.nom_prenom}</h3>
                    <p className="text-sm text-blue-600 font-semibold mb-6">{member.grade || member.categorie}</p>
                    
                    <div className="space-y-3 text-sm mb-6">
                      {member.telephone && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="break-all">{member.telephone}</span>
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <span className="inline-block text-sm text-blue-600 font-semibold group-hover:text-blue-700 group-hover:underline transition-all">Voir le profil →</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucun membre trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
