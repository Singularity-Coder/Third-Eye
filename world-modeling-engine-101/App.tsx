import React, { useState, useMemo, useEffect } from 'react';
import { generateWorldModel } from './geminiService';
import { WorldModel, Entity, Event, Relationship, Observation, Document, Attribute } from './types';
import GraphView from './components/GraphView';
import TimelineView from './components/TimelineView';

const SAMPLE_DATA = `DATA INGESTION LOG [PROD_STREAM_A]
-----------------------------------
TIMESTAMP: 2023-11-12T09:30:00Z
LOCATION: Austin Deep-Tech Corridor
ENTITY: SolarFlow Dynamics (ID: SFD-001)
EVENT: Quarterly Strategic Review
PARTICIPANTS: Mark Venture (CEO), Dr. Elena Glass (CTO)
OBSERVATION: Silicon throughput at 98.4% nominal.
RELATIONSHIP: Glass is employed by SolarFlow since 2018.

TIMESTAMP: 2023-11-14T14:00:00Z
LOCATION: Rotterdam Port Authority
EVENT: Logistics Discharge
ENTITY: Global Logistics Corp (GLC)
ASSET: Cargo Vessel "Neon Sky"
ACTION: Unloaded 500 units of Gen-4 Solar Modules destined for Austin.`;

const App: React.FC = () => {
  const [inputData, setInputData] = useState(SAMPLE_DATA);
  const [isProcessing, setIsProcessing] = useState(false);
  const [worldModel, setWorldModel] = useState<WorldModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'data' | 'notes'>('graph');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!inputData.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const model = await generateWorldModel(inputData);
      setWorldModel(model);
      setActiveTab('graph');
    } catch (err: any) {
      setError(err.message || 'Projection engine failure.');
    } finally {
      setIsProcessing(false);
    }
  };

  const modelStats = useMemo(() => {
    if (!worldModel) return null;
    return {
      entities: worldModel.entities.length,
      events: worldModel.events.length,
      relationships: worldModel.relationships.length,
      metrics: worldModel.observations.length,
      sources: worldModel.documents.length
    };
  }, [worldModel]);

  const selectedEntity = useMemo(() => 
    worldModel?.entities.find(e => e.entity_id === selectedEntityId)
  , [worldModel, selectedEntityId]);

  const relatedRelationships = useMemo(() => {
    if (!selectedEntityId || !worldModel) return [];
    return worldModel.relationships.filter(r => 
      r.from_entity_id === selectedEntityId || r.to_entity_id === selectedEntityId
    );
  }, [worldModel, selectedEntityId]);

  return (
    <div className="flex flex-col h-screen bg-[#050506] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <header className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-black/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
            <i className="fa-solid fa-cube text-white text-lg"></i>
          </div>
          <div>
             <h1 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-2">
               World Engine <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono tracking-normal">LOCAL_CORE</span>
             </h1>
             <div className="text-[9px] text-slate-500 font-mono leading-none tracking-widest uppercase mt-0.5">Reality Projection System // v2.4.0</div>
          </div>
        </div>

        {modelStats && (
          <div className="hidden md:flex items-center gap-6 border-l border-white/5 pl-6">
            {[
              { label: 'Entities', val: modelStats.entities, icon: 'fa-id-badge' },
              { label: 'Events', val: modelStats.events, icon: 'fa-calendar' },
              { label: 'Links', val: modelStats.relationships, icon: 'fa-link' }
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-slate-600 tracking-tighter mb-0.5">{s.label}</span>
                <span className="text-xs font-bold font-mono text-indigo-400">{s.val.toString().padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-gear text-xs"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Workbench */}
        <section className="w-80 lg:w-96 border-r border-white/5 flex flex-col bg-[#08080a] z-10">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ingestion Workbench</h2>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            </div>
          </div>
          
          <div className="flex-1 p-5 flex flex-col gap-5 overflow-hidden">
            <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source Buffer</label>
                <button onClick={() => setInputData('')} className="text-[9px] text-slate-600 hover:text-indigo-400 font-mono">[ CLEAR ]</button>
              </div>
              <textarea 
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Awaiting data input..."
                className="flex-1 bg-black border border-white/5 rounded-lg p-4 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder:text-slate-800 text-indigo-100/90 leading-relaxed shadow-inner"
              />
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || !inputData}
              className={`w-full py-4 rounded-xl border flex items-center justify-center gap-3 font-black text-xs tracking-[0.25em] transition-all group
                ${isProcessing 
                  ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20 cursor-wait' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.3)] hover:translate-y-[-1px]'}`}
            >
              {isProcessing ? (
                <><i className="fa-solid fa-circle-notch fa-spin"></i> PROJECTING...</>
              ) : (
                <><i className="fa-solid fa-bolt group-hover:animate-pulse"></i> GENERATE REALITY</>
              )}
            </button>
          </div>

          {error && (
            <div className="mx-5 mb-5 p-3.5 bg-red-500/5 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-mono flex gap-3 items-start">
              <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-black/40 text-[9px] font-mono text-slate-600 border-t border-white/5 flex justify-between uppercase">
            <span>Kernel: Local_Core</span>
            <span className="text-indigo-500/50">Safe Mode: Active</span>
          </div>
        </section>

        {/* Right Side: Projected Views */}
        <section className="flex-1 flex flex-col bg-black overflow-hidden relative">
          {worldModel ? (
            <>
              <div className="h-12 border-b border-white/5 flex items-center px-4 bg-white/[0.02] justify-between">
                <nav className="flex h-full">
                  {(['graph', 'timeline', 'data', 'notes'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative
                        ${activeTab === tab 
                          ? 'text-white' 
                          : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      {tab}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
                    </button>
                  ))}
                </nav>
                <div className="flex gap-2">
                   <div className="text-[10px] font-mono text-slate-600 mr-4">MODEL_ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative overflow-hidden">
                  {activeTab === 'graph' && (
                    <div className="w-full h-full p-6">
                       <GraphView 
                        entities={worldModel.entities} 
                        relationships={worldModel.relationships}
                        onSelectEntity={setSelectedEntityId}
                        selectedEntityId={selectedEntityId}
                      />
                    </div>
                  )}
                  {activeTab === 'timeline' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-12">
                      <div className="max-w-2xl mx-auto">
                        <TimelineView events={worldModel.events} />
                      </div>
                    </div>
                  )}
                  {activeTab === 'data' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-12 space-y-16">
                      <section>
                        <h3 className="text-[10px] font-black text-slate-600 uppercase mb-8 tracking-[0.4em] border-l-2 border-indigo-500 pl-4">Telemetry Streams</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {worldModel.observations.map(obs => (
                            <div key={obs.observation_id} className="bg-[#0c0c0e] p-6 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition-all group relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors"></div>
                              <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{obs.metric_name}</span>
                                <span className="text-[9px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{new Date(obs.observation_time).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-4xl font-black text-white flex items-baseline gap-2">
                                 {obs.value} <span className="text-sm font-medium text-slate-500">{obs.unit}</span>
                              </div>
                              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-600 uppercase">
                                <span>Ref: <span className="text-indigo-300">{obs.subject_ref}</span></span>
                                <span>Status: Verified</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-[10px] font-black text-slate-600 uppercase mb-8 tracking-[0.4em] border-l-2 border-indigo-500 pl-4">Evidence Core</h3>
                        <div className="space-y-3">
                          {worldModel.documents.map(doc => (
                            <div key={doc.document_id} className="bg-[#0c0c0e] border border-white/5 p-5 rounded-xl flex items-center justify-between group hover:bg-[#111114] transition-all">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                                   <i className="fa-solid fa-file-invoice text-xl"></i>
                                </div>
                                <div>
                                  <div className="text-xs font-black text-white uppercase tracking-tight">{doc.document_id}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-1">{doc.provenance.origin} — {doc.provenance.timestamp}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <div className="text-[9px] text-indigo-500 font-black tracking-[0.2em] uppercase">{doc.document_type}</div>
                                   <div className="text-[9px] text-slate-600 font-mono mt-0.5">{doc.extracted_refs.length} Entities Found</div>
                                </div>
                                <button className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-slate-600 hover:bg-white/10 hover:text-white transition-all">
                                  <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                  {activeTab === 'notes' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-12 font-mono">
                       <div className="max-w-3xl mx-auto space-y-16">
                         <div>
                            <h4 className="text-[11px] font-black text-amber-500 mb-8 uppercase tracking-[0.5em] flex items-center gap-3">
                              <i className="fa-solid fa-brain"></i> Engine Assumptions
                            </h4>
                            <div className="grid gap-4">
                              {worldModel.notes.assumptions.map((note, i) => (
                                <div key={i} className="text-xs text-slate-400 bg-amber-500/[0.03] p-5 rounded-xl border border-amber-500/10 leading-relaxed flex gap-5 group hover:bg-amber-500/[0.05] transition-colors">
                                  <span className="text-amber-500/30 font-black">[{String(i+1).padStart(2,'0')}]</span> 
                                  <span>{note}</span>
                                </div>
                              ))}
                            </div>
                         </div>
                         
                         <div className="pt-16 border-t border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                            <h4 className="text-[11px] font-black text-slate-500 mb-8 uppercase tracking-[0.5em]">System Ambiguities</h4>
                            <div className="grid gap-2">
                              {worldModel.notes.ambiguities.map((note, i) => (
                                <div key={i} className="text-[11px] text-slate-600 flex gap-4">
                                  <span className="text-slate-800 tracking-tighter">UNK_REF_{i}</span>
                                  <span>{note}</span>
                                </div>
                              ))}
                            </div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* Right Panel: Inspector */}
                {selectedEntity && (
                  <aside className="w-80 lg:w-96 border-l border-white/5 bg-[#08080a] overflow-y-auto custom-scrollbar flex flex-col p-8 animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-10">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Data Object Inspector</span>
                      <button onClick={() => setSelectedEntityId(null)} className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                        <i className="fa-solid fa-xmark text-xs"></i>
                      </button>
                    </div>

                    <div className="mb-10">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] bg-indigo-500/10 px-2 py-0.5 rounded">{selectedEntity.entity_type}</span>
                        <span className="text-[9px] text-slate-600 font-mono">UID: {selectedEntity.entity_id}</span>
                      </div>
                      <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{selectedEntity.names[0]}</h2>
                      {selectedEntity.names.length > 1 && (
                        <div className="text-[10px] text-slate-500 font-mono mt-2 italic">AKA: {selectedEntity.names.slice(1).join(', ')}</div>
                      )}
                    </div>

                    <div className="space-y-10">
                      <div>
                        <div className="text-[10px] text-slate-600 uppercase font-black mb-5 tracking-[0.2em]">Attributes</div>
                        <div className="grid gap-2">
                          {selectedEntity.attributes.map((attr: Attribute, idx: number) => (
                            <div key={idx} className="flex flex-col bg-white/[0.02] p-4 rounded-xl border border-white/5">
                              <span className="text-[9px] text-slate-500 uppercase font-bold mb-1.5">{attr.key.replace(/_/g, ' ')}</span>
                              <span className="text-xs text-indigo-100 font-mono break-all">{String(attr.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-600 uppercase font-black mb-5 tracking-[0.2em]">Network Topology</div>
                        {relatedRelationships.length > 0 ? (
                           <div className="grid gap-3">
                             {relatedRelationships.map(rel => {
                               const isSource = rel.from_entity_id === selectedEntityId;
                               const targetId = isSource ? rel.to_entity_id : rel.from_entity_id;
                               const targetNode = worldModel.entities.find(e => e.entity_id === targetId);
                               return (
                                 <div 
                                    key={rel.relationship_id} 
                                    className="bg-indigo-500/[0.02] border border-white/5 p-4 rounded-xl hover:border-indigo-500/30 cursor-pointer transition-all group"
                                    onClick={() => setSelectedEntityId(targetId)}
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em]">{rel.relationship_type.replace(/_/g, ' ')}</div>
                                      <div className="text-[8px] text-slate-600 font-mono">CONF: {(rel.confidence * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors"></div>
                                       <span className="text-[11px] text-slate-300 font-bold truncate">{targetNode?.names[0] || targetId}</span>
                                    </div>
                                 </div>
                               );
                             })}
                           </div>
                        ) : (
                          <div className="text-[10px] text-slate-700 italic font-mono px-4 py-2 bg-white/[0.02] rounded-lg border border-dashed border-white/5 text-center">No topology links detected.</div>
                        )}
                      </div>
                    </div>
                  </aside>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative">
               <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                 <div className="w-[1000px] h-[1000px] bg-indigo-500/20 rounded-full blur-[120px] absolute -top-1/2 -left-1/2 animate-pulse"></div>
               </div>
               <div className="relative">
                 <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                    <i className="fa-solid fa-hurricane text-4xl text-slate-400"></i>
                 </div>
                 <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Awaiting Projection</h3>
                 <p className="max-w-md text-sm text-slate-500 font-medium leading-relaxed mb-8 mx-auto">
                   Feed high-density data into the Ingestion Workbench to materialize a structural world model.
                 </p>
                 <button 
                  onClick={handleProcess}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                 >Initialize Kernel</button>
               </div>
            </div>
          )}
        </section>
      </main>

      <footer className="h-8 border-t border-white/5 bg-black px-6 flex items-center justify-between text-[9px] font-mono font-bold text-slate-600 z-20">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${worldModel ? 'bg-emerald-500' : 'bg-slate-800'}`}></span>
            KERNEL_STATE: {worldModel ? 'STABLE_STREAMS' : 'IDLE_WAIT'}
          </span>
          <span className="text-slate-700 hidden sm:inline">MEM: 1.2GB/16GB</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-indigo-500/50 uppercase tracking-widest">Reality Orchestrator Local Build</span>
          <span className="text-slate-800">|</span>
          <span className="text-slate-700">COORD: {Math.floor(Math.random()*1000)}:{Math.floor(Math.random()*1000)}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
