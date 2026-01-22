
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { WorldModel } from '../types';
import { Clock, Activity, ChevronRight, Map as MapIcon, Satellite, Plane, Bird, User, Atom } from 'lucide-react';

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

  // Extract numeric part while keeping sign
  const numericPart = clean.replace(/[GMA]|BCE|BC|AD/g, '');
  let val = parseFloat(numericPart);
  
  if (isNaN(val)) return 0;

  // If input string has BCE or BC, it's explicitly negative
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
    const gridSize = 50 * scale;
    for (let x = centerX % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = centerY % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Planetary Glow
    if (currentTime < -4000000000) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        ctx.arc(0, 0, 350 * scale, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 350 * scale);
        grad.addColorStop(0, 'rgba(69, 10, 10, 0.4)');
        grad.addColorStop(0.5, 'rgba(127, 29, 29, 0.2)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
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
        ctx.fillStyle = currentTime < -500000000 ? '#78350f' : currentTime > 1000000000 ? '#1e1b4b' : '#064e3b';
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1 / scale;
        ctx.stroke();
      } else if (entity.location?.type === 'Point') {
        const [x, y] = entity.location.coordinates as number[];
        ctx.beginPath();
        ctx.arc(x + xDrift, y + yDrift, 5 / scale, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
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

      ctx.beginPath();
      ctx.arc(ex, ey, (10 + pulse * 15) / scale, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${opacity * (1 - pulse)})`;
      ctx.lineWidth = 2 / scale;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, 4 / scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 63, 94, ${opacity})`;
      ctx.fill();
      
      if (scale > 5) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${10/scale}px font-mono`;
        ctx.fillText(ev.event_type.toUpperCase(), ex + 12/scale, ey);
      }
      ctx.restore();
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
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
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden font-mono">
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-none shadow-2xl pointer-events-auto min-w-[340px] border-l-4 border-l-blue-600">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30">
              <Clock className="text-blue-400" size={24} />
            </div>
            <div className="flex-1">
              <form onSubmit={handleManualInput} className="relative group">
                <input
                  type="text"
                  value={inputYear}
                  onChange={(e) => setInputYear(e.target.value)}
                  onBlur={handleManualInput}
                  className="bg-transparent text-2xl font-black tracking-tighter text-white border-b border-slate-700 focus:border-blue-500 focus:outline-none w-full transition-all rounded-none uppercase"
                  placeholder="TEMPORAL_MARK"
                />
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-400">
                  <ChevronRight size={20} />
                </button>
              </form>
              <div className="text-[9px] text-slate-500 tracking-[0.2em] uppercase flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                {formatYearLong(currentTime)}
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-800 w-full mb-3" />
          <div className="text-[8px] text-slate-600 uppercase flex justify-between">
            <span>CHRONO_LOCK_STATE</span>
            <span className="text-emerald-500 font-bold">SYNCHRONIZED</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 pointer-events-auto">
          {(Object.keys(ZOOM_CONFIG) as ZoomLevel[]).map((key) => {
            const Config = ZOOM_CONFIG[key];
            const Icon = Config.icon;
            return (
              <button
                key={key}
                onClick={() => setZoomLevel(key)}
                className={`p-3 border transition-all shadow-xl group relative rounded-none ${
                  zoomLevel === key 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Icon size={18} />
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 border border-slate-700 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all uppercase">
                  {Config.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y }); }}
          onMouseMove={(e) => { if (isDragging) setViewOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Tactical Bottom Control Bar with SLIDER */}
      <div className="bg-slate-900 border-t border-slate-800 z-20 flex flex-col shrink-0 pb-2">
        <div className="flex justify-between items-center py-2 px-6 border-b border-slate-800/50 bg-slate-950/40">
           <div className="flex items-center gap-10">
             <div className="flex items-center gap-3 text-[9px] text-slate-400 uppercase tracking-widest">
               <Activity size={14} className="text-emerald-500" />
               SYSTEM_STATE: <span className="text-emerald-400 font-bold">STABLE</span>
             </div>
             <div className="flex items-center gap-3 text-[9px] text-slate-400 uppercase tracking-widest">
               <MapIcon size={14} className="text-blue-500" />
               MAP_ENTITIES: <span className="text-blue-400 font-bold">{model.entities.length}</span>
             </div>
             <div className="flex items-center gap-3 text-[9px] text-slate-400 uppercase tracking-widest">
               <Atom size={14} className="text-rose-500" />
               PROJECTION: <span className="text-rose-400 font-bold">ENABLED</span>
             </div>
           </div>
           <div className="text-[9px] font-bold text-slate-600 tracking-[0.4em] uppercase">
             CHRONOS_TIMELINE_INTERFACE_V4.2
           </div>
        </div>
        
        {/* Timeline Slider Section */}
        <div className="relative h-20 flex flex-col justify-center px-10 bg-slate-950">
          <div className="flex justify-between mb-2 pointer-events-none">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
              ORIGIN_LIMIT: {formatYearShort(timeRange.min)}
            </span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
              HORIZON_LIMIT: {formatYearShort(timeRange.max)}
            </span>
          </div>

          <div className="relative h-8 flex items-center">
            <input
              type="range"
              min={timeRange.min}
              max={timeRange.max}
              step={(timeRange.max - timeRange.min) / 10000}
              value={currentTime}
              onChange={(e) => onSliderChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-none appearance-none cursor-pointer focus:outline-none tactical-range-input"
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tactical-range-input {
          -webkit-appearance: none;
        }
        .tactical-range-input::-webkit-slider-runnable-track {
          width: 100%;
          height: 8px;
          background: #1e293b;
          border: 1px solid #334155;
        }
        .tactical-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 32px;
          width: 12px;
          background: #3b82f6;
          margin-top: -12px;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
          border: 1px solid white;
          border-radius: 0;
        }
        .tactical-range-input::-moz-range-track {
          width: 100%;
          height: 8px;
          background: #1e293b;
          border: 1px solid #334155;
        }
        .tactical-range-input::-moz-range-thumb {
          height: 32px;
          width: 12px;
          background: #3b82f6;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.8);
          border: 1px solid white;
          border-radius: 0;
        }
      `}} />
    </div>
  );
};
