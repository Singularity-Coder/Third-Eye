import React from 'react';
import { Event } from '../types';

interface TimelineViewProps {
  events: Event[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.time_interval.instant || a.time_interval.start || '';
    const timeB = b.time_interval.instant || b.time_interval.start || '';
    return timeA.localeCompare(timeB);
  });

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-600">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
           <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
        </div>
        <p className="text-xs font-black uppercase tracking-widest">Temporal Buffer Empty</p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('meeting') || t.includes('review')) return 'fa-users-gear';
    if (t.includes('logistics') || t.includes('cargo')) return 'fa-truck-ramp-box';
    if (t.includes('financial') || t.includes('budget')) return 'fa-money-bill-transfer';
    return 'fa-bolt';
  };

  return (
    <div className="relative pb-24">
      {/* Center Line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-white/5 to-transparent"></div>

      <div className="space-y-12">
        {sortedEvents.map((event, idx) => (
          <div key={event.event_id} className="relative pl-16 group">
            {/* Marker */}
            <div className="absolute left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-black border-2 border-indigo-500 z-10 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
            
            <div className="bg-[#0c0c0e] rounded-2xl p-6 border border-white/5 hover:border-indigo-500/30 transition-all shadow-xl group-hover:bg-[#111114]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <i className={`fa-solid ${getEventIcon(event.event_type)} text-xs`}></i>
                   </div>
                   <div>
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{event.event_type}</span>
                     <h4 className="text-sm font-black text-white uppercase tracking-tight mt-0.5">{event.event_id.replace(/_/g, ' ')}</h4>
                   </div>
                </div>
                <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-3">
                   <i className="fa-solid fa-clock text-[10px] text-slate-600"></i>
                   <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                    {event.time_interval.instant || `${event.time_interval.start || '...'} > ${event.time_interval.end || '...'}`}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {event.participant_refs.map((p, pIdx) => (
                  <div key={pIdx} className="px-2.5 py-1 rounded-full bg-white/[0.03] text-[9px] text-slate-400 border border-white/5 font-mono flex items-center gap-2 hover:border-indigo-500/30 transition-colors">
                    <span className="opacity-40 uppercase font-black">{p.role}:</span>
                    <span className="text-indigo-300 font-black">{p.entity_id}</span>
                  </div>
                ))}
              </div>

              {event.effects && event.effects.length > 0 && (
                <div className="mt-4 pt-5 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="fa-solid fa-code-merge text-slate-600 text-[10px]"></i>
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Reality Delta / Effects</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {event.effects.map((eff, eIdx) => (
                      <div key={eIdx} className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <div className="w-1 h-1 rounded-full bg-indigo-500/40"></div>
                        {eff}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;
