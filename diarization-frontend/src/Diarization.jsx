import { useState, useEffect } from 'react';
import { Upload, Loader2, CheckCircle2, Mic, FileAudio, X } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

export default function Diarization() {
  const [file, setFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('idle'); 
  const [results, setResults] = useState([]);
  
  // Polling logic
  useEffect(() => {
    let interval;
    if (status === 'processing' && taskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/status/${taskId}`);
          const data = await res.json();

          if (data.status === 'completed') {
            setResults(data.result);
            setStatus('completed');
            clearInterval(interval);
          } else if (data.status === 'failed') {
            setStatus('failed');
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [status, taskId]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('processing');
    setResults([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/diarize/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setTaskId(data.task_id);
    } catch (e) {
      console.error("Upload failed", e);
      setStatus('idle');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="mb-12 text-center pt-4">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-3">
            Diarization
          </h1>
          <p className="text-zinc-500 text-lg">
            Upload audio to detect and separate distinct speakers.
          </p>
      </header>

      {/* STATE: IDLE (Upload) */}
      {status === 'idle' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 p-12 text-center rounded-lg hover:border-emerald-700/50 transition-colors duration-300">
              {!file ? (
              <>
                  <input 
                  type="file" 
                  id="file-upload"
                  onChange={(e) => setFile(e.target.files[0])} 
                  className="hidden" 
                  accept="audio/*"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-6 group">
                      <div className="bg-zinc-950 p-5 rounded-full border border-zinc-800 group-hover:border-emerald-600/50 group-hover:text-emerald-500 transition-colors">
                          <Upload size={32} className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <div className="space-y-1">
                          <span className="font-semibold text-lg block text-zinc-200 group-hover:text-emerald-400 transition-colors">Select Audio File</span>
                          <span className="text-sm text-zinc-600">Supports WAV, MP3, M4A</span>
                      </div>
                  </label>
              </>
              ) : (
              <div className="space-y-8">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded border border-zinc-800">
                      <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-900/20 rounded">
                              <FileAudio size={24} className="text-emerald-600"/>
                          </div>
                          <div className="text-left">
                              <p className="font-medium text-zinc-200 truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-zinc-600">Ready to analyze</p>
                          </div>
                      </div>
                      <button 
                          onClick={(e) => { e.stopPropagation(); setFile(null); }} 
                          className="text-zinc-600 hover:text-red-400 p-2 hover:bg-zinc-900 rounded transition-colors"
                      >
                          <X size={18} />
                      </button>
                  </div>
                  
                  <button 
                  onClick={handleUpload}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
                  >
                      Start Analysis
                  </button>
              </div>
              )}
          </div>
        </div>
      )}

      {/* STATE: PROCESSING */}
      {status === 'processing' && (
        <div className="text-center p-24 bg-zinc-900 rounded-lg border border-zinc-800 max-w-3xl mx-auto">
          <Loader2 className="animate-spin text-emerald-600 mx-auto mb-8" size={48} />
          <h3 className="text-xl font-medium text-zinc-200">Processing Audio</h3>
          <p className="text-zinc-500 mt-3">Identifying unique voice signatures...</p>
        </div>
      )}

      {/* STATE: COMPLETED */}
      {status === 'completed' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Visualizer Component */}
          <AudioVisualizer file={file} results={results} />

          {/* Transcript Log */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                  <h2 className="font-medium flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 size={18} className="text-emerald-600" /> 
                      Transcript Log
                  </h2>
                  <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      {results.length} SEGMENTS
                  </span>
              </div>
              
              <div className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
              {results.map((item, index) => (
                  <div key={index} className="flex gap-5 p-5 hover:bg-zinc-800/50 transition-colors group">
                      {/* Avatar/Icon */}
                      <div className="mt-1">
                          <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-emerald-900/50 transition-colors">
                              <Mic size={14} className="text-zinc-600 group-hover:text-emerald-600" />
                          </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                  {item.speaker}
                              </span>
                              <span className="text-xs font-mono text-zinc-600">
                                  {Number(item.start).toFixed(2)}s — {Number(item.end).toFixed(2)}s
                              </span>
                          </div>
                          
                          {/* Static Bar Representation */}
                          <div className="h-1 w-full max-w-md bg-zinc-950 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-zinc-800 w-2/3 rounded-full"></div>
                          </div> 
                      </div>
                  </div>
              ))}
              </div>
          </div>

          <div className="text-center pt-8 pb-10">
              <button 
                  onClick={() => {
                      setFile(null);
                      setStatus('idle');
                      setResults([]);
                  }} 
                  className="text-zinc-500 hover:text-emerald-500 transition-colors text-sm font-medium hover:underline underline-offset-4"
              >
                  Analyze another file
              </button>
          </div>
        </div>
      )}
    </div>
  );
}