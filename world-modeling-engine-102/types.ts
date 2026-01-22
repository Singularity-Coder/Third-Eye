
export enum ObjectType {
  ENTITY = 'Entity',
  EVENT = 'Event',
  RELATIONSHIP = 'Relationship',
  OBSERVATION = 'Observation',
  DOCUMENT = 'Document'
}

export interface Geometry {
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][]; // [lon, lat] or [[lon, lat], ...]
  // For continental drift, we might have velocity or keyframe paths
  velocity?: { x: number, y: number };
}

export interface Entity {
  entity_id: string;
  entity_type: string;
  names: string[];
  attributes: Record<string, string | number | boolean>;
  valid_time?: string; // ISO string or simple year for historical data
  location?: Geometry;
  source_refs: string[];
}

export interface WorldEvent {
  event_id: string;
  event_type: string;
  // Changed: Made start optional to allow instant-only events as seen in INITIAL_MODEL
  time_interval: { start?: string; end?: string; instant?: string };
  location_ref?: string;
  location?: Geometry;
  participant_refs: { entity_id: string; role: string }[];
  inputs?: string[];
  outputs?: string[];
  effects?: string[];
  source_refs: string[];
}

export interface Relationship {
  relationship_id: string;
  relationship_type: string;
  from_entity_id: string;
  to_entity_id: string;
  valid_time?: string;
  confidence: number;
  source_refs: string[];
}

export interface Observation {
  observation_id: string;
  subject_ref: string;
  metric_name: string;
  value: string | number;
  unit?: string;
  observation_time: string;
  uncertainty?: string;
  source_refs: string[];
}

export interface EvidenceDocument {
  document_id: string;
  document_type: string;
  content_ref: string;
  extracted_refs: string[];
  provenance: { origin: string; timestamp: string };
  credibility?: number;
}

export interface WorldModel {
  entities: Entity[];
  events: WorldEvent[];
  relationships: Relationship[];
  observations: Observation[];
  documents: EvidenceDocument[];
  notes: {
    assumptions: string[];
    ambiguities: string[];
    unmodeled_fields: string[];
  };
}

export interface AppState {
  currentModel: WorldModel;
  isProcessing: boolean;
  history: string[];
}
