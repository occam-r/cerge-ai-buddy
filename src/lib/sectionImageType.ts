import { SectionData } from "./sectionDataType";

type Status = "uploading" | "failed" | "pending" | "success";

interface SectionImage {
  name: string;
  type: string;
  lastModified: number;
  size: number;
  id: string;
  blob: string;
  path: string;
  status?: Status;
}

interface SectionImageRes {
  message: string;
  images: SectionImage[];
}
interface SectionImageReq {
  venueId: string;
  sectionName: string;
}

interface UploadImageRes {
  sectionFolderId: string;
  message: string;
}

type ImageUploadType = {
  uri: string;
  name: string;
  type: string;
};

interface UploadImageReq {
  image: ImageUploadType;
  venueName: string;
  sectionName: string;
  completedForm: SectionData;
}

export type {
  ImageUploadType,
  SectionImage,
  SectionImageReq,
  SectionImageRes,
  Status,
  UploadImageReq,
  UploadImageRes,
};
