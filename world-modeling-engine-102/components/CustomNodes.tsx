
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Zap, Share2, Eye, FileText, Globe, MessageSquare, ShieldCheck, Activity } from 'lucide-react';

export const IngestionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-slate-900 border-2 ${selected ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-blue-600'} rounded-none shadow-xl p-5 min-w-[220px] transition-all border-l-8 border-l-blue-600`}>
      <div className="flex items-center gap-3 mb-3 text-blue-400 font-bold border-b border-blue-900/50 pb-2">
        <Database size={18} />
        <span className="tracking-widest text-xs">01_INGESTION_LAYER</span>
      </div>
      <div className="text-[10px] text-slate-400 flex flex-col gap-2 font-mono">
        <span className="opacity-70">{data.filename ? `SOURCE: ${data.filename}` : 'AWAITING_INPUT_STREAM...'}</span>
        {data.filename && <span className="text-emerald-500 flex items-center gap-1"><Activity size={10} className="animate-pulse" /> DATA_FLOW_ACTIVE</span>}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-8 rounded-none bg-blue-500 border-none !right-[-6px]" />
    </div>
  );
});

export const ModelNode = memo(({ data, selected }: NodeProps) => {
  const icons: Record<string, any> = {
    entities: Globe,
    events: Zap,
    relationships: Share2,
    observations: Eye,
    documents: FileText
  };
  const Icon = icons[data.type] || Globe;
  const colors: Record<string, string> = {
    entities: 'text-emerald-400 border-emerald-600 border-l-emerald-600',
    events: 'text-amber-400 border-amber-600 border-l-amber-600',
    relationships: 'text-purple-400 border-purple-600 border-l-purple-600',
    observations: 'text-cyan-400 border-cyan-600 border-l-cyan-600',
    documents: 'text-slate-400 border-slate-600 border-l-slate-600'
  };

  return (
    <div className={`bg-slate-900 border-2 ${colors[data.type]} rounded-none shadow-xl p-5 min-w-[200px] transition-all border-l-8`}>
      <div className={`flex items-center gap-2 mb-3 font-bold border-b border-slate-800 pb-2 ${colors[data.type]}`}>
        <Icon size={18} />
        <span className="uppercase tracking-[0.2em] text-[10px]">{data.type}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-black font-mono text-slate-100">
          {data.count || 0}
        </div>
        <div className="text-[9px] text-slate-500 font-bold tracking-widest">OBJECT_COUNT</div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-8 rounded-none bg-slate-700 border-none !left-[-6px]" />
      <Handle type="source" position={Position.Right} className="w-2 h-8 rounded-none bg-slate-700 border-none !right-[-6px]" />
    </div>
  );
});

export const SynthesisNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-slate-900 border-2 ${selected ? 'border-white' : 'border-slate-700'} rounded-none shadow-2xl p-7 min-w-[260px] transition-all border-l-8 border-l-white`}>
      <div className="flex items-center gap-3 mb-4 text-white font-bold border-b border-slate-700 pb-2">
        <ShieldCheck size={20} className={data.isProcessing ? 'animate-pulse text-blue-400' : 'text-emerald-400'} />
        <span className="tracking-widest text-xs">03_SYNTHESIS_ENGINE</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-[9px] font-bold font-mono">
          <span className="text-slate-500 uppercase tracking-widest">CONSISTENCY_CHECK</span>
          <span className={data.isProcessing ? 'text-blue-400' : 'text-emerald-400'}>
            {data.isProcessing ? 'ANALYZING_STATE...' : 'STATE_RESOLVED'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-none overflow-hidden">
            <div className={`h-full bg-white transition-all duration-700 ${data.isProcessing ? 'w-1/2 animate-pulse' : 'w-full'}`} />
        </div>
        <div className="text-[9px] text-slate-500 font-mono italic flex items-center gap-2">
          <Activity size={10} />
          {data.lastSynthesis ? `LAST_UPDATE: ${data.lastSynthesis}` : 'AWAITING_INPUT_STATE'}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-8 rounded-none bg-white border-none !left-[-6px]" />
      <Handle type="source" position={Position.Right} className="w-2 h-8 rounded-none bg-white border-none !right-[-6px]" />
    </div>
  );
});

export const QueryNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`bg-slate-900 border-2 ${selected ? 'border-rose-400 ring-2 ring-rose-500/20' : 'border-rose-600'} rounded-none shadow-xl p-5 min-w-[220px] transition-all border-l-8 border-l-rose-600`}>
      <div className="flex items-center gap-3 mb-3 text-rose-400 font-bold border-b border-rose-900/50 pb-2">
        <MessageSquare size={18} />
        <span className="tracking-widest text-xs">04_QUERY_INTERFACE</span>
      </div>
      <div className="text-[9px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-2">
        <Activity size={10} className="animate-pulse" />
        AWAITING_OPERATOR_CMD...
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-8 rounded-none bg-rose-500 border-none !left-[-6px]" />
    </div>
  );
});
