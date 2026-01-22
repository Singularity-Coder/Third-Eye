
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
import { 
  Globe, RefreshCw, Layers, Terminal, Send, X, PanelRightClose, PanelRightOpen, Cpu, Activity
} from 'lucide-react';
import { WorldModel } from './types';
import { extractWorldModel, queryWorldState, synthesizeWorldModel } from './services/geminiService';
import { IngestionNode, ModelNode, SynthesisNode, QueryNode } from './components/CustomNodes';
import { TimeMachine } from './components/TimeMachine';

const initialNodes: Node[] = [
  { id: 'ingestion', type: 'ingestion', position: { x: 50, y: 150 }, data: { filename: "CHRONOS_SEED_01.CSV" } },
  { id: 'entities', type: 'world-model', position: { x: 300, y: 0 }, data: { type: 'entities', count: 7 } },
  { id: 'events', type: 'world-model', position: { x: 300, y: 100 }, data: { type: 'events', count: 8 } },
  { id: 'relationships', type: 'world-model', position: { x: 300, y: 200 }, data: { type: 'relationships', count: 0 } },
  { id: 'observations', type: 'world-model', position: { x: 300, y: 300 }, data: { type: 'observations', count: 0 } },
  { id: 'documents', type: 'world-model', position: { x: 300, y: 400 }, data: { type: 'documents', count: 0 } },
  { id: 'synthesis', type: 'synthesis', position: { x: 600, y: 150 }, data: { isProcessing: false, lastSynthesis: "INITIALIZED" } },
  { id: 'query', type: 'query', position: { x: 900, y: 150 }, data: {} },
];

const initialEdges: Edge[] = [
  { id: 'e-i-en', source: 'ingestion', target: 'entities', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-i-ev', source: 'ingestion', target: 'events', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-i-r', source: 'ingestion', target: 'relationships', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-i-o', source: 'ingestion', target: 'observations', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-i-d', source: 'ingestion', target: 'documents', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-en-s', source: 'entities', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-ev-s', source: 'events', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-r-s', source: 'relationships', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-o-s', source: 'observations', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-d-s', source: 'documents', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-s-q', source: 'synthesis', target: 'query', animated: true, style: { stroke: '#ffffff' } },
];

const nodeTypes = {
  'ingestion': IngestionNode,
  'world-model': ModelNode,
  'synthesis': SynthesisNode,
  'query': QueryNode,
};

const INITIAL_MODEL: WorldModel = {
  entities: [
    { entity_id: 'CORE01', entity_type: 'System', names: ['Earth Core'], attributes: { state: 'molten' }, valid_time: '-4.54Ga', location: { type: 'Point', coordinates: [0, 0] }, source_refs: ['S01'] },
    { entity_id: 'ROD01', entity_type: 'Landmass', names: ['Rodinia'], attributes: { supercontinent: true }, valid_time: '-1Ga', location: { type: 'Polygon', coordinates: [[-180, -120], [180, -120], [180, 120], [-180, 120]] }, source_refs: ['S01'] },
    { entity_id: 'PANG01', entity_type: 'Landmass', names: ['Pangaea'], attributes: { era: 'Mesozoic' }, valid_time: '-300Ma', location: { type: 'Polygon', coordinates: [[-100, -50], [100, -50], [100, 50], [-100, 50]] }, source_refs: ['S01'] },
    { entity_id: 'NA01', entity_type: 'Landmass', names: ['North America'], attributes: { current: true }, valid_time: '2024', location: { type: 'Polygon', coordinates: [[-120, 20], [-60, 20], [-60, 50], [-120, 50]] }, source_refs: ['S01'] },
    { entity_id: 'EU01', entity_type: 'Landmass', names: ['Eurasia'], attributes: { current: true }, valid_time: '2024', location: { type: 'Polygon', coordinates: [[10, 30], [150, 60], [180, 20], [20, 10]] }, source_refs: ['S01'] },
    { entity_id: 'PROX01', entity_type: 'Landmass', names: ['Pangaea Proxima'], attributes: { forecast: 'Future' }, valid_time: '250Ma', location: { type: 'Polygon', coordinates: [[-60, -30], [60, -30], [60, 30], [-60, 30]] }, source_refs: ['S01'] },
    { entity_id: 'LUNA01', entity_type: 'Asset', names: ['Lunar Gateway'], attributes: { orbit: 'Lunar' }, valid_time: '2030', location: { type: 'Point', coordinates: [45, 45] }, source_refs: ['S02'] },
  ],
  events: [
    { event_id: 'EV01', event_type: 'System_Formation', time_interval: { instant: '-4.54Ga' }, location: { type: 'Point', coordinates: [0,0] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV02', event_type: 'Theia_Collision', time_interval: { instant: '-4.51Ga' }, location: { type: 'Point', coordinates: [20,20] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV03', event_type: 'Cambrian_Explosion', time_interval: { instant: '-541Ma' }, location: { type: 'Point', coordinates: [10, -10] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV04', event_type: 'K-Pg_Extinction', time_interval: { instant: '-66Ma' }, location: { type: 'Point', coordinates: [-90, 20] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV05', event_type: 'Industrial_Revolution', time_interval: { instant: '1760' }, location: { type: 'Point', coordinates: [0, 51] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV06', event_type: 'AI_Singularity', time_interval: { instant: '2045' }, location: { type: 'Point', coordinates: [139, 35] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV07', event_type: 'First_Mars_City', time_interval: { instant: '2120' }, location: { type: 'Point', coordinates: [-10, -30] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV08', event_type: 'Sun_Red_Giant', time_interval: { instant: '5Ga' }, location: { type: 'Point', coordinates: [0, 0] }, participant_refs: [], source_refs: ['S01'] },
  ],
  relationships: [],
  observations: [],
  documents: [],
  notes: { assumptions: [], ambiguities: [], unmodeled_fields: [] }
};

export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [view, setView] = useState<'SYSTEM' | 'TIME_MACHINE'>('SYSTEM');
  const [model, setModel] = useState<WorldModel>(INITIAL_MODEL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [sidePanel, setSidePanel] = useState<'inspector' | 'none'>('none');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSidePanel('inspector');
  }, []);

  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (!node || node.type !== 'world-model') return null;
    const type = node.data.type as keyof WorldModel;
    return { type, items: model[type] as any[] };
  }, [selectedNodeId, nodes, model]);

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

  const processTextData = async (content: string, filename: string) => {
    setIsProcessing(true);
    setNodes(nds => nds.map(n => n.id === 'ingestion' ? { ...n, data: { filename } } : n));
    try {
      const result = await extractWorldModel(content);
      setModel(prev => ({
        entities: [...prev.entities, ...result.entities],
        events: [...prev.events, ...result.events],
        relationships: [...prev.relationships, ...result.relationships],
        observations: [...prev.observations, ...result.observations],
        documents: [...prev.documents, ...result.documents],
        notes: {
          assumptions: [...new Set([...prev.notes.assumptions, ...result.notes.assumptions])],
          ambiguities: [...new Set([...prev.notes.ambiguities, ...result.notes.ambiguities])],
          unmodeled_fields: [...new Set([...prev.notes.unmodeled_fields, ...result.notes.unmodeled_fields])],
        }
      }));
    } catch (err) {
      console.error("Extraction failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => processTextData(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const currentQuery = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }]);
    setIsProcessing(true);

    try {
      const response = await queryWorldState(currentQuery, model);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error("Query failed", err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Failed to process query." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSynthesis = async () => {
    setIsProcessing(true);
    try {
      const result = await synthesizeWorldModel(model);
      setModel(result);
      setNodes(nds => nds.map(n => n.id === 'synthesis' ? { ...n, data: { ...n.data, lastSynthesis: new Date().toLocaleTimeString() } } : n));
    } catch (err) {
      console.error("Synthesis failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-mono text-slate-100 overflow-hidden">
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center border border-blue-400 rounded-none">
              <Globe className="text-white" size={20} />
            </div>
            <h1 className="text-sm font-black tracking-tight uppercase">
              WORLD_MODELER <span className="text-slate-500 text-[10px] ml-2 font-normal">CHRONOS_4.2</span>
            </h1>
          </div>

          <nav className="flex items-center bg-slate-950 border border-slate-800 p-0.5">
            <button 
              onClick={() => setView('SYSTEM')}
              className={`px-4 py-2 text-[10px] font-bold transition-all rounded-none ${view === 'SYSTEM' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SYSTEM_FLOW
            </button>
            <button 
              onClick={() => setView('TIME_MACHINE')}
              className={`px-4 py-2 text-[10px] font-bold transition-all rounded-none ${view === 'TIME_MACHINE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              TIME_MACHINE
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <label className="bg-blue-600 hover:bg-blue-700 px-5 py-2 text-[10px] font-bold cursor-pointer text-white flex items-center gap-2 rounded-none transition-colors border border-blue-400/30">
            INGEST_WORLD_DATA
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-2 border border-slate-700 hover:bg-slate-800 transition-colors rounded-none flex items-center gap-2 ${isSidebarOpen ? 'text-rose-500 bg-rose-500/5' : 'text-slate-400'}`}
            title={isSidebarOpen ? "Collapse Intelligence" : "Expand Intelligence"}
          >
            {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0">
          {view === 'SYSTEM' ? (
            <div className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background color="#1e293b" gap={20} size={1} />
                <Controls className="!bg-slate-900 !border-slate-800 rounded-none shadow-2xl" />
                <Panel position="top-right">
                   <button onClick={handleSynthesis} disabled={isProcessing} className="bg-white text-black font-bold text-[10px] py-2 px-6 hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 rounded-none shadow-xl border border-slate-300">
                     <RefreshCw size={14} className={isProcessing ? 'animate-spin' : ''} /> SYNC_REPRESENTATION
                   </button>
                </Panel>
              </ReactFlow>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <TimeMachine model={model} />
            </div>
          )}
        </div>

        {/* intelligence sidebar */}
        <aside className={`transition-all duration-300 ease-in-out border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden opacity-0'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-rose-500" />
              <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Intelligence_Core</span>
            </div>
            <div className="flex items-center gap-2">
               <Cpu size={12} className={`text-rose-500 ${isProcessing ? 'animate-spin' : ''}`} />
               <div className="text-[8px] text-emerald-500 animate-pulse font-bold">ACTIVE</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
            {chatHistory.length === 0 && (
              <div className="text-slate-600 text-center mt-20 uppercase tracking-tighter opacity-50 flex flex-col items-center gap-4">
                <Activity size={24} className="text-slate-800" />
                Awaiting Command...
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-[8px] uppercase font-bold mb-1 ${msg.role === 'user' ? 'text-blue-500' : 'text-rose-500'}`}>{msg.role}</div>
                <div className={`max-w-full px-3 py-2 border rounded-none ${msg.role === 'user' ? 'bg-blue-900/10 border-blue-900/50 text-blue-100' : 'bg-slate-800/50 border-slate-700 text-slate-200'}`}>{msg.content}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleQuery} className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="relative">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="PROMPT_CMD..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-none px-3 pr-9 py-3 text-[10px] focus:outline-none focus:border-rose-500 placeholder:text-slate-700 text-white" 
              />
              <button type="submit" disabled={isProcessing} className="absolute right-2 top-2 p-1 text-slate-600 hover:text-rose-500 transition-colors">
                <Send size={18} />
              </button>
            </div>
          </form>
        </aside>

        {sidePanel === 'inspector' && (
          <div className={`fixed inset-y-0 ${isSidebarOpen ? 'right-80' : 'right-0'} w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 flex flex-col transition-all`}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 text-blue-400">
                <Layers size={14} />
                <span className="font-bold text-[10px] uppercase">Model_Inspector</span>
              </div>
              <button onClick={() => setSidePanel('none')} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedNodeData?.items?.map((item: any, i: number) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 text-[10px] rounded-none">
                  <div className="text-blue-400 font-bold mb-3 uppercase border-b border-slate-900 pb-2">{item.names ? item.names[0] : item.event_type}</div>
                  <div className="space-y-2">
                    {Object.entries(item).map(([k, v]) => (
                      <div key={k} className="flex flex-col py-1 border-b border-slate-900 last:border-0">
                        <span className="text-slate-600 uppercase text-[8px] font-black">{k}</span>
                        <span className="text-slate-300 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="h-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-6 text-[8px] text-slate-600 uppercase tracking-widest z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500/50'}`} />
            PROCESSOR: {isProcessing ? 'BUSY' : 'STANDBY'}
          </div>
          <div>LOC: CHRONOS_ENGINE_SECTOR_07</div>
        </div>
        <div>UTC: {new Date().toISOString()}</div>
      </footer>
    </div>
  );
}
