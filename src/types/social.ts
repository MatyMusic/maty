export type UserLite = {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  lat?: number;
  lng?: number;
  sports?: string[]; // ["ריצה","משקולות"]
  bio?: string;
  isOnline?: boolean;
};

export type NearbySuggestion = {
  user: UserLite;
  distanceKm: number;
  placeHint?: string; // "פארק הירקון", "גן סאקר", וכו'
};

export type GroupLite = {
  id: string;
  name: string;
  city?: string;
  sport?: string;
  membersCount: number;
  adminId: string;
  approved?: boolean; // לאישור אדמין
};
