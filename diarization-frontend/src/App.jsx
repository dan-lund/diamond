import { useState, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, User } from 'lucide-react';

export default function Diarizer() {
  const [file, setFile] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, completed, failed
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
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [status, taskId]);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('processing');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:8000/diarize/', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setTaskId(data.task_id);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Speaker Diarization</h1>

      {status === 'idle' && (
  <div className="border-2 border-dashed border-gray-300 p-10 text-center rounded-lg bg-white shadow-sm">
    {!file ? (
      <>
        <input 
          type="file" 
          id="file-upload"
          onChange={(e) => setFile(e.target.files[0])} 
          className="hidden" 
          accept="audio/*"
        />
        <label 
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Upload size={48} className="mb-2 opacity-50" />
          <span className="font-medium">Click to select an audio file</span>
          <span className="text-xs text-gray-400">WAV, MP3, or M4A supported</span>
        </label>
      </>
    ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-100 max-w-xs mx-auto">
          <User size={18} />
          <span className="truncate font-medium">{file.name}</span>
          <button 
            onClick={() => setFile(null)} 
            className="text-blue-400 hover:text-red-500 ml-2"
          >
            ✕
          </button>
        </div>
        
        <button 
          onClick={handleUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
        >
          Begin Diarization
        </button>
      </div>
    )}
  </div>
)}

      {/* Processing State */}
      {status === 'processing' && (
        <div className="text-center p-10">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p>AI is analyzing your audio... this may take a minute.</p>
        </div>
      )}

      {/* Results Display */}
      {status === 'completed' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="text-green-500" /> Results
          </h2>
          {results.map((item, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="bg-blue-100 p-2 rounded-full">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-500 uppercase">{item.speaker}</p>
                <p className="text-gray-700">
                  {Number(item.start || 0).toFixed(2)}s - {Number(item.end || 0).toFixed(2)}s
                </p>
              </div>
            </div>
          ))}
          <button onClick={() => setStatus('idle')} className="text-blue-600 underline">Upload another</button>
        </div>
      )}
    </div>
  );
}