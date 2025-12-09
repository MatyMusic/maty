export type Track = {
  id: string; // _id מה-DB או slug
  title: string;
  artist: string;
  src: string; // audioUrl
  cover?: string; // coverUrl
  duration?: number; // בשניות (לא חובה)
  tags?: string[];
};
