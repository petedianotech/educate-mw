export interface VideoItem {
  id: string;
  title: string;
  url: string;
  desc?: string;
  subject?: string;
  level?: string;
  duration?: string;
  createdAt?: any;
}

export const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: "vid-chem-periodic-table",
    title: "Chemistry: Periodic Trends & Electronic Configuration",
    url: "https://www.youtube.com/watch?v=0RRVV4Diomg",
    desc: "Explore atomic radius, ionization energy, electronegativity, and valence electrons across periods and groups.",
    subject: "Chemistry",
    level: "Form 2, 3 & 4",
    duration: "11 mins",
    createdAt: { toDate: () => new Date("2026-02-01") }
  },
  {
    id: "vid-bio-photosynthesis-anim",
    title: "Explanation of the process of photosynthesis in an animated video",
    url: "https://www.youtube.com/watch?v=D1Ymc311XS8",
    desc: "Animated visual explanation detailing light reactions, Calvin cycle, chloroplast function, and chemical equation of photosynthesis.",
    subject: "Biology",
    level: "Form 3 & 4",
    duration: "10 mins",
    createdAt: { toDate: () => new Date("2026-02-10") }
  },
  {
    id: "vid-bio-photosynthesis",
    title: "MSCE Biology: Photosynthesis & Light Reactions",
    url: "https://www.youtube.com/watch?v=sQK3Yr4Sc_k",
    desc: "Visual animated guide detailing chloroplast anatomy, the light-dependent stage, and the Calvin cycle in plant leaves.",
    subject: "Biology",
    level: "Form 3 & 4",
    duration: "12 mins",
    createdAt: { toDate: () => new Date("2026-02-14") }
  }
];

