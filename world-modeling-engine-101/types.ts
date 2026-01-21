export type EntityType = 'Person' | 'Organization' | 'Location' | 'Asset' | 'Product' | 'System';

export interface Attribute {
  key: string;
  value: string | number | boolean;
}

export interface Entity {
  entity_id: string;
  entity_type: EntityType;
  names: string[];
  attributes: Attribute[];
  valid_time?: string;
  source_refs: string[];
}

export interface ParticipantRef {
  entity_id: string;
  role: string;
}

export interface Event {
  event_id: string;
  event_type: string;
  time_interval: {
    start?: string;
    end?: string;
    instant?: string;
  };
  location_ref?: string;
  participant_refs: ParticipantRef[];
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
  uncertainty?: number;
  source_refs: string[];
}

export interface Document {
  document_id: string;
  document_type: string;
  content_ref: string;
  extracted_refs: string[];
  provenance: {
    origin: string;
    timestamp: string;
  };
  credibility?: number;
}

export interface WorldModel {
  entities: Entity[];
  events: Event[];
  relationships: Relationship[];
  observations: Observation[];
  documents: Document[];
  notes: {
    assumptions: string[];
    ambiguities: string[];
    unmodeled_fields: string[];
  };
}