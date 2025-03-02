import { Status } from "./sectionImageType";

interface Section {
  value: string;
  label: string;
  isNew?: boolean;
  status?: Status;
}

interface SectionRes {
  message: string;
  sectionList: Section[];
}

interface SectionReq {
  id: string;
}

export type { Section, SectionReq, SectionRes };

