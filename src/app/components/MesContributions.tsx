
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Search, RefreshCw, CheckCircle2, Hourglass, XCircle,
  Copy, Check, ChevronDown, ChevronUp, ExternalLink,
  Sparkles, Filter, FileText, Plus, X, AlertCircle, ArchiveX,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { articlesApi } from "../../lib/api";

const API = "http://localhost:3001";
const token = () => localStorage.getItem("larodec_token") ?? "";

function formatAPA(pub: any): string {
  const auteurs = pub.auteurs || "";
  const annee   = pub.annee   || "s.d.";
  const titre   = pub.titre   || "";
  const journal = pub.journal_ou_editeur || "";
  const doi     = pub.doi     || "";
  let ref = `${auteurs} (${annee}). ${titre}.`;
  if (journal) ref += ` ${journal}.`;
  if (doi)     ref += ` https://doi.org/${doi}`;
  return ref;
}

type ScraperResult = {
  paperId: string; titre: string; journal: string; annee: number;
  auteurs: string; doi: string; source: string; indexation: string;
  citation_apa: string; url: string;
};

export function MesContributions() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type"); // journal | conference | book | pending

  const [pubs,        setPubs]        = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [yearFilter,  setYearFilter]  = useState<number | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [copied,      setCopied]      = useState<string | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [validating,  setValidating]  = useState<number | null>(null);

  // scraper
  const [scraping,       setScraping]       = useState(false);
  const [scraperResults, setScraperResults] = useState<ScraperResult[]>([]);
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [importing,      setImporting]      = useState(false);
  const [importDone,     setImportDone]     = useState(0);
  const [scraperError,   setScraperError]   = useState<string | null>(null);
  const [showScraper,    setShowScraper]    = useState(false);
  const [showRejected,   setShowRejected]   = useState(false);

  const fullName = session?.user.nom && session?.user.prenom
    ? `${session.user.nom} ${session.user.prenom}`.toUpperCase() : "";
  const displayName = session?.user.prenom && session?.user.nom
    ? `${session.user.prenom} ${session.user.nom}` : "vous";

  useEffect(() => { loadPubs(); }, [session]);

  const loadPubs = async () => {
    try {
      setLoading(true);
      const res = fullName
        ? await articlesApi.getAll({ chercheur: fullName, limit: 200 })
        : { items: [] };
      setPubs(res.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg: string, type: "success"|"error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirm = async (id: number) => {
    setValidating(id);
    try {
      const res = await fetch(`${API}/api/articles/${id}/validate-chercheur`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ validee_chercheur: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }
      setPubs(prev => prev.map(p => p.id === id ? { ...p, validee_chercheur: true, statut: "valide" } : p));
      showToast("Publication confirmée ✓", "success");
    } catch (e: any) { showToast(e.message || "Erreur lors de la confirmation", "error"); }
    finally { setValidating(null); }
  };

  const handleReject = async (id: number) => {
    setValidating(id);
    try {
      const res = await fetch(`${API}/api/articles/${id}/validate-chercheur`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ rejetee_chercheur: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur ${res.status}`);
      }
      // Keep in list but mark as rejected — allows re-confirmation
      setPubs(prev => prev.map(p => p.id === id ? { ...p, rejetee_chercheur: true, validee_chercheur: false, statut: "rejete" } : p));
      showToast("Publication rejetée — vous pouvez la re-confirmer si nécessaire", "success");
    } catch (e: any) { showToast(e.message || "Erreur lors du rejet", "error"); }
    finally { setValidating(null); }
  };

  // ── Scraper ──────────────────────────────────────────────────────────────
  const runScraper = async () => {
    if (!fullName) return;
    setScraping(true); setScraperError(null); setScraperResults([]);
    try {
      const res = await fetch(`${API}/api/scraper/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ authorName: fullName, sources: ["dblp", "openalex", "scopus"] }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Erreur scraping"); }
      const data = await res.json();
      const results: ScraperResult[] = data.results || [];
      setScraperResults(results);
      // Pre-select all new (not already in pubs)
      const existingDois = new Set(pubs.map((p: any) => p.doi).filter(Boolean));
      const existingTitles = new Set(pubs.map((p: any) => (p.titre || "").toLowerCase().trim()));
      const newIds = new Set(
        results
          .filter(r => !existingDois.has(r.doi) && !existingTitles.has((r.titre || "").toLowerCase().trim()))
          .map(r => r.paperId)
      );
      setSelected(newIds);
    } catch (e: any) {
      setScraperError(e.message || "Erreur lors du scraping");
    } finally { setScraping(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll   = () => setSelected(new Set(scraperResults.map(r => r.paperId)));
  const deselectAll = () => setSelected(new Set());

  // ── Import (soumet pour validation admin) ────────────────────────────────
  const importSelected = async () => {
    const toImport = scraperResults.filter(r => selected.has(r.paperId));
    if (!toImport.length) return;
    setImporting(true);
    try {
      const res = await fetch(`${API}/api/scraper/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ papers: toImport }),
      });
      if (!res.ok) throw new Error("Erreur import");
      const data = await res.json();
      setImportDone(data.imported || toImport.length);
      setScraperResults([]);
      setSelected(new Set());
      setShowScraper(false);
      await loadPubs();
    } catch (e: any) {
      setScraperError(e.message || "Erreur import");
    } finally { setImporting(false); }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const years = [...new Set(pubs.map(p => Number(p.annee)).filter(Boolean))].sort((a, b) => b - a);
  const pendingValidation = pubs.filter(p => !p.validee_chercheur && !p.rejetee_chercheur);

  const typeFiltered = (() => {
    if (!typeParam) return pubs;
    if (typeParam === "pending") return pendingValidation;
    if (typeParam === "journal") return pubs.filter(p => /journal|article/i.test(p.type_publication || ""));
    if (typeParam === "conference") return pubs.filter(p => /conference|workshop|proceedings/i.test(p.type_publication || ""));
    if (typeParam === "book") return pubs.filter(p => /book|chapter|ouvrage/i.test(p.type_publication || ""));
    return pubs;
  })();

  const filtered = typeFiltered.filter(p => {
    const ms = !search || [p.titre, p.auteurs, p.journal_ou_editeur].some((v: any) => v?.toLowerCase().includes(search.toLowerCase()));
    const my = !yearFilter || Number(p.annee) === yearFilter;
    return ms && my && !p.rejetee_chercheur; // rejected pubs hidden from main list
  });
  const rejectedPubs = pubs.filter(p => p.rejetee_chercheur);
  const validated = pubs.filter(p => p.statut === "valide" || p.validee_chercheur).length;
  const pending   = pubs.filter(p => !p.validee_chercheur && !p.rejetee_chercheur).length;
  const rejected  = pubs.filter(p => p.rejetee_chercheur).length;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text); setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-blue-50/20">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-8 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
              <FileText className="w-7 h-7" />Mes Publications
            </h1>
            <p className="text-cyan-100 text-sm">Gérez et validez vos publications scientifiques</p>
          </div>
          <button onClick={() => { setShowScraper(true); setScraperResults([]); setScraperError(null); setImportDone(0); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-cyan-700 rounded-xl font-semibold hover:bg-cyan-50 transition-all shadow-md text-sm">
            <Sparkles className="w-4 h-4" />Synchroniser via Scraper
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Import success banner */}
        {importDone > 0 && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              {importDone} publication{importDone > 1 ? "s" : ""} soumise{importDone > 1 ? "s" : ""} pour validation. Vous pouvez les confirmer ou rejeter ci-dessous.
            </p>
            <button onClick={() => setImportDone(0)} className="ml-auto text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{pubs.length}</p>
            <p className="text-sm text-slate-500 mt-1">Total publications</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-3xl font-bold text-emerald-600">{validated}</p>
            </div>
            <p className="text-sm text-slate-500">Confirmées</p>
          </div>
          <div className="bg-white rounded-xl border border-orange-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Hourglass className="w-4 h-4 text-orange-500" />
              <p className="text-3xl font-bold text-orange-500">{pending}</p>
            </div>
            <p className="text-sm text-slate-500">En attente</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <p className="text-3xl font-bold text-red-400">{rejected}</p>
            </div>
            <p className="text-sm text-slate-500">Rejetées</p>
          </div>
        </div>

        {/* Pending validation notice */}
        {pending > 0 && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800">{pending} publication{pending > 1 ? "s" : ""} en attente de votre validation, {displayName}</p>
              <p className="text-xs text-orange-600 mt-0.5">Confirmez celles qui vous appartiennent ou rejetez les erreurs.</p>
            </div>
          </div>
        )}

        {/* ── Type label from sidebar filter ── */}
        {typeParam && (
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-xl w-fit text-sm font-medium text-cyan-700">
            <Filter className="w-4 h-4" />
            {typeParam === "journal" && "Revues"}
            {typeParam === "conference" && "Conférences & Workshops"}
            {typeParam === "book" && "Ouvrages & Chapitres"}
            {typeParam === "pending" && `En attente de ma validation (${pendingValidation.length})`}
            <span className="text-cyan-500 font-normal">— {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {typeParam === "pending" && pendingValidation.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">Ces publications ont été importées automatiquement. Confirmez celles qui vous appartiennent ou rejetez les erreurs.</p>
          </div>
        )}

        {/* ── SCRAPER PANEL ── */}
        {showScraper && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="font-bold text-slate-800">Synchronisation automatique</h3>
                  <p className="text-xs text-slate-500">Sources : DBLP · OpenAlex · Scopus</p>
                </div>
              </div>
              <button onClick={() => setShowScraper(false)} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {scraperError && (
                <div className="mb-4 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{scraperError}</span>
                </div>
              )}

              {scraperResults.length === 0 && !scraping && (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm mb-4">Lancez le scraper pour trouver vos publications sur les bases de données scientifiques.</p>
                  <button onClick={runScraper} disabled={scraping}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-blue-700 transition-all shadow-md disabled:opacity-50">
                    <RefreshCw className="w-4 h-4" />Lancer le scraping
                  </button>
                </div>
              )}

              {scraping && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 text-sm font-medium">Recherche en cours sur DBLP, OpenAlex, Scopus...</p>
                  <p className="text-slate-400 text-xs mt-1">Cela peut prendre quelques secondes</p>
                </div>
              )}

              {scraperResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-slate-700">
                      {scraperResults.length} publication{scraperResults.length > 1 ? "s" : ""} trouvée{scraperResults.length > 1 ? "s" : ""}
                      <span className="ml-2 text-slate-400 font-normal">({selected.size} sélectionnée{selected.size > 1 ? "s" : ""})</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={selectAll} className="text-xs text-blue-600 hover:underline font-medium">Tout sélectionner</button>
                      <span className="text-slate-300">·</span>
                      <button onClick={deselectAll} className="text-xs text-slate-500 hover:underline">Désélectionner</button>
                      <button onClick={runScraper} disabled={scraping} className="text-xs text-violet-600 hover:underline font-medium flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />Relancer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 mb-4">
                    {scraperResults.map(r => {
                      const isSelected = selected.has(r.paperId);
                      const alreadyExists = pubs.some(p =>
                        (r.doi && p.doi === r.doi) ||
                        (r.titre && (p.titre || "").toLowerCase().trim() === r.titre.toLowerCase().trim())
                      );
                      return (
                        <div key={r.paperId}
                          onClick={() => !alreadyExists && toggleSelect(r.paperId)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            alreadyExists
                              ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                              : isSelected
                              ? "bg-blue-50 border-blue-300 shadow-sm"
                              : "bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30"
                          }`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            alreadyExists ? "border-slate-300 bg-slate-100" :
                            isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                          }`}>
                            {alreadyExists
                              ? <Check className="w-3 h-3 text-slate-400" />
                              : isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{r.titre}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {r.annee && <span className="text-xs text-slate-500">{r.annee}</span>}
                              {r.journal && <span className="text-xs text-slate-400 italic truncate max-w-xs">{r.journal}</span>}
                              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{r.source}</span>
                              {r.indexation && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{r.indexation}</span>}
                              {alreadyExists && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Déjà importée</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button onClick={importSelected} disabled={importing || selected.size === 0}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md disabled:opacity-50">
                      {importing
                        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Plus className="w-4 h-4" />}
                      Soumettre {selected.size > 0 ? `(${selected.size})` : ""} pour validation
                    </button>
                    <p className="text-xs text-slate-400">Les publications importées seront soumises à votre validation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Rechercher titre, auteur, journal..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" />
            </div>
            <select value={yearFilter ?? ""} onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none bg-white">
              <option value="">Toutes les années</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
              <Filter className="w-4 h-4" />{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Publications list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-2">Aucune publication trouvée</p>
            <button onClick={() => setShowScraper(true)}
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-all">
              <Sparkles className="w-4 h-4" />Synchroniser via Scraper
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pub, idx) => {
              const pid    = `pub-${idx}`;
              const isExp  = expanded === pid;
              const apa    = formatAPA(pub);
              const isCop  = copied === pid;
              const status = pub.statut;
              return (
                <div key={pid} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <button onClick={() => setExpanded(isExp ? null : pid)}
                    className="w-full text-left px-6 py-4 hover:bg-cyan-50/30 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-semibold text-sm leading-snug mb-2 group-hover:text-cyan-700 transition-colors">{pub.titre}</p>
                        <div className="flex flex-wrap gap-2">
                          {pub.annee && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{pub.annee}</span>}
                          {pub.type_publication && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{pub.type_publication}</span>}
                          {pub.indexation && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{pub.indexation}</span>}
                          {pub.source_scraping && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{pub.source_scraping}</span>}
                          {status === "valide" && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3" />Validée
                            </span>
                          )}
                          {status === "en_attente" && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Hourglass className="w-3 h-3" />En attente
                            </span>
                          )}
                          {status === "rejete" && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <XCircle className="w-3 h-3" />Rejetée
                            </span>
                          )}
                        </div>
                        {pub.journal_ou_editeur && <p className="text-xs text-slate-500 italic mt-1.5">{pub.journal_ou_editeur}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {pub.doi && (
                          <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-cyan-600 transition-colors p-1">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-6 pb-5 bg-cyan-50/20 border-t border-slate-100">
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Auteurs</p><p className="text-sm text-slate-700">{pub.auteurs || "—"}</p></div>
                        {pub.doi && <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">DOI</p><a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-600 hover:underline break-all">{pub.doi}</a></div>}
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-2">Référence APA 7</p>
                        <div className="bg-white border border-cyan-200 rounded-xl px-4 py-3 mb-2"><p className="text-sm text-slate-700 leading-relaxed">{apa}</p></div>
                        <button onClick={() => copyToClipboard(apa, pid)} className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 transition-colors font-medium">
                          {isCop ? <><Check className="w-3.5 h-3.5" />Copié !</> : <><Copy className="w-3.5 h-3.5" />Copier la référence</>}
                        </button>
                      </div>
                      {/* Chercheur validation buttons — always visible for re-validation */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {!pub.validee_chercheur && !pub.rejetee_chercheur && (
                          <p className="text-xs text-slate-500 mb-2">Cette publication vous appartient-elle ?</p>
                        )}
                        {pub.rejetee_chercheur && (
                          <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />Rejetée — cliquez Confirmer si c'était une erreur.
                          </p>
                        )}
                        {pub.validee_chercheur && (
                          <p className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />Confirmée par vous — cliquez Rejeter si c'était une erreur.
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirm(pub.id)}
                            disabled={validating === pub.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${pub.validee_chercheur ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
                            {validating === pub.id ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {pub.validee_chercheur ? "✓ Confirmée" : "Confirmer"}
                          </button>
                          <button
                            onClick={() => handleReject(pub.id)}
                            disabled={validating === pub.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${pub.rejetee_chercheur ? "bg-red-100 text-red-700 border border-red-300" : "bg-red-500 hover:bg-red-600 text-white"}`}>
                            <XCircle className="w-3.5 h-3.5" />
                            {pub.rejetee_chercheur ? "✗ Rejetée" : "Rejeter"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Rejected pubs archive (collapsed by default) ── */}
        {rejectedPubs.length > 0 && (
          <div className="rounded-2xl border border-red-200 overflow-hidden">
            <button
              onClick={() => setShowRejected(r => !r)}
              className="w-full flex items-center gap-3 px-5 py-3.5 bg-red-50 hover:bg-red-100 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <ArchiveX className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">
                  Archives — {rejectedPubs.length} publication{rejectedPubs.length > 1 ? "s" : ""} rejetée{rejectedPubs.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-400">Cliquez pour afficher · vous pouvez re-confirmer si nécessaire</p>
              </div>
              {showRejected
                ? <ChevronUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-red-400 flex-shrink-0" />}
            </button>

            {showRejected && (
              <div className="divide-y divide-red-50 bg-white">
                {rejectedPubs.map((pub, idx) => {
                  const pid  = `rej-${idx}`;
                  const isExp = expanded === pid;
                  return (
                    <div key={pid} className="opacity-70 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setExpanded(isExp ? null : pid)}
                        className="w-full text-left px-6 py-3 flex items-start gap-3 hover:bg-red-50/40 transition-colors group"
                      >
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-600 truncate line-through decoration-red-300 group-hover:no-underline">
                            {pub.titre}
                          </p>
                          <div className="flex gap-2 mt-0.5">
                            {pub.annee && <span className="text-xs text-slate-400">{pub.annee}</span>}
                            {pub.journal_ou_editeur && <span className="text-xs text-slate-400 italic truncate max-w-xs">{pub.journal_ou_editeur}</span>}
                          </div>
                        </div>
                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      </button>
                      {isExp && (
                        <div className="px-6 pb-4 bg-red-50/20 border-t border-red-100">
                          <p className="text-xs text-slate-500 mt-3 mb-2">{pub.auteurs || ""}</p>
                          <button
                            onClick={() => handleConfirm(pub.id)}
                            disabled={validating === pub.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {validating === pub.id
                              ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Annuler le rejet — c'est ma publication
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
