interface SectionImage {
  name: string;
  type: string;
  lastModified: number;
  size: number;
  id: string;
  blob: string;
  path: string;
}

interface SectionImageRes {
  message: string;
  images: SectionImage[];
}
interface SectionImageReq {
  venueId: string;
  sectionName: string;
}

export type { SectionImage, SectionImageRes, SectionImageReq };
