import { Timestamp } from "firebase/firestore";

export type SourceType = "text" | "image";
export type PatternStatus = "generating" | "complete" | "error";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type YarnWeight =
  | "lace"
  | "fingering"
  | "sport"
  | "dk"
  | "worsted"
  | "bulky"
  | "super-bulky";

export interface PatternRow {
  rowNumber: number | null;
  label: string;
  instruction: string;
  stitchCount: number | null;
}

export interface PatternSection {
  sectionName: string;
  instructions: PatternRow[];
  notes: string | null;
}

export interface PatternData {
  gauge: string;
  yarnWeight: string;
  hookSize: string;
  yarn: string;
  notions: string[];
  abbreviations: Record<string, string>;
  difficultyLevel: DifficultyLevel;
  estimatedTime: string;
  finalDimensions: string;
  sections: PatternSection[];
  notes: string[];
  rawMarkdown: string;
}

export interface Pattern {
  id: string;
  uid: string;
  title: string;
  description: string;
  sourceType: SourceType;
  sourceImageUrl: string | null;
  status: PatternStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isSaved: boolean;
  isPublic: boolean;
  pattern: PatternData | null;
}

export interface PatternSummary {
  id: string;
  uid: string;
  title: string;
  description: string;
  sourceType: SourceType;
  sourceImageUrl: string | null;
  status: PatternStatus;
  createdAt: Timestamp;
  isSaved: boolean;
  difficultyLevel: DifficultyLevel | null;
  estimatedTime: string | null;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface GenerateRequest {
  description: string;
  skillLevel?: SkillLevel;
  yarnWeight?: YarnWeight;
  image?: {
    base64: string;
    mediaType: "image/jpeg" | "image/png" | "image/webp";
  };
  patternId?: string;
}
