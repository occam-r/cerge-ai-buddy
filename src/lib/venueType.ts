import { ProcessMap } from "./AppType";

interface Venue {
  value: string;
  label: string;
  isNew?: boolean;
  status?: ProcessMap;
}

interface VenuesRes {
  message: string;
  venues: Venue[];
}

export type { Venue, VenuesRes };
