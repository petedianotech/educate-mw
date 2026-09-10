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
    id: "vid-bio-photosynthesis",
    title: "MSCE Biology: Photosynthesis & Light Reactions",
    url: "https://www.youtube.com/watch?v=sQK3Yr4Sc_k",
    desc: "Visual animated guide detailing chloroplast anatomy, the light-dependent stage, and the Calvin cycle in plant leaves.",
    subject: "Biology",
    level: "Form 3 & 4",
    duration: "12 mins",
    createdAt: { toDate: () => new Date("2026-02-14") }
  },
  {
    id: "vid-math-quadratic",
    title: "Mathematics: Solving Quadratic Equations Step-by-Step",
    url: "https://www.youtube.com/watch?v=ZBalWWHY4Go",
    desc: "Clear visual walkthrough of the quadratic formula, completing the square, and factorisation methods for exams.",
    subject: "Mathematics",
    level: "Form 3 & 4",
    duration: "15 mins",
    createdAt: { toDate: () => new Date("2026-02-12") }
  },
  {
    id: "vid-phys-ohms-law",
    title: "Physics: Ohm's Law, Voltage & Current",
    url: "https://www.youtube.com/watch?v=HsLLq6Rm5qc",
    desc: "Understanding electric circuits, resistance calculations, series vs parallel connections, and MANEB practical experiments.",
    subject: "Physics",
    level: "Form 3 & 4",
    duration: "14 mins",
    createdAt: { toDate: () => new Date("2026-02-08") }
  },
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
    id: "vid-eng-essay-writing",
    title: "English: Essay Writing Masterclass & Sentence Variety",
    url: "https://www.youtube.com/watch?v=inY-bLkQWBs",
    desc: "How to structure narrative and argumentative essays with strong topic sentences, transitions, and conclusion hooks.",
    subject: "English",
    level: "All Levels",
    duration: "10 mins",
    createdAt: { toDate: () => new Date("2026-01-25") }
  }
];
