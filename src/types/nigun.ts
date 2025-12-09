// src/types/nigun.ts
export type Nigun = {
  title: string;
  category?: string;
  tags?: string[];
  audioUrl?: string;
  lyrics?: string;
  composer?: string;
  source?: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
