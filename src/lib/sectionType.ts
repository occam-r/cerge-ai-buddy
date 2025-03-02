import { ProcessMap } from "./AppType";

interface Section {
  value: string;
  label: string;
  isNew?: boolean;
  status?: ProcessMap;
}

interface SectionRes {
  message: string;
  sectionList: Section[];
}

interface SectionReq {
  id: string;
}

export type { Section, SectionReq, SectionRes };
