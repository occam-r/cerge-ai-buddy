interface Section {
  value: string;
  label: string;
  isNew?: boolean;
  isOnline?: boolean;
}

interface SectionRes {
  message: string;
  sectionList: Section[];
}

interface SectionReq {
  id: string;
}

export type { Section, SectionRes, SectionReq };
