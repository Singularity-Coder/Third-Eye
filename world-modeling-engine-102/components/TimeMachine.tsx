
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { WorldModel } from '../types';
import { Clock, Activity, ChevronRight, Map as MapIcon, Satellite, Plane, Bird, User, Atom, Target, GitBranch } from 'lucide-react';

interface TimeMachineProps {
  model: WorldModel;
}

type ZoomLevel = 'SPACE_STATION' | 'AIRPLANE' | 'BIRD' | 'HUMAN' | 'MOLECULAR';

const ZOOM_CONFIG = {
  SPACE_STATION: { scale: 1, label: 'Space Station View', icon: Satellite },
  AIRPLANE: { scale: 5, label: 'Airplane View', icon: Plane },
  BIRD: { scale: 20, label: 'Bird\'s Eye View', icon: Bird },
  HUMAN: { scale: 100, label: 'Human Level', icon: User },
  MOLECULAR: { scale: 1000, label: 'Molecular Detail', icon: Atom },
};

const parseYear = (timeStr: string | undefined): number => {
  if (!timeStr) return 2024;
  const clean = timeStr.toUpperCase().replace(/\s/g, '');
  
  let multiplier = 1;
  if (clean.includes('GA')) multiplier = 1000000000;
  else if (clean.includes('MA')) multiplier = 1000000;
  else if (clean.endsWith('M')) multiplier = 1000000;

  const numericPart = clean.replace(/[GMA]|BCE|BC|AD/g, '');
  let val = parseFloat(numericPart);
  
  if (isNaN(val)) return 0;

  if (clean.includes('BCE') || clean.includes('BC')) {
      val = -Math.abs(val);
  }
  
  return val * multiplier;
};

const formatYearShort = (year: number): string => {
  const absYear = Math.abs(year);
  if (absYear >= 1000000000) return `${(absYear / 1000000000).toFixed(2)} Ga`;
  if (absYear >= 1000000) return `${(absYear / 1000000).toFixed(1)} Ma`;
  if (year < 0) return `${absYear} BCE`;
  return `${year} AD`;
};

const formatYearLong = (year: number): string => {
  const absYear = Math.abs(year);
  const tense = year < 0 ? 'Ago' : 'Hence';
  if (absYear >= 1000000000) return `${(absYear / 1000000000).toFixed(2)} Billion Years ${tense}`;
  if (absYear >= 1000000) return `${(absYear / 1000000).toFixed(1)} Million Years ${tense}`;
  if (year < 0) return `${absYear} BCE`;
  return `${year} AD`;
};

export const TimeMachine: React.FC<TimeMachineProps> = ({ model }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(2024);
  const [inputYear, setInputYear] = useState<string>('2024 AD');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('SPACE_STATION');
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const timeRange = useMemo(() => {
    const dates = [
      ...model.entities.map(e => parseYear(e.valid_time)),
      ...model.events.map(ev => parseYear(ev.time_interval.start || ev.time_interval.instant))
    ];

    const minVal = dates.length > 0 ? Math.min(...dates, -4540000000) : -4540000000;
    const maxVal = dates.length > 0 ? Math.max(...dates, 5000000000) : 5000000000;
    return { min: minVal, max: maxVal };
  }, [model]);

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseYear(inputYear);
    const clamped = Math.max(timeRange.min, Math.min(timeRange.max, parsed));
    setCurrentTime(clamped);
    setInputYear(formatYearShort(clamped));
  };

  const onSliderChange = (val: number) => {
    setCurrentTime(val);
    setInputYear(formatYearShort(val));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2 + viewOffset.x;
    const centerY = canvas.height / 2 + viewOffset.y;
    const scale = ZOOM_CONFIG[zoomLevel].scale;

    // Grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    const gridSize = Math.max(10, 50 * scale);
    for (let x = centerX % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = centerY % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Render Entities
    model.entities.forEach(entity => {
      const entityAge = parseYear(entity.valid_time);
      if (currentTime < entityAge) return;

      let xDrift = 0;
      let yDrift = 0;
      if (entity.entity_type.toLowerCase() === 'landmass' || entity.names.some(n => n.toLowerCase().includes('plate'))) {
          const deltaYears = (currentTime - entityAge);
          xDrift = (deltaYears / 1000000) * 12; 
          yDrift = (deltaYears / 1000000) * 4;
      }

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      const isBranched = !!entity.branch_id;

      if (entity.location?.type === 'Polygon') {
        ctx.beginPath();
        const coords = entity.location.coordinates as number[][];
        coords.forEach((c, i) => {
          const px = c[0] + xDrift;
          const py = c[1] + yDrift;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        
        if (isBranched) {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 2 / scale;
        } else {
          ctx.fillStyle = currentTime < -500000000 ? '#78350f' : currentTime > 1000000000 ? '#1e1b4b' : '#064e3b';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1 / scale;
        }
        
        ctx.fill();
        ctx.stroke();
      } else if (entity.location?.type === 'Point') {
        const [x, y] = entity.location.coordinates as number[];
        ctx.beginPath();
        ctx.arc(x + xDrift, y + yDrift, 5 / scale, 0, Math.PI * 2);
        ctx.fillStyle = isBranched ? '#f43f5e' : '#3b82f6';
        ctx.fill();
        if (isBranched) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#f43f5e';
        }
      }
      ctx.restore();
    });

    // Render Events
    model.events.forEach(ev => {
      const startYear = parseYear(ev.time_interval.start || ev.time_interval.instant);
      const timeDiff = Math.abs(startYear - currentTime);
      const window = Math.max(10, Math.abs(currentTime * 0.1));
      if (timeDiff > window) return;

      const loc = ev.location || (ev.location_ref ? model.entities.find(e => e.entity_id === ev.location_ref)?.location : null);
      if (!loc) return;
      const [ex, ey] = loc.type === 'Polygon' ? (loc.coordinates as number[][])[0] : (loc.coordinates as number[]);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      const pulse = (Date.now() % 1000) / 1000;
      const opacity = Math.max(0, 1 - (timeDiff / window));
      const isBranched = !!ev.branch_id;

      ctx.beginPath();
      ctx.arc(ex, ey, (10 + pulse * 15) / scale, 0, Math.PI * 2);
      ctx.strokeStyle = isBranched ? `rgba(251, 113, 133, ${opacity * (1 - pulse)})` : `rgba(244, 63, 94, ${opacity * (1 - pulse)})`;
      ctx.lineWidth = 3 / scale;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, 5 / scale, 0, Math.PI * 2);
      ctx.fillStyle = isBranched ? `rgba(251, 113, 133, ${opacity})` : `rgba(244, 63, 94, ${opacity})`;
      ctx.fill();
      
      if (scale > 5) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.fillStyle = isBranched ? '#fda4af' : '#fff';
        ctx.font = `bold ${10/scale}px font-mono`;
        ctx.fillText(ev.event_type.toUpperCase() + (isBranched ? " [SIM]" : ""), ex + 12/scale, ey);
      }
      ctx.restore();
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const render = () => {
      draw();
      animationFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [currentTime, zoomLevel, viewOffset, model]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden font-mono select-none">
      {/* HUD Overlay */}
      <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 flex flex-col sm:flex-row justify-between items-start gap-2 z-10 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 md:p-6 rounded-none shadow-2xl pointer-events-auto min-w-0 w-full sm:w-[340px] border-l-4 border-l-blue-600">
          <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-blue-500/10 border border-blue-500/30 shrink-0">
              <Clock className="text-blue-400 w-[18px] h-[18px] md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <form onSubmit={handleManualInput} className="relative group">
                <input
                  type="text"
                  value={inputYear}
                  onChange={(e) => setInputYear(e.target.value)}
                  onBlur={handleManualInput}
                  className="bg-transparent text-lg md:text-2xl font-black tracking-tighter text-white border-b border-slate-700 focus:border-blue-500 focus:outline-none w-full transition-all rounded-none uppercase"
                  placeholder="TIME"
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-400">
                  <ChevronRight size={18} />
                </button>
              </form>
              <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.1em] md:tracking-[0.2em] uppercase flex items-center gap-2 mt-1 md:mt-2 truncate">
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-blue-500 shadow-[0_0_8px_#3b82f6] shrink-0" />
                {formatYearLong(currentTime)}
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-800 w-full mb-2 md:mb-3" />
          <div className="text-[7px] md:text-[8px] text-slate-600 uppercase flex justify-between">
            <span>TEMPORAL_LOCK</span>
            <span className="text-emerald-500 font-bold">STABLE</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-row sm:flex-col gap-1 pointer-events-auto overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 w-full sm:w-auto">
          {(Object.keys(ZOOM_CONFIG) as ZoomLevel[]).map((key) => {
            const Config = ZOOM_CONFIG[key];
            const Icon = Config.icon;
            return (
              <button
                key={key}
                onClick={() => setZoomLevel(key)}
                className={`p-2.5 md:p-3 border transition-all shadow-xl group relative rounded-none shrink-0 ${
                  zoomLevel === key 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-slate-900/90 backdrop-blur border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Icon size={16} />
                <span className="hidden md:block absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all uppercase">
                  {Config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative min-h-0" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y }); }}
          onMouseMove={(e) => { if (isDragging) setViewOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
        
        {/* Mobile Drag Indicator */}
        <div className="absolute bottom-4 left-4 p-2 bg-slate-900/50 border border-slate-700 md:hidden pointer-events-none">
          <Target size={14} className="text-slate-500" />
        </div>
      </div>

      {/* Persistent Bottom Control Interface */}
      <div className="bg-slate-900 border-t border-slate-800 z-20 flex flex-col shrink-0 min-h-[120px] md:min-h-[140px]">
        {/* Status Bar */}
        <div className="hidden sm:flex justify-between items-center py-2 px-6 border-b border-slate-800/50 bg-slate-950/40">
           <div className="flex items-center gap-10">
             <div className="flex items-center gap-3 text-[9px] text-slate-400 uppercase tracking-widest">
               <Activity size={14} className="text-emerald-500" />
               SYSTEM_STATE: <span className="text-emerald-400 font-bold">NOMINAL</span>
             </div>
             <div className="flex items-center gap-3 text-[9px] text-slate-400 uppercase tracking-widest">
               <MapIcon size={14} className="text-blue-500" />
               RENDERED_ONTOLOGY: <span className="text-blue-400 font-bold">{model.entities.length + model.events.length}</span>
             </div>
           </div>
           <div className="text-[9px] font-bold text-slate-700 tracking-[0.4em] uppercase">
             CHRONOS_TIMELINE_SCRUBBER_V4.2
           </div>
        </div>
        
        {/* Scrubbing Interface */}
        <div className="flex-1 relative flex flex-col justify-center px-4 md:px-10 bg-slate-950/80">
          <div className="flex justify-between items-end mb-1 md:mb-2 pointer-events-none">
             <div className="flex flex-col">
               <span className="text-[7px] md:text-[9px] text-slate-600 font-black uppercase">TEMPORAL_MIN</span>
               <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                 {formatYearShort(timeRange.min)}
               </span>
             </div>
             
             <div className="bg-blue-600/10 px-4 py-1 border border-blue-600/30 mb-1">
               <span className="text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-widest animate-pulse">
                 {formatYearShort(currentTime)}
               </span>
             </div>

             <div className="flex flex-col items-end">
               <span className="text-[7px] md:text-[9px] text-slate-600 font-black uppercase">TEMPORAL_MAX</span>
               <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                 {formatYearShort(timeRange.max)}
               </span>
             </div>
          </div>

          <div className="relative h-10 md:h-12 flex items-center">
            {/* Visual Tick Marks */}
            <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none opacity-20">
              {Array.from({length: 60}).map((_, i) => (
                <div key={i} className={`w-px ${i % 5 === 0 ? 'h-5 bg-white' : 'h-2 bg-slate-600'}`} />
              ))}
            </div>

            <input
              type="range"
              min={timeRange.min}
              max={timeRange.max}
              step={(timeRange.max - timeRange.min) / 30000}
              value={currentTime}
              onChange={(e) => onSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 md:h-3 bg-slate-800/50 border border-slate-700/50 rounded-none appearance-none cursor-pointer focus:outline-none tactical-scrub-input relative z-10"
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tactical-scrub-input {
          -webkit-appearance: none;
          background: #0f172a;
        }
        .tactical-scrub-input::-webkit-slider-runnable-track {
          width: 100%;
          height: 10px;
          background: #1e293b;
          border: 1px solid #334155;
        }
        .tactical-scrub-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 48px;
          width: 18px;
          background: #3b82f6;
          margin-top: -20px;
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.9), inset 0 0 8px white;
          border: 2px solid white;
          cursor: pointer;
        }
        .tactical-scrub-input::-moz-range-track {
          width: 100%;
          height: 10px;
          background: #1e293b;
          border: 1px solid #334155;
        }
        .tactical-scrub-input::-moz-range-thumb {
          height: 48px;
          width: 18px;
          background: #3b82f6;
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.9);
          border: 2px solid white;
          cursor: pointer;
          border-radius: 0;
        }
        @media (max-width: 640px) {
          .tactical-scrub-input::-webkit-slider-thumb {
            width: 32px;
            height: 56px;
            margin-top: -24px;
          }
          .tactical-scrub-input::-moz-range-thumb {
            width: 32px;
            height: 56px;
          }
        }
      `}} />

      {zoomLevel === 'MOLECULAR' && (
        <div className="absolute inset-0 pointer-events-none border-[10px] md:border-[100px] border-blue-600/5 mix-blend-screen animate-pulse" />
      )}
    </div>
  );
};
