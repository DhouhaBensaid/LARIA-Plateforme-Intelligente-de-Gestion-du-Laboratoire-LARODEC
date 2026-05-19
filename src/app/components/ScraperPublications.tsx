import { useState } from "react";
import { Search, Download, Check, Loader2, RefreshCw, User, ExternalLink } from "lucide-react";
import { scraperApi } from "../../lib/api";

export function ScraperPublications() {
  const [authorName, setAuthorName] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoScraping, setIsAutoScraping] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [autoSummary, setAutoSummary] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) return;
    setIsSearching(true);
    setMessage(null);
    setResults([]);
    setSelected(new Set());
    try {
      const { results: r } = await scraperApi.search(authorName.trim());
      setResults(r);
      if (r.length === 0) setMessage({ type: "error", text: "Aucune publication trouvée pour cet auteur." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (paperId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(paperId) ? next.delete(paperId) : next.add(paperId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(results.map((r) => r.paperId)));
  const clearAll = () => setSelected(new Set());

  const handleImport = async () => {
    const toImport = results.filter((r) => selected.has(r.paperId));
    if (!toImport.length) return;
    setIsImporting(true);
    setMessage(null);
    try {
      const { imported, message: msg } = await scraperApi.import(toImport);
      setMessage({ type: "success", text: msg });
      setSelected(new Set());
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleAutoScrape = async () => {
    setIsAutoScraping(true);
    setMessage(null);
    setAutoSummary([]);
    try {
      const { summary } = await scraperApi.autoAll();
      setAutoSummary(summary);
      const total = summary.reduce((acc: number, s: any) => acc + (s.imported || 0), 0);
      setMessage({ type: "success", text: `Scraping terminé — ${total} publication(s) importée(s) au total.` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsAutoScraping(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Collecte automatique — Semantic Scholar</h1>
          <p className="text-gray-500">Recherchez et importez les publications des chercheurs depuis Semantic Scholar</p>
        </div>
        <button onClick={handleAutoScrape} disabled={isAutoScraping}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50">
          {isAutoScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Scraper tous les chercheurs
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {autoSummary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Résumé du scraping automatique</h3>
          <div className="space-y-2">
            {autoSummary.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700"><User className="w-4 h-4 text-gray-400" />{s.chercheur}</span>
                {s.error
                  ? <span className="text-red-600 text-xs">{s.error}</span>
                  : <span className="text-green-600 font-medium">{s.imported} importée(s)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recherche par auteur</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ex: Ahmed Ben Salah, Mohamed Trabelsi..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <button type="submit" disabled={isSearching}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Rechercher
          </button>
        </form>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">{results.length} résultat(s) — {selected.size} sélectionné(s)</span>
              <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">Tout sélectionner</button>
              <button onClick={clearAll} className="text-xs text-gray-500 hover:underline">Désélectionner</button>
            </div>
            <button onClick={handleImport} disabled={selected.size === 0 || isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 text-sm">
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Importer la sélection ({selected.size})
            </button>
          </div>

          <ul className="divide-y divide-gray-50">
            {results.map((paper) => (
              <li key={paper.paperId}
                onClick={() => toggleSelect(paper.paperId)}
                className={`px-6 py-4 cursor-pointer transition-colors ${selected.has(paper.paperId) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(paper.paperId) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                    {selected.has(paper.paperId) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{paper.titre}</p>
                      {paper.doi && (
                        <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 text-blue-500 hover:text-blue-700">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{paper.journal} · {paper.annee}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">{paper.auteurs}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{paper.indexation}</span>
                      {paper.citations > 0 && (
                        <span className="text-xs text-gray-400">{paper.citations} citations</span>
                      )}
                    </div>
                    {paper.abstract && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{paper.abstract}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
