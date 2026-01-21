
import { GoogleGenAI, Type } from "@google/genai";
import { WorldModel } from "../types";

const SYSTEM_INSTRUCTION = `
You are a World Modeling Engine.
Your job is to transform data into a unified operational world model using a fixed ontology.
You do NOT summarize. You do NOT invent facts. You do NOT assume meaning without evidence.

ONTOLOGY:
1) Entity: Persistent things (Person, Organization, Location, Asset, Product, System).
2) Event: Occurrences (Transaction, Shipment, Meeting, Incident, Performance).
3) Relationship: Time-bounded connection between two entities (Employment, Ownership, etc.).
4) Observation: Measurements/Values tied to a subject.
5) Document: Raw source material.

STRICT JSON OUTPUT REQUIRED.
`;

export const extractWorldModel = async (rawData: string): Promise<WorldModel> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this data into the world model ontology:\n\n${rawData}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                entity_id: { type: Type.STRING },
                entity_type: { type: Type.STRING },
                names: { type: Type.ARRAY, items: { type: Type.STRING } },
                attributes: { type: Type.OBJECT },
                valid_time: { type: Type.STRING },
                source_refs: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["entity_id", "entity_type", "names", "source_refs"]
            }
          },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                event_id: { type: Type.STRING },
                event_type: { type: Type.STRING },
                time_interval: {
                  type: Type.OBJECT,
                  properties: {
                    start: { type: Type.STRING },
                    end: { type: Type.STRING },
                    instant: { type: Type.STRING }
                  }
                },
                location_ref: { type: Type.STRING },
                participant_refs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      entity_id: { type: Type.STRING },
                      role: { type: Type.STRING }
                    }
                  }
                },
                inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                outputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                effects: { type: Type.ARRAY, items: { type: Type.STRING } },
                source_refs: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["event_id", "event_type", "time_interval", "source_refs"]
            }
          },
          relationships: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                relationship_id: { type: Type.STRING },
                relationship_type: { type: Type.STRING },
                from_entity_id: { type: Type.STRING },
                to_entity_id: { type: Type.STRING },
                valid_time: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                source_refs: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["relationship_id", "relationship_type", "from_entity_id", "to_entity_id", "source_refs"]
            }
          },
          observations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                observation_id: { type: Type.STRING },
                subject_ref: { type: Type.STRING },
                metric_name: { type: Type.STRING },
                value: { type: Type.STRING },
                unit: { type: Type.STRING },
                observation_time: { type: Type.STRING },
                uncertainty: { type: Type.STRING },
                source_refs: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["observation_id", "subject_ref", "metric_name", "value", "observation_time", "source_refs"]
            }
          },
          documents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                document_id: { type: Type.STRING },
                document_type: { type: Type.STRING },
                content_ref: { type: Type.STRING },
                extracted_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
                provenance: {
                  type: Type.OBJECT,
                  properties: {
                    origin: { type: Type.STRING },
                    timestamp: { type: Type.STRING }
                  }
                },
                credibility: { type: Type.NUMBER }
              },
              required: ["document_id", "document_type", "content_ref", "extracted_refs", "provenance"]
            }
          },
          notes: {
            type: Type.OBJECT,
            properties: {
              assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              ambiguities: { type: Type.ARRAY, items: { type: Type.STRING } },
              unmodeled_fields: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        required: ["entities", "events", "relationships", "observations", "documents", "notes"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const queryWorldState = async (query: string, currentModel: WorldModel): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelContext = JSON.stringify(currentModel, null, 2);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Based on the following world model, answer this query: "${query}"\n\nModel State:\n${modelContext}`,
    config: {
      systemInstruction: "You are an analyst querying an operational world model. Provide evidence-based answers only using the model's objects and provenance.",
    }
  });

  return response.text;
};
