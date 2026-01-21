import { WorldModel } from './types';

/**
 * LOCAL_PROJECTION_ENGINE v2.4.0
 * Simulates reality projection without external API dependencies.
 */
export const generateWorldModel = async (input: string): Promise<WorldModel> => {
  // Simulate heavy computation latency
  await new Promise(resolve => setTimeout(resolve, 2200));

  const lowerInput = input.toLowerCase();

  // Base Reality Template
  const baseModel: WorldModel = {
    entities: [
      {
        entity_id: "ORG-ROOT",
        entity_type: "Organization",
        names: ["SolarFlow Dynamics", "SFD"],
        attributes: [
          { key: "Sector", value: "Clean Energy" },
          { key: "Market_Cap", value: "2.4B USD" },
          { key: "Health_Status", value: "Optimal" }
        ],
        source_refs: ["DOC-001"]
      },
      {
        entity_id: "PEO-001",
        entity_type: "Person",
        names: ["Mark Venture"],
        attributes: [{ key: "Role", value: "CEO" }, { key: "Access_Level", value: "Alpha" }],
        source_refs: ["DOC-001"]
      },
      {
        entity_id: "PEO-002",
        entity_type: "Person",
        names: ["Dr. Elena Glass"],
        attributes: [{ key: "Role", value: "CTO" }, { key: "Domain", value: "Nanotech" }],
        source_refs: ["DOC-001"]
      },
      {
        entity_id: "LOC-001",
        entity_type: "Location",
        names: ["Austin Deep-Tech HQ"],
        attributes: [{ key: "Coordinates", value: "30.2672° N, 97.7431° W" }],
        source_refs: ["DOC-001"]
      }
    ],
    events: [
      {
        event_id: "EVT-Q_REVIEW",
        event_type: "Strategic Meeting",
        time_interval: { instant: "2023-11-12T09:30:00Z" },
        location_ref: "LOC-001",
        participant_refs: [
          { entity_id: "PEO-001", role: "Chair" },
          { entity_id: "PEO-002", role: "Presenter" }
        ],
        effects: ["R&D Budget Locked", "Phase 4 Expansion Approved"],
        source_refs: ["DOC-001"]
      }
    ],
    relationships: [
      {
        relationship_id: "REL-001",
        relationship_type: "Reporting_Line",
        from_entity_id: "PEO-002",
        to_entity_id: "PEO-001",
        confidence: 0.99,
        source_refs: ["DOC-001"]
      },
      {
        relationship_id: "REL-002",
        relationship_type: "Operational_Base",
        from_entity_id: "ORG-ROOT",
        to_entity_id: "LOC-001",
        confidence: 1.0,
        source_refs: ["DOC-001"]
      }
    ],
    observations: [
      {
        observation_id: "OBS-001",
        subject_ref: "ORG-ROOT",
        metric_name: "Silicon_Throughput",
        value: 98.4,
        unit: "%",
        observation_time: "2023-11-12T09:30:00Z",
        source_refs: ["DOC-001"]
      }
    ],
    documents: [
      {
        document_id: "DOC-001",
        document_type: "Operational Log",
        content_ref: "INTERNAL_CORE_FEED",
        extracted_refs: ["ORG-ROOT", "PEO-001", "PEO-002", "LOC-001"],
        provenance: { origin: "Austin Node", timestamp: "2023-11-12T08:00:00Z" }
      }
    ],
    notes: {
      assumptions: ["CEO/CTO presence implies strategic intent.", "Throughput metric verified against 24h average."],
      ambiguities: ["Exact location of meeting room within HQ unknown."],
      unmodeled_fields: ["Climate control settings", "Catering requests"]
    }
  };

  // Logic Injection: Modify the model based on input keywords
  if (lowerInput.includes("logistics") || lowerInput.includes("port") || lowerInput.includes("neon sky")) {
    baseModel.entities.push(
      {
        entity_id: "ORG-GLC",
        entity_type: "Organization",
        names: ["Global Logistics Corp"],
        attributes: [{ key: "Fleet_Size", value: "140 Carriers" }],
        source_refs: ["DOC-002"]
      },
      {
        entity_id: "AST-NS",
        entity_type: "Asset",
        names: ["Neon Sky"],
        attributes: [{ key: "Class", value: "Panamax" }, { key: "Status", value: "Docked" }],
        source_refs: ["DOC-002"]
      }
    );
    baseModel.events.push({
      event_id: "EVT-LOG_DISCHARGE",
      event_type: "Cargo Operation",
      time_interval: { instant: "2023-11-14T14:00:00Z" },
      participant_refs: [
        { entity_id: "ORG-GLC", role: "Handler" },
        { entity_id: "AST-NS", role: "Subject" }
      ],
      effects: ["Inventory Rebalance initiated"],
      source_refs: ["DOC-002"]
    });
    baseModel.relationships.push({
      relationship_id: "REL-LOG_01",
      relationship_type: "Chartered_By",
      from_entity_id: "ORG-GLC",
      to_entity_id: "ORG-ROOT",
      confidence: 0.95,
      source_refs: ["DOC-002"]
    });
    baseModel.documents.push({
      document_id: "DOC-002",
      document_type: "Shipping Manifest",
      content_ref: "ROTTERDAM_HARBOR_FEED",
      extracted_refs: ["ORG-GLC", "AST-NS"],
      provenance: { origin: "Rotterdam Port Authority", timestamp: "2023-11-14T12:00:00Z" }
    });
  }

  // Final check for empty input simulation
  if (input.trim().length < 20) {
    throw new Error("DATA_DENSITY_LOW: Projection requires minimum 20 chars of context.");
  }

  return baseModel;
};
