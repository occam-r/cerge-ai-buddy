import { Area, SectionData } from "./sectionDataType";
import { SectionImage } from "./sectionImageType";

interface Content {
  description: string;
  feels: string[];
  sights: string[];
  smells: string[];
  sounds: string[];
}

interface ContentRes {
  description: string;
}

interface ContentReq {
  files: SectionImage[];
  userPrompt?: string;
}

interface SaveContentReq {
  venueName: string;
  sectionName: string;
  promptInput: string;
  sensoryData: string | Area;
  completedForm: string | SectionData;
}
interface SaveContentRes {
  message: string;
  openAIResponses?: any;
}

export type { Content, ContentReq, ContentRes, SaveContentReq, SaveContentRes };
