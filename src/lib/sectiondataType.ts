interface SensoryDetail {
  value: string;
}

type SensoryType = "sounds" | "smells" | "feels" | "sights";

type Sensory = {
  [K in SensoryType]: SensoryDetail[];
};
interface Area extends Sensory {
  sectionName?: string;
  shadowCorrections?: boolean[];
  heroImages?: boolean[];
  sectionFolderId?: string;
  sectionId?: string;
  description?: string;
  promptInput?: string;
}
interface SectionData {
  areas: Area[];
  venueName: string;
}

interface SectionDataRes {
  message: string;
  formData: string;
}

interface SectionDataReq {
  venueId: string;
  sectionName: string;
}

export type {
  Area,
  SectionData,
  SectionDataReq,
  SectionDataRes,
  Sensory,
  SensoryDetail,
  SensoryType,
};
