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
  userPrompt: string;
}

export type { Content, ContentReq, ContentRes };
