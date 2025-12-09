// src/lib/fit/heroImages.ts
export const HEROES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?q=80&w=1600&auto=format&fit=crop",
] as const;

export const heroSrc = (i = 0) => HEROES[i % HEROES.length];
