
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, Zap, Share2, Eye, FileText, Globe, MessageSquare } from 'lucide-react';

export const IngestionNode = memo(({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-blue-500 rounded-lg shadow-xl p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold border-b border-blue-900/50 pb-2">
        <Database size={18} />
        <span>1. INGESTION</span>
      </div>
      <div className="text-xs text-slate-400">
        {data.filename ? `Active: ${data.filename}` : 'Waiting for data...'}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
    </div>
  );
});

export const ModelNode = memo(({ data }: NodeProps) => {
  const icons: Record<string, any> = {
    entities: Globe,
    events: Zap,
    relationships: Share2,
    observations: Eye,
    documents: FileText
  };
  const Icon = icons[data.type] || Globe;
  const colors: Record<string, string> = {
    entities: 'text-emerald-400 border-emerald-500',
    events: 'text-amber-400 border-amber-500',
    relationships: 'text-purple-400 border-purple-500',
    observations: 'text-cyan-400 border-cyan-500',
    documents: 'text-slate-400 border-slate-500'
  };

  return (
    <div className={`bg-slate-900 border-2 ${colors[data.type]} rounded-lg shadow-xl p-4 min-w-[200px]`}>
      <div className={`flex items-center gap-2 mb-2 font-bold border-b border-slate-800 pb-2 ${colors[data.type]}`}>
        <Icon size={18} />
        <span className="uppercase">{data.type}</span>
      </div>
      <div className="text-xl font-mono text-slate-100">
        {data.count || 0} items
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-500" />
    </div>
  );
});

export const SynthesisNode = memo(({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-white rounded-lg shadow-2xl p-6 min-w-[240px]">
      <div className="flex items-center gap-2 mb-3 text-white font-bold border-b border-slate-700 pb-2">
        <Globe size={20} className="animate-pulse" />
        <span>3. WORLD STATE</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-500">CONSISTENCY</span>
          <span className="text-green-400">NOMINAL</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-500">PROVENANCE</span>
          <span className="text-blue-400">VERIFIED</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white" />
    </div>
  );
});

export const QueryNode = memo(({ data }: NodeProps) => {
  return (
    <div className="bg-slate-900 border-2 border-rose-500 rounded-lg shadow-xl p-4 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold border-b border-rose-900/50 pb-2">
        <MessageSquare size={18} />
        <span>4. QUERY LAYER</span>
      </div>
      <div className="text-xs text-slate-400 italic">
        "Ask about the state..."
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-rose-500" />
    </div>
  );
});
