import { Status } from "./sectionImageType";

interface Venue {
  value: string;
  label: string;
  isNew?: boolean;
  status?: Status;
}

interface VenuesRes {
  message: string;
  venues: Venue[];
}

export type { Venue, VenuesRes };
