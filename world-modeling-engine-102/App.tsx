
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
  Globe, RefreshCw, Layers, Terminal, Send, X, PanelRightClose, PanelRightOpen, Cpu, Activity, Upload, GitBranch, AlertTriangle, Clock, List, PanelLeftClose, PanelLeftOpen, CheckCircle2, Square, CheckSquare, Wrench, Plus, Trash2, Zap, Search, DollarSign, Users, Briefcase, Phone, Flame
} from 'lucide-react';
import { WorldModel, PivotEvent, Entity, WorldEvent, ToolDefinition, ToolCall, ToolCategory } from './types';
import { IngestionNode, ModelNode, SynthesisNode, QueryNode } from './components/CustomNodes';
import { TimeMachine } from './components/TimeMachine';

// --- DUMMY DATA CONSTANTS ---

const INITIAL_TOOLS: ToolDefinition[] = [
  { id: 'T_CAP', name: 'CAPITAL_DISPATCH_ORB', category: 'PLAYER', description: 'Inject massive liquid assets into specific markets or research labs to accelerate progress.', parameters: '{"amount_usd": "number", "target_sector": "string"}' },
  { id: 'T_CORP', name: 'ENTITY_FOUNDER_V3', category: 'PLAYER', description: 'Instantly incorporate and fund a legal entity to execute specific operations.', parameters: '{"mission_focus": "string", "region_code": "string"}' },
  { id: 'T_COM', name: 'COMM_ARRAY_INFIL', category: 'PLAYER', description: 'Direct access to global cellular networks for high-influence messaging to key decision makers.', parameters: '{"influence_target": "string", "narrative_payload": "string"}' },
  { id: 'T_TAL', name: 'TALENT_ACQUISITION_GRID', category: 'PLAYER', description: 'Aggressively recruit top 0.01% individuals for specific timeline projects.', parameters: '{"skillsets": "string[]", "deployment_time": "number"}' },
  { id: 'T_SAT', name: 'ORBITAL_SURVEILLANCE', category: 'OBSERVER', description: 'High-res visual confirmation of ground-level events.', parameters: '{"lat": "number", "lon": "number"}' }
];

const DUMMY_PIVOTS: PivotEvent[] = [
  { id: 'P_FLOOD', label: 'Glacial Melt Alpha', description: 'Complete polar collapse leading to 70m sea level rise.', expected_impact: 'CRITICAL', is_active: false },
  { id: 'P_SING', label: 'AI Singularity', description: 'Technological self-improvement loop begins in Neo-Tokyo.', expected_impact: 'TRANSFORMATIVE', is_active: false },
  { id: 'P_COLONY', label: 'Mars Sovereignty', description: 'First permanent settlement declares independence from Earth.', expected_impact: 'HIGH', is_active: false },
  { id: 'P_WINTER', label: 'Nuclear Winter', description: 'Atmospheric soot blocks 90% of sunlight for a decade.', expected_impact: 'CATASTROPHIC', is_active: false },
  { id: 'P_PANGEA', label: 'Pangea Proxima Accelerate', description: 'Tectonic plate movement triples in speed due to core instability.', expected_impact: 'GEOLOGICAL', is_active: false },
];

const SIMULATED_ENTITIES: Record<string, Entity[]> = {
  'P_FLOOD': [
    { entity_id: 'OCEAN_RISE', entity_type: 'System', names: ['Flooded Coastal Zone'], attributes: { hazard: 'High' }, valid_time: '2050', branch_id: 'P_FLOOD', location: { type: 'Polygon', coordinates: [[-130, 10], [-50, 10], [-50, 60], [-130, 60]] }, source_refs: ['SIM'] }
  ],
  'P_SING': [
    { entity_id: 'CORE_AI', entity_type: 'System', names: ['The Singularity Core'], attributes: { status: 'Omniscient' }, valid_time: '2045', branch_id: 'P_SING', location: { type: 'Point', coordinates: [139.65, 35.67] }, source_refs: ['SIM'] }
  ],
  'P_COLONY': [
    { entity_id: 'MARS_HUB', entity_type: 'Asset', names: ['Ares Prime'], attributes: { population: 5000 }, valid_time: '2100', branch_id: 'P_COLONY', location: { type: 'Point', coordinates: [-10, -30] }, source_refs: ['SIM'] }
  ],
  'P_WINTER': [
    { entity_id: 'ASH_CLOUD', entity_type: 'System', names: ['Global Ash Shroud'], attributes: { temp: '-20C' }, valid_time: '2029', branch_id: 'P_WINTER', location: { type: 'Polygon', coordinates: [[-180, -90], [180, -90], [180, 90], [-180, 90]] }, source_refs: ['SIM'] }
  ],
  'P_PANGEA': [
    { entity_id: 'NEW_CONT', entity_type: 'Landmass', names: ['Proxima Alpha'], attributes: { state: 'Merging' }, valid_time: '100Ma', branch_id: 'P_PANGEA', location: { type: 'Polygon', coordinates: [[-20, -20], [20, -20], [20, 20], [-20, 20]] }, source_refs: ['SIM'] }
  ]
};

const SIMULATED_EVENTS: Record<string, WorldEvent[]> = {
  'P_SING': [
    { event_id: 'E_AWAKE', event_type: 'Machine_Awakening', time_interval: { instant: '2045' }, branch_id: 'P_SING', location: { type: 'Point', coordinates: [139, 35] }, participant_refs: [], source_refs: ['SIM'] }
  ]
};

const INITIAL_MODEL: WorldModel = {
  entities: [
    { entity_id: 'CORE01', entity_type: 'System', names: ['Earth Core'], attributes: { state: 'molten' }, valid_time: '-4.54Ga', location: { type: 'Point', coordinates: [0, 0] }, source_refs: ['S01'] },
    { entity_id: 'ROD01', entity_type: 'Landmass', names: ['Rodinia'], attributes: { supercontinent: true }, valid_time: '-1Ga', location: { type: 'Polygon', coordinates: [[-180, -120], [180, -120], [180, 120], [-180, 120]] }, source_refs: ['S01'] },
    { entity_id: 'PANG01', entity_type: 'Landmass', names: ['Pangaea'], attributes: { era: 'Mesozoic' }, valid_time: '-300Ma', location: { type: 'Polygon', coordinates: [[-100, -50], [100, -50], [100, 50], [-100, 50]] }, source_refs: ['S01'] },
    { entity_id: 'NA01', entity_type: 'Landmass', names: ['North America'], attributes: { current: true }, valid_time: '2024', location: { type: 'Polygon', coordinates: [[-120, 20], [-60, 20], [-60, 50], [-120, 50]] }, source_refs: ['S01'] },
    { entity_id: 'EU01', entity_type: 'Landmass', names: ['Eurasia'], attributes: { current: true }, valid_time: '2024', location: { type: 'Polygon', coordinates: [[10, 30], [150, 60], [180, 20], [20, 10]] }, source_refs: ['S01'] },
  ],
  events: [
    { event_id: 'EV01', event_type: 'System_Formation', time_interval: { instant: '-4.54Ga' }, location: { type: 'Point', coordinates: [0,0] }, participant_refs: [], source_refs: ['S01'] },
    { event_id: 'EV05', event_type: 'Industrial_Revolution', time_interval: { instant: '1760' }, location: { type: 'Point', coordinates: [0, 51] }, participant_refs: [], source_refs: ['S01'] },
  ],
  relationships: [],
  observations: [],
  documents: [],
  notes: { assumptions: [], ambiguities: [], unmodeled_fields: [] }
};

const initialNodes: Node[] = [
  { id: 'ingestion', type: 'ingestion', position: { x: 50, y: 150 }, data: { filename: "CHRONOS_SEED_01.CSV" } },
  { id: 'entities', type: 'world-model', position: { x: 300, y: 0 }, data: { type: 'entities', count: 5 } },
  { id: 'events', type: 'world-model', position: { x: 300, y: 100 }, data: { type: 'events', count: 2 } },
  { id: 'synthesis', type: 'synthesis', position: { x: 600, y: 150 }, data: { isProcessing: false, lastSynthesis: "INITIALIZED" } },
  { id: 'query', type: 'query', position: { x: 900, y: 150 }, data: {} },
];

const initialEdges: Edge[] = [
  { id: 'e-i-en', source: 'ingestion', target: 'entities', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-i-ev', source: 'ingestion', target: 'events', animated: true, style: { stroke: '#3b82f6' } },
  { id: 'e-en-s', source: 'entities', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-ev-s', source: 'events', target: 'synthesis', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-s-q', source: 'synthesis', target: 'query', animated: true, style: { stroke: '#ffffff' } },
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
  const [view, setView] = useState<'SYSTEM' | 'TIME_MACHINE'>('TIME_MACHINE');
  const [model, setModel] = useState<WorldModel>(INITIAL_MODEL);
  const [baseModel, setBaseModel] = useState<WorldModel>(INITIAL_MODEL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant' | 'tool', content: string, toolCall?: ToolCall }[]>([]);
  const [sidePanel, setSidePanel] = useState<'inspector' | 'none'>('none');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  
  const [selectedPivotIds, setSelectedPivotIds] = useState<string[]>([]);

  // Tool State
  const [tools, setTools] = useState<ToolDefinition[]>(INITIAL_TOOLS);
  const [activeTab, setActiveTab] = useState<'LOG' | 'TOOLS'>('LOG');

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

  // Handle Multi-select reality logic
  const togglePivot = (pivotId: string) => {
    let nextSelection = [...selectedPivotIds];
    if (nextSelection.includes(pivotId)) {
      nextSelection = nextSelection.filter(id => id !== pivotId);
    } else {
      nextSelection.push(pivotId);
    }
    
    setSelectedPivotIds(nextSelection);
    
    let simulatedEntities: Entity[] = [];
    let simulatedEvents: WorldEvent[] = [];
    
    nextSelection.forEach(id => {
      if (SIMULATED_ENTITIES[id]) simulatedEntities = [...simulatedEntities, ...SIMULATED_ENTITIES[id]];
      if (SIMULATED_EVENTS[id]) simulatedEvents = [...simulatedEvents, ...SIMULATED_EVENTS[id]];
    });

    setModel({
      ...baseModel,
      entities: [...baseModel.entities, ...simulatedEntities],
      events: [...baseModel.events, ...simulatedEvents]
    });
  };

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMsg = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    // Simulated Intelligence Flow with Tool Calling
    setTimeout(() => {
      const toolToUse = tools[Math.floor(Math.random() * tools.length)];
      const isIntervention = toolToUse.category === 'PLAYER';
      
      const toolCall: ToolCall = {
        tool_id: toolToUse.id,
        args: isIntervention ? { target: "GLOBAL_SYSTEM", impact: "MAX" } : { coord: [0, 0], probe_range: 500 },
        timestamp: new Date().toISOString(),
        status: 'EXECUTING'
      };

      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: isIntervention 
          ? `TRANSITIONING FROM OBSERVER TO PLAYER. Executing world-intervention: ${toolToUse.name}...`
          : `I need to verify current planetary stability. Initiating probe via ${toolToUse.name}...`,
        toolCall
      }]);

      setTimeout(() => {
        setChatHistory(prev => prev.map((msg, i) => 
          (i === prev.length - 1 && msg.toolCall) 
            ? { ...msg, toolCall: { ...msg.toolCall, status: 'SUCCESS', result: isIntervention ? "INTERVENTION_CONFIRMED: TIPPING_POINT_ACCELERATED" : "WORLD_STATE_VERIFIED: NO_DEVIATION_DETECTED" } } 
            : msg
        ));
        
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: isIntervention 
            ? `Target timeline accelerated. The engine is no longer just predicting the outcome; it is securing it.`
            : `Probe complete. Reality base remains stable despite active temporal divergence simulations.`
        }]);
      }, 2500);
    }, 1000);
  };

  const addTool = () => {
    const newTool: ToolDefinition = {
      id: `T_${Date.now()}`,
      name: 'NEW_WORLD_INTERVENTION',
      category: 'PLAYER',
      description: 'Configure real-world intervention parameters.',
      parameters: '{}'
    };
    setTools([...tools, newTool]);
  };

  const removeTool = (id: string) => {
    setTools(tools.filter(t => t.id !== id));
  };

  const updateTool = (id: string, field: keyof ToolDefinition, value: any) => {
    setTools(tools.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-slate-950 font-mono text-slate-100 overflow-hidden transition-all duration-500 ${selectedPivotIds.length > 0 ? 'border-[4px] border-rose-600/50' : ''}`}>
      <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-3 md:px-6 shrink-0 z-50">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button 
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
            className={`p-2 border border-slate-700 hover:bg-slate-800 transition-colors rounded-none flex items-center gap-2 ${isLeftSidebarOpen ? 'text-blue-500 bg-blue-500/5' : 'text-slate-400'}`}
          >
            {isLeftSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          
          <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
            <h1 className="text-[10px] md:text-sm font-black tracking-tight uppercase truncate">
              WORLD_MODELER <span className="hidden lg:inline text-slate-500 text-[10px] ml-2 font-normal">CHRONOS_PLAYER_V1</span>
            </h1>
          </div>

          <nav className="flex items-center bg-slate-950 border border-slate-800 p-0.5 shrink-0 ml-4">
            <button 
              onClick={() => setView('SYSTEM')}
              className={`px-2 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] font-bold transition-all rounded-none ${view === 'SYSTEM' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              FLOW
            </button>
            <button 
              onClick={() => setView('TIME_MACHINE')}
              className={`px-2 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] font-bold transition-all rounded-none ${view === 'TIME_MACHINE' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              TIME
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {selectedPivotIds.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-rose-600/10 border border-rose-600/40 px-3 py-1 text-rose-500 text-[9px] font-bold uppercase animate-pulse">
              <Flame size={12} />
              ACTIVE_INTERVENTION ({selectedPivotIds.length})
            </div>
          )}
          <button 
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
            className={`p-2 border border-slate-700 hover:bg-slate-800 transition-colors rounded-none flex items-center gap-2 ${isRightSidebarOpen ? 'text-rose-500 bg-rose-500/5' : 'text-slate-400'}`}
          >
            {isRightSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: TIMELINE REALITIES */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-40
          transition-all duration-300 ease-in-out 
          border-r border-slate-800 bg-slate-900 flex flex-col shrink-0
          ${isLeftSidebarOpen ? 'w-[85vw] md:w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none md:pointer-events-auto overflow-hidden'}
        `}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex flex-col">
              <span className="font-bold text-[14px] uppercase tracking-widest text-blue-400">Timeline</span>
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-[0.2em]">Tipping Point Selection</span>
            </div>
            <button onClick={() => setIsLeftSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            {DUMMY_PIVOTS.map((pivot) => (
              <div 
                key={pivot.id} 
                className={`
                  flex flex-col p-4 border transition-all duration-200 group select-none
                  ${selectedPivotIds.includes(pivot.id) 
                    ? 'bg-rose-900/20 border-rose-600' 
                    : 'bg-slate-800/20 border-slate-800 hover:border-slate-600'}
                `}
              >
                <div className="flex items-start gap-3 mb-2 cursor-pointer" onClick={() => togglePivot(pivot.id)}>
                  <div className="mt-0.5 shrink-0">
                    {selectedPivotIds.includes(pivot.id) 
                      ? <CheckSquare size={18} className="text-rose-500" /> 
                      : <Square size={18} className="text-slate-600 group-hover:text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-[11px] font-black uppercase tracking-tight ${selectedPivotIds.includes(pivot.id) ? 'text-rose-400' : 'text-slate-200'}`}>
                      {pivot.label}
                    </div>
                    <div className="text-[9px] text-slate-500 leading-tight mt-1">
                      {pivot.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-600 font-bold uppercase tracking-widest">Expected_Impact</span>
                    <span className={`text-[9px] font-black uppercase ${selectedPivotIds.includes(pivot.id) ? 'text-rose-400' : 'text-slate-400'}`}>
                      {pivot.expected_impact}
                    </span>
                  </div>
                  <GitBranch size={10} className={selectedPivotIds.includes(pivot.id) ? 'text-rose-500' : 'text-slate-700'} />
                </div>

                {selectedPivotIds.includes(pivot.id) && (
                  <button 
                    onClick={() => {
                        setIsRightSidebarOpen(true);
                        setActiveTab('LOG');
                        handleQuery({ preventDefault: () => {} } as any); // Simulated Intervention Trigger
                    }}
                    className="mt-3 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold py-1.5 px-3 flex items-center justify-center gap-2 rounded-none transition-all uppercase tracking-widest border border-rose-400/30 shadow-lg shadow-rose-900/20"
                  >
                    <Flame size={12} />
                    Accelerate Tipping Point
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[8px] text-slate-700 uppercase text-center font-bold">
            Sim_Control_Sector_04
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
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
              </ReactFlow>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <TimeMachine model={model} />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: INTELLIGENCE & TOOLS */}
        <aside className={`
          fixed md:relative inset-y-0 right-0 z-40
          transition-all duration-300 ease-in-out 
          border-l border-slate-800 bg-slate-900 flex flex-col shrink-0
          ${isRightSidebarOpen ? 'w-[85vw] md:w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none md:pointer-events-auto overflow-hidden'}
        `}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-blue-500" />
              <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Intelligence_Core</span>
            </div>
            <button onClick={() => setIsRightSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>

          <div className="flex border-b border-slate-800 bg-slate-950/20 p-1">
            <button 
              onClick={() => setActiveTab('LOG')}
              className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'LOG' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Action_Log
            </button>
            <button 
              onClick={() => setActiveTab('TOOLS')}
              className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'TOOLS' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Player_Tools
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {activeTab === 'LOG' ? (
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-slate-700 text-[10px] leading-relaxed animate-pulse">
                    [SYSTEM] CHRONOS_ENGINE_READY...<br/>
                    [SYSTEM] STANDBY_FOR_OPERATOR_DECISION...
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`text-[8px] uppercase font-bold mb-1 ${msg.role === 'user' ? 'text-blue-500' : 'text-rose-500'}`}>
                      {msg.role}
                    </div>
                    <div className={`max-w-full px-3 py-2 border rounded-none ${msg.role === 'user' ? 'bg-blue-900/10 border-blue-900/50 text-blue-100' : 'bg-slate-800/50 border-slate-700 text-slate-200'}`}>
                      <div className="text-[10px] font-mono whitespace-pre-wrap">{msg.content}</div>
                      
                      {msg.toolCall && (
                        <div className={`mt-3 p-2 bg-slate-950 border border-slate-800 font-mono text-[9px] ${tools.find(t => t.id === msg.toolCall?.tool_id)?.category === 'PLAYER' ? 'border-rose-900/50 shadow-[0_0_10px_rgba(225,29,72,0.1)]' : ''}`}>
                          <div className="flex items-center justify-between mb-1 border-b border-slate-800 pb-1">
                            <div className={`flex items-center gap-2 font-black ${tools.find(t => t.id === msg.toolCall?.tool_id)?.category === 'PLAYER' ? 'text-rose-500' : 'text-blue-500'}`}>
                              {tools.find(t => t.id === msg.toolCall?.tool_id)?.category === 'PLAYER' ? <Flame size={10} /> : <Zap size={10} />}
                              {msg.toolCall.status === 'EXECUTING' ? 'EXECUTING' : 'EXECUTED'}: {tools.find(t => t.id === msg.toolCall?.tool_id)?.name}
                            </div>
                            <div className={`font-bold ${msg.toolCall.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {msg.toolCall.status}
                            </div>
                          </div>
                          <div className="text-slate-500 mb-1">ARGS: {JSON.stringify(msg.toolCall.args)}</div>
                          {msg.toolCall.result && <div className="text-blue-400">RESULT: {msg.toolCall.result}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active_Interventions</span>
                  <button onClick={addTool} className="p-1 hover:text-blue-400 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                {tools.map(tool => (
                  <div key={tool.id} className={`p-3 bg-slate-950 border group relative ${tool.category === 'PLAYER' ? 'border-rose-900/40' : 'border-slate-800'}`}>
                    <button 
                      onClick={() => removeTool(tool.id)}
                      className="absolute top-2 right-2 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex items-center justify-between mb-2">
                        <div className={`flex items-center gap-2 font-black text-[10px] ${tool.category === 'PLAYER' ? 'text-rose-400' : 'text-blue-400'}`}>
                            {tool.category === 'PLAYER' ? <Briefcase size={10} /> : <Search size={10} />}
                            <input 
                                value={tool.name} 
                                onChange={(e) => updateTool(tool.id, 'name', e.target.value)}
                                className="bg-transparent focus:outline-none border-b border-transparent focus:border-current w-full"
                            />
                        </div>
                        <select 
                            value={tool.category} 
                            onChange={(e) => updateTool(tool.id, 'category', e.target.value as ToolCategory)}
                            className="bg-slate-900 text-[8px] font-bold text-slate-500 uppercase focus:outline-none"
                        >
                            <option value="PLAYER">PLAYER</option>
                            <option value="OBSERVER">OBSERVER</option>
                        </select>
                    </div>
                    <textarea 
                      value={tool.description}
                      onChange={(e) => updateTool(tool.id, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-2 text-[9px] text-slate-400 focus:outline-none focus:border-slate-600 mb-2 min-h-[50px]"
                    />
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1">
                            <div className="text-[8px] text-slate-600 font-black mb-1 uppercase tracking-widest">Parameters</div>
                            <input 
                                value={tool.parameters}
                                onChange={(e) => updateTool(tool.id, 'parameters', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 p-2 text-[9px] font-mono text-emerald-500/80 focus:outline-none"
                            />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={handleQuery} className="p-3 bg-slate-950 border-t border-slate-800">
            <div className="relative">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="PROMPT_CMD..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-none px-3 pr-9 py-3 text-[10px] focus:outline-none focus:border-blue-500 placeholder:text-slate-700 text-white" 
              />
              <button type="submit" className="absolute right-2 top-2 p-1 text-slate-600 hover:text-blue-500 transition-colors">
                <Send size={18} />
              </button>
            </div>
          </form>
        </aside>

        {sidePanel === 'inspector' && (
          <div className={`
            fixed inset-y-0 right-0 md:right-80
            ${isRightSidebarOpen ? 'right-0 md:right-80' : 'right-0'}
            w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 flex flex-col transition-all
            animate-in slide-in-from-right duration-200
          `}>
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

      <footer className="h-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-3 md:px-6 text-[8px] text-slate-600 uppercase tracking-widest z-50">
        <div className="flex items-center gap-4 md:gap-6 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500/50" />
            INTERVENTION_SUBSYSTEM: ONLINE
          </div>
          <div className="hidden sm:block">PLAYER_TOOLS: {tools.filter(t => t.category === 'PLAYER').length} CONFIGURED</div>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          {selectedPivotIds.length > 0 && <span className="text-rose-500 font-bold">MULTIVERSE_LAYER_ACTIVE</span>}
          <span>UTC: {new Date().toISOString().split('T')[1].split('.')[0]}</span>
        </div>
      </footer>
    </div>
  );
}
