interface Venue {
  value: string;
  label: string;
  isNew?: boolean;
  isOnline?: boolean;
}

interface VenuesRes {
  message: string;
  venues: Venue[];
}

export type { Venue, VenuesRes };
