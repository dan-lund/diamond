import { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

// Neon Palette for speakers (Kept distinct for clarity, but on dark background)
const NEON_PALETTE = [
  { name: 'Teal',    base: '#2dd4bf', fill: 'rgba(45, 212, 191, 0.2)' },
  { name: 'Lime',    base: '#a3e635', fill: 'rgba(163, 230, 53, 0.2)' },
  { name: 'Indigo',  base: '#818cf8', fill: 'rgba(129, 140, 248, 0.2)' },
  { name: 'Rose',    base: '#fb7185', fill: 'rgba(251, 113, 133, 0.2)' },
  { name: 'Amber',   base: '#fbbf24', fill: 'rgba(251, 191, 36, 0.2)' },
  { name: 'Cyan',    base: '#22d3ee', fill: 'rgba(34, 211, 238, 0.2)' },
];

export default function AudioVisualizer({ file, results }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const wsRegionsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(50);

  const speakerColorMap = useMemo(() => {
    const map = {};
    const uniqueSpeakers = [...new Set(results.map(r => r.speaker))].sort();
    uniqueSpeakers.forEach((speaker, index) => {
      map[speaker] = NEON_PALETTE[index % NEON_PALETTE.length];
    });
    return map;
  }, [results]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!file || !containerRef.current) return;

    setIsReady(false);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 160,
      waveColor: '#27272a',       // Darker Zinc (Zinc-800)
      progressColor: '#10b981',   // Emerald-500 for the progress
      cursorColor: '#10b981',     // Emerald-500
      barWidth: 3,
      barGap: 2,
      barRadius: 2,               // Less rounded, more technical
      normalize: true,
      minPxPerSec: zoom,
      fillParent: true,
      interact: true,
      plugins: [], 
    });

    const wsRegions = ws.registerPlugin(RegionsPlugin.create());
    wsRegionsRef.current = wsRegions;

    const audioUrl = URL.createObjectURL(file);
    ws.load(audioUrl);

    ws.on('ready', (d) => {
      setIsReady(true);
      setDuration(d);
    });
    ws.on('audioprocess', (t) => setCurrentTime(t));
    ws.on('seek', (t) => setCurrentTime(t));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      URL.revokeObjectURL(audioUrl);
    };
  }, [file]);

  useEffect(() => {
    if (!wavesurferRef.current || !wsRegionsRef.current || !isReady) return;

    const wsRegions = wsRegionsRef.current;
    wsRegions.clearRegions();

    results.forEach((segment) => {
      const style = speakerColorMap[segment.speaker]; 
      if (!style) return;

      const region = wsRegions.addRegion({
        start: segment.start,
        end: segment.end,
        color: style.fill,
        drag: false,
        resize: false,
      });

      if (region.element) {
        region.element.style.borderBottom = `2px solid ${style.base}`;
        const labelDiv = document.createElement('div');
        Object.assign(labelDiv.style, {
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          color: style.base,
          fontWeight: 'bold',
          fontSize: '10px',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          textTransform: 'uppercase',
        });
        labelDiv.innerHTML = `${segment.speaker}`;
        region.element.appendChild(labelDiv);
      }
    });
  }, [results, isReady, speakerColorMap]);

  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.zoom(zoom);
    }
  }, [zoom, isReady]);

  const togglePlay = () => wavesurferRef.current?.playPause();

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      {/* Player Card */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-zinc-400 text-sm font-medium truncate max-w-[200px]">
                    {file ? file.name : 'No Audio'}
                </span>
            </div>
            <div className="font-mono text-zinc-400 text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
            </div>
        </div>

        {/* Visualization Area */}
        <div className="relative h-[200px] bg-zinc-900 flex flex-col justify-center">
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-zinc-900">
                    <span className="text-zinc-500 text-sm">Loading Waveform...</span>
                </div>
            )}
            <div ref={containerRef} className="w-full" />
        </div>

        {/* Controls Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900">
            <button
                onClick={togglePlay}
                className="flex items-center justify-center w-10 h-10 bg-emerald-700 hover:bg-emerald-600 rounded-full transition-colors text-white"
            >
                {isPlaying ? (
                    <Pause className="fill-current" size={16} />
                ) : (
                    <Play className="fill-current ml-1" size={16} />
                )}
            </button>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setZoom(z => Math.max(z - 10, 10))}
                    className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                >
                    <ZoomOut size={18} />
                </button>
                <div className="w-px h-4 bg-zinc-800 mx-1"></div>
                <button 
                    onClick={() => setZoom(z => Math.min(z + 10, 300))}
                    className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                >
                    <ZoomIn size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* Legend */}
      {results.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-start gap-3">
            {Object.entries(speakerColorMap).map(([speaker, style]) => (
                <div key={speaker} className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded border border-zinc-800">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.base }}></div>
                    <span className="text-xs font-mono text-zinc-400">{speaker}</span>
                </div>
            ))}
          </div>
      )}
    </div>
  );
}