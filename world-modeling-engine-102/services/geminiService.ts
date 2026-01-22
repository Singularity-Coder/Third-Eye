
import { GoogleGenAI, Type } from "@google/genai";
import { WorldModel, PivotEvent } from "../types";

// Note: Gemini services are currently inactive in Dummy Mode.

export const extractWorldModel = async (rawData: string): Promise<WorldModel> => {
  // Mock response for dummy mode
  return {
    entities: [],
    events: [],
    relationships: [],
    observations: [],
    documents: [],
    notes: { assumptions: [], ambiguities: [], unmodeled_fields: [] }
  };
};

export const synthesizeWorldModel = async (currentModel: WorldModel): Promise<WorldModel> => {
  return currentModel;
};

export const queryWorldState = async (query: string, currentModel: WorldModel): Promise<string> => {
  return "Query engine offline in dummy mode.";
};

export const generatePivotEvents = async (model: WorldModel): Promise<PivotEvent[]> => {
  return [];
};

export const projectBranch = async (model: WorldModel, selectedPivots: PivotEvent[]): Promise<WorldModel> => {
  return {
    entities: [],
    events: [],
    relationships: [],
    observations: [],
    documents: [],
    notes: { assumptions: [], ambiguities: [], unmodeled_fields: [] }
  };
};
