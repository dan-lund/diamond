import { useEffect, useState } from 'react';
import { User, Search, Fingerprint, RefreshCcw } from 'lucide-react';

export default function Speakers() {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpeakers = () => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8000/speakers')
      .then(res => {
        if (!res.ok) throw new Error("Failed to connect to backend");
        return res.json();
      })
      .then(data => {
        setSpeakers(data.speakers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch speakers", err);
        setError("Could not load speakers. Is the backend running?");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10 pt-4">
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">Speakers</h1>
        <p className="text-zinc-500">Manage identified voice profiles and identities.</p>
      </header>

      {/* Filter / Search Bar */}
      <div className="mb-8 relative flex gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
                type="text" 
                placeholder="Search speakers..." 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-900/50 transition-all placeholder:text-zinc-600 text-zinc-200"
            />
        </div>
        <button 
            onClick={fetchSpeakers} 
            className="px-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-emerald-700/50 hover:text-emerald-500 text-zinc-500 transition-colors"
        >
            <RefreshCcw size={20} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
             <span className="text-zinc-500 animate-pulse">Loading identities...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20 border border-red-900/20 rounded-lg bg-red-900/5">
            <p className="text-red-400 mb-2">{error}</p>
            <button onClick={fetchSpeakers} className="text-sm underline text-zinc-500 hover:text-zinc-300">Try Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {speakers.map((speaker, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg hover:border-emerald-700/50 transition-all group cursor-pointer hover:shadow-lg hover:shadow-emerald-900/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:bg-emerald-900/20 group-hover:text-emerald-500 transition-colors">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-200">{speaker}</h3>
                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                <Fingerprint size={12} />
                                <span>Voice ID Stored</span>
                            </p>
                        </div>
                    </div>
                </div>
            ))}
            
            {/* Empty State */}
            {speakers.length === 0 && (
                <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
                    <p className="text-zinc-500">No speakers enrolled yet.</p>
                    <p className="text-xs text-zinc-600 mt-2">Add embeddings to the /embeddings folder.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}