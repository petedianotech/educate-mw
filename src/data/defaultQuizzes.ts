export interface PredefinedQuiz {
  id: string;
  topic: string;
  category: string;
  level?: string;
  questions: {
    q: string;
    options: string[];
    answer: string;
    summary: string;
  }[];
  createdAt?: any;
}

export const DEFAULT_QUIZZES: PredefinedQuiz[] = [
  {
    id: "quiz-math-fundamentals",
    topic: "Mathematics: Algebra & Equations",
    category: "Mathematics",
    level: "Form 1-4",
    questions: [
      {
        q: "What is the value of x if 5x + 2 = 17?",
        options: ["x = 2", "x = 3", "x = 4", "x = 5"],
        answer: "x = 3",
        summary: "Subtracting 2 from 17 gives 15. Then dividing 15 by 5 gives x = 3."
      },
      {
        q: "What is the formula for the Area of a circle?",
        options: ["πr²", "2πr", "π²r", "4πr²"],
        answer: "πr²",
        summary: "The area of a circle with radius r is calculated as A = πr²."
      },
      {
        q: "What is 15% of 200?",
        options: ["15", "20", "30", "45"],
        answer: "30",
        summary: "15% of 200 is calculated as (15 / 100) * 200 = 30."
      },
      {
        q: "If y = 2x - 4, what is the value of y when x = 5?",
        options: ["4", "6", "8", "10"],
        answer: "6",
        summary: "Substitute x = 5: y = 2(5) - 4 = 10 - 4 = 6."
      },
      {
        q: "What is the square root of 144?",
        options: ["11", "12", "13", "14"],
        answer: "12",
        summary: "12 * 12 = 144, so the square root of 144 is 12."
      }
    ]
  },
  {
    id: "quiz-bio-genetics",
    topic: "Biology: Genetics & Cells",
    category: "Biology",
    level: "Form 3 & 4",
    questions: [
      {
        q: "Which organelle is known as the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondrion", "Ribosome", "Chloroplast"],
        answer: "Mitochondrion",
        summary: "Mitochondria generate most of the chemical energy (ATP) needed to power the cell's biochemical reactions."
      },
      {
        q: "What is the expected phenotypic ratio in a standard Mendelian monohybrid F2 generation?",
        options: ["1:1", "3:1", "9:3:3:1", "1:2:1"],
        answer: "3:1",
        summary: "When heterozygous F1 plants (Tt x Tt) cross, the phenotypic ratio is 3 dominant (Tall) to 1 recessive (Dwarf)."
      },
      {
        q: "What gas is released as a byproduct of photosynthesis?",
        options: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Methane"],
        answer: "Oxygen",
        summary: "During the light reactions of photosynthesis, water molecules are photolyzed, releasing Oxygen gas."
      },
      {
        q: "How many pairs of chromosomes are found in normal human somatic cells?",
        options: ["21 pairs", "22 pairs", "23 pairs", "46 pairs"],
        answer: "23 pairs",
        summary: "Humans have 23 pairs (46 total) chromosomes in somatic cells, including 22 pairs of autosomes and 1 pair of sex chromosomes."
      },
      {
        q: "Which blood group is considered the universal recipient in humans?",
        options: ["Group O", "Group A", "Group B", "Group AB"],
        answer: "Group AB",
        summary: "Individuals with blood group AB possess both A and B antigens and have no anti-A or anti-B antibodies, allowing them to receive blood from any group."
      }
    ]
  },
  {
    id: "quiz-ps-forces-motion",
    topic: "Physics: Forces & Mechanics",
    category: "Physics",
    level: "Form 2, 3 & 4",
    questions: [
      {
        q: "According to Newton's Second Law of Motion, Force equals:",
        options: ["Mass / Acceleration", "Mass * Acceleration", "Mass * Velocity", "Work / Time"],
        answer: "Mass * Acceleration",
        summary: "Newton's second law states that Force is the product of mass and acceleration (F = ma)."
      },
      {
        q: "What is the SI unit of Electric Current?",
        options: ["Volt (V)", "Ohm (Ω)", "Ampere (A)", "Watt (W)"],
        answer: "Ampere (A)",
        summary: "The SI unit of electric current is the Ampere (A), named after André-Marie Ampère."
      },
      {
        q: "What is the acceleration due to gravity on Earth's surface approximately?",
        options: ["9.8 m/s²", "15.2 m/s²", "5.4 m/s²", "1.6 m/s²"],
        answer: "9.8 m/s²",
        summary: "Standard gravitational acceleration on Earth's surface is approximately 9.8 m/s² (or 10 m/s² in basic calculations)."
      },
      {
        q: "Which of the following is a renewable energy source?",
        options: ["Coal", "Petroleum", "Solar Radiation", "Natural Gas"],
        answer: "Solar Radiation",
        summary: "Solar energy is naturally replenished on a human timescale, unlike fossil fuels."
      }
    ]
  },
  {
    id: "quiz-eng-grammar-idioms",
    topic: "English: Grammar, Idioms & Figures of Speech",
    category: "English",
    level: "Form 1-4",
    questions: [
      {
        q: "Identify the figure of speech in: 'The wind whispered through the dark trees.'",
        options: ["Metaphor", "Simile", "Personification", "Hyperbole"],
        answer: "Personification",
        summary: "Personification gives human qualities (whispering) to non-human entities (the wind)."
      },
      {
        q: "Which sentence is grammatically correct?",
        options: [
          "Neither of the boys were present.",
          "Neither of the boys was present.",
          "Neither of the boys are present.",
          "Neither of the boy was present."
        ],
        answer: "Neither of the boys was present.",
        summary: "'Neither' is a singular indefinite pronoun and takes the singular verb 'was'."
      },
      {
        q: "What is the antonym of the word 'BENEVOLENT'?",
        options: ["Kind", "Malevolent", "Generous", "Helpful"],
        answer: "Malevolent",
        summary: "'Benevolent' means well-meaning and kindly; 'Malevolent' means wishing evil or harm to others."
      }
    ]
  }
];
