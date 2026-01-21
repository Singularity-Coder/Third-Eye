
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  MarkerType
} from 'reactflow';
// Added missing Globe and MessageSquare icons to the lucide-react import
import { Upload, Search, List, Activity, AlertCircle, X, ChevronRight, Send, Globe, MessageSquare } from 'lucide-react';
import { WorldModel, AppState } from './types';
import { extractWorldModel, queryWorldState } from './services/geminiService';
import { IngestionNode, ModelNode, SynthesisNode, QueryNode } from './components/CustomNodes';

const initialNodes: Node[] = [
  { id: 'ingestion', type: 'ingestion', position: { x: 50, y: 150 }, data: { filename: null } },
  { id: 'entities', type: 'world-model', position: { x: 300, y: 0 }, data: { type: 'entities', count: 0 } },
  { id: 'events', type: 'world-model', position: { x: 300, y: 100 }, data: { type: 'events', count: 0 } },
  { id: 'relationships', type: 'world-model', position: { x: 300, y: 200 }, data: { type: 'relationships', count: 0 } },
  { id: 'observations', type: 'world-model', position: { x: 300, y: 300 }, data: { type: 'observations', count: 0 } },
  { id: 'documents', type: 'world-model', position: { x: 300, y: 400 }, data: { type: 'documents', count: 0 } },
  { id: 'synthesis', type: 'synthesis', position: { x: 600, y: 150 }, data: {} },
  { id: 'query', type: 'query', position: { x: 900, y: 150 }, data: {} },
];

const initialEdges: Edge[] = [
  { id: 'e-i-en', source: 'ingestion', target: 'entities', animated: true },
  { id: 'e-i-ev', source: 'ingestion', target: 'events', animated: true },
  { id: 'e-i-r', source: 'ingestion', target: 'relationships', animated: true },
  { id: 'e-i-o', source: 'ingestion', target: 'observations', animated: true },
  { id: 'e-i-d', source: 'ingestion', target: 'documents', animated: true },
  { id: 'e-en-s', source: 'entities', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-ev-s', source: 'events', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-r-s', source: 'relationships', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-o-s', source: 'observations', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-d-s', source: 'documents', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-s-q', source: 'synthesis', target: 'query', animated: true },
];

const nodeTypes = {
  'ingestion': IngestionNode,
  'world-model': ModelNode,
  'synthesis': SynthesisNode,
  'query': QueryNode,
};

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [model, setModel] = useState<WorldModel>({
    entities: [],
    events: [],
    relationships: [],
    observations: [],
    documents: [],
    notes: { assumptions: [], ambiguities: [], unmodeled_fields: [] }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [sidePanel, setSidePanel] = useState<'data' | 'logs' | 'none'>('none');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // Sync node data with model state
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'world-model') {
          const type = node.data.type as keyof WorldModel;
          if (Array.isArray(model[type])) {
            return {
              ...node,
              data: { ...node.data, count: (model[type] as any[]).length },
            };
          }
        }
        return node;
      })
    );
  }, [model]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setNodes(nds => nds.map(n => n.id === 'ingestion' ? { ...n, data: { filename: file.name } } : n));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const result = await extractWorldModel(content);
        
        // Append instead of overwrite for "living model" feel
        setModel(prev => ({
          entities: [...prev.entities, ...result.entities],
          events: [...prev.events, ...result.events],
          relationships: [...prev.relationships, ...result.relationships],
          observations: [...prev.observations, ...result.observations],
          documents: [...prev.documents, ...result.documents],
          notes: {
            assumptions: [...prev.notes.assumptions, ...result.notes.assumptions],
            ambiguities: [...prev.notes.ambiguities, ...result.notes.ambiguities],
            unmodeled_fields: [...prev.notes.unmodeled_fields, ...result.notes.unmodeled_fields],
          }
        }));
      } catch (err) {
        console.error("Extraction failed", err);
        alert("Failed to extract model from data. Ensure API Key is valid.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const userMsg = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);

    try {
      const answer = await queryWorldState(userMsg, model);
      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: Could not query the world model." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Globe className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">World Modeling Engine v1.0</h1>
            <p className="text-xs text-slate-500 font-mono">ONTOLOGY_MODE: STRICT_JSON_PROJECTION</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md cursor-pointer text-sm font-medium">
            <Upload size={18} />
            <span>Ingest Data</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.json,.txt" />
          </label>
          <button 
            onClick={() => setSidePanel(sidePanel === 'data' ? 'none' : 'data')}
            className={`p-2 rounded-md transition ${sidePanel === 'data' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <List size={20} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* React Flow Canvas */}
        <div className="flex-1 bg-slate-950 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#1e293b" gap={20} />
            <Controls />
            <Panel position="top-left" className="bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-800 pointer-events-none">
               <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span>{isProcessing ? 'Processing...' : 'Idle'}</span>
                  </div>
                  <span>Entities: {model.entities.length}</span>
                  <span>Events: {model.events.length}</span>
                  <span>State: Synchronized</span>
               </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Query/Chat Sidebar (Layer 4) */}
        <div className="w-96 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
            <MessageSquare size={18} className="text-rose-400" />
            <span className="font-bold text-sm tracking-wider uppercase">Query Layer</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans scrollbar-thin scrollbar-thumb-slate-700">
            {chatHistory.length === 0 && (
              <div className="text-slate-500 text-sm italic text-center mt-10">
                The world model is ready for inquiry. Ask about entities, relationships, or event consequences.
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isProcessing && chatHistory.length > 0 && chatHistory[chatHistory.length-1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-lg flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleQuery} className="p-4 border-t border-slate-800 bg-slate-900/80">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Who owns Asset Alpha?"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition shadow-inner"
              />
              <button 
                type="submit" 
                disabled={isProcessing || !query.trim()}
                className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-rose-400 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Data Inspector Panel */}
        {sidePanel === 'data' && (
          <div className="fixed inset-y-0 right-96 w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                <span className="font-bold">Model Inspector</span>
              </div>
              <button onClick={() => setSidePanel('none')} className="text-slate-500 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
              {/* Entities Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Entities</h3>
                  <span className="text-xs bg-emerald-900/40 px-2 py-0.5 rounded text-emerald-300">{model.entities.length}</span>
                </div>
                <div className="space-y-2">
                  {model.entities.map((e, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 p-3 rounded hover:border-emerald-500/50 transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs font-bold text-white">{e.names[0]}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{e.entity_type}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {e.entity_id}</div>
                    </div>
                  ))}
                  {model.entities.length === 0 && <p className="text-xs text-slate-600 italic">No entities extracted.</p>}
                </div>
              </section>

              {/* Events Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">Events</h3>
                  <span className="text-xs bg-amber-900/40 px-2 py-0.5 rounded text-amber-300">{model.events.length}</span>
                </div>
                <div className="space-y-2">
                  {model.events.map((ev, idx) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 p-3 rounded hover:border-amber-500/50 transition">
                       <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs font-bold text-white">{ev.event_type}</span>
                        <span className="text-[10px] text-slate-500">{ev.time_interval.start || ev.time_interval.instant}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{ev.effects?.join(', ')}</div>
                    </div>
                  ))}
                   {model.events.length === 0 && <p className="text-xs text-slate-600 italic">No events extracted.</p>}
                </div>
              </section>

              {/* Notes/Assumptions */}
              <section className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Modeling Notes
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 mb-1">ASSUMPTIONS</div>
                    <ul className="list-disc pl-4 space-y-1">
                      {model.notes.assumptions.map((a, i) => (
                        <li key={i} className="text-[11px] text-slate-400">{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 mb-1">AMBIGUITIES</div>
                    <ul className="list-disc pl-4 space-y-1">
                      {model.notes.ambiguities.map((a, i) => (
                        <li key={i} className="text-[11px] text-slate-400">{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-6 z-10 shrink-0 text-[10px] font-mono text-slate-500 uppercase">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>GEMINI_V3_READY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>FLOW_CANVAS_ACTIVE</span>
          </div>
        </div>
        <div>
          <span>PROJECTION_LATENCY: 420MS</span>
        </div>
      </footer>
    </div>
  );
}
