export interface MaterialItem {
  id: string;
  title: string;
  type: "pdf" | "video" | "text" | "book" | "doc";
  subject: string;
  level: string;
  excerpt?: string;
  content?: string;
  slug?: string;
  createdAt?: any;
}

export const DEFAULT_MATERIALS: MaterialItem[] = [
  {
    id: "mat-bio-f4-genetics",
    slug: "msce-biology-genetics-heredity",
    title: "MSCE Biology: Genetics, Heredity & Variation",
    type: "doc",
    subject: "Biology",
    level: "Form 4",
    excerpt: "Comprehensive study notes covering Mendelian inheritance, monohybrid crosses, sex linkage, and genetic mutations for MSCE exams.",
    content: `# MSCE Biology: Genetics & Heredity\n\n## 1. Introduction to Genetics\nGenetics is the scientific study of heredity and the variation of inherited characteristics in living organisms.\n\n### Key Terms:\n- **Gene**: A segment of DNA that codes for a specific protein or characteristic.\n- **Allele**: An alternative form of a gene (e.g., T for tall, t for dwarf).\n- **Genotype**: The genetic constitution of an organism (e.g., TT, Tt, tt).\n- **Phenotype**: The observable physical characteristics of an organism resulting from its genotype.\n- **Dominant**: An allele that expresses itself in both homozygous and heterozygous conditions.\n- **Recessive**: An allele that only expresses itself in the homozygous condition.\n\n## 2. Mendelian Inheritance & Monohybrid Crosses\nGregor Mendel demonstrated that traits are inherited according to specific numerical ratios.\n\n### Example Cross: Plant Height (Tall vs Dwarf)\n- Parents: Pure-breeding Tall (TT) x Pure-breeding Dwarf (tt)\n- Gametes: T and t\n- F1 Generation: All Tt (100% Phenotypically Tall)\n- F1 Self-Cross: Tt x Tt\n- F2 Phenotypic Ratio: 3 Tall : 1 Dwarf\n- F2 Genotypic Ratio: 1 TT : 2 Tt : 1 tt\n\n## 3. Sex Determination in Humans\nHumans have 23 pairs of chromosomes. Pair 23 represents the sex chromosomes:\n- Female: XX\n- Male: XY\nDuring fertilization, there is always a 50% probability (1:1 ratio) of conceiving a male or female child.\n\n## 4. Summary & Examination Tips\nWhen drawing genetic diagrams in MANEB MSCE exams, always include:\n1. Parental phenotypes & genotypes\n2. Gametes circled clearly\n3. Punnett square or cross lines\n4. Offspring genotypes & phenotypes with clear ratios`,
    createdAt: { toDate: () => new Date("2026-02-15") }
  },
  {
    id: "mat-math-f4-quadratics",
    slug: "msce-mathematics-quadratic-functions",
    title: "MSCE Mathematics: Quadratic Equations & Parabolas",
    type: "doc",
    subject: "Mathematics",
    level: "Form 4",
    excerpt: "Master factorisation, completing the square, the quadratic formula, and graphing parabolic turning points.",
    content: `# MSCE Mathematics: Quadratic Equations\n\n## 1. General Quadratic Equation Form\nA quadratic equation is written in the form:  \n$$ax^2 + bx + c = 0$$  \nwhere $a \\neq 0$.\n\n## 2. Methods of Solving Quadratic Equations\n\n### Method 1: Factorisation\nUsed when the quadratic expression can be factored into linear binomials.\n- Example: $x^2 - 5x + 6 = 0$\n- Find factors of $+6$ that sum to $-5$: $(-2, -3)$\n- $(x - 2)(x - 3) = 0 \\implies x = 2 \\text{ or } x = 3$\n\n### Method 2: The Quadratic Formula\nAlways valid for any quadratic equation:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n### Method 3: Completing the Square\n1. Divide throughout by $a$ if $a \\neq 1$\n2. Shift constant $c$ to the right-hand side\n3. Add $(b/2)^2$ to both sides\n4. Take square roots on both sides\n\n## 3. The Nature of Roots (Discriminant $\\Delta = b^2 - 4ac$)\n- $\\Delta > 0$: Two distinct real roots\n- $\\Delta = 0$: Two equal real roots (one repeated root)\n- $\\Delta < 0$: No real roots (complex roots)`,
    createdAt: { toDate: () => new Date("2026-02-10") }
  },
  {
    id: "mat-ps-f3-acids-bases",
    slug: "chemistry-acids-bases-salts",
    title: "Chemistry: Acids, Bases & Salts Preparation",
    type: "doc",
    subject: "Chemistry",
    level: "Form 3",
    excerpt: "Detailed notes on pH scale, neutralization reactions, indicators, and standard laboratory salt preparation techniques.",
    content: `# Chemistry: Acids, Bases & Salts\n\n## 1. Properties of Acids\n- Produce Hydrogen ions ($H^+$) in aqueous solution\n- pH value less than 7\n- Turn blue litmus paper red\n- Taste sour and conduct electricity\n\n### Common Reactions of Acids:\n1. $\\text{Acid} + \\text{Metal} \\rightarrow \\text{Salt} + \\text{Hydrogen gas}$\n2. $\\text{Acid} + \\text{Base/Alkali} \\rightarrow \\text{Salt} + \\text{Water (Neutralisation)}$\n3. $\\text{Acid} + \\text{Carbonate} \\rightarrow \\text{Salt} + \\text{Water} + \\text{Carbon dioxide}$\n\n## 2. Properties of Bases & Alkalis\n- Produce Hydroxide ions ($OH^-$) in aqueous solution\n- pH value greater than 7\n- Turn red litmus paper blue\n- Slippery to touch\n\n## 3. Salt Preparation Methods\n- **Method A: Action of acid on an insoluble base or metal** (e.g. Copper(II) sulphate from CuO and $H_2SO_4$)\n- **Method B: Titration** (for soluble salts using an alkali and acid with indicator)\n- **Method C: Precipitation** (for insoluble salts mixing two soluble solutions)`,
    createdAt: { toDate: () => new Date("2026-02-05") }
  },
  {
    id: "mat-eng-f4-essay-writing",
    slug: "msce-english-composition-essay-writing",
    title: "MSCE English: Creative & Discursive Essay Guide",
    type: "book",
    subject: "English",
    level: "Form 4",
    excerpt: "Standard MANEB English Paper 1 formats, narrative hooks, argumentation frameworks, and formal registers.",
    content: `# MSCE English: Formal Composition & Essay Writing\n\n## 1. Types of Essays in MSCE Paper 1\n1. **Narrative & Descriptive**: Telling an engaging story with rich sensory details, tension, climax, and resolution.\n2. **Discursive & Argumentative**: Presenting balanced viewpoints on socio-economic or educational issues with logical evidence.\n3. **Expository**: Explaining a process or factual event clearly and objectively.\n\n## 2. Structure of a High-Scoring Essay\n- **Title**: Centered, clear, and relevant\n- **Introduction (1 Paragraph)**: Attention-grabbing hook + background orientation + clear thesis statement\n- **Body Paragraphs (3 to 4 Paragraphs)**: Each paragraph must focus on ONE main idea (PEEL framework: Point, Evidence/Explanation, Example, Link)\n- **Conclusion (1 Paragraph)**: Synthesis of main points and powerful concluding observation\n\n## 3. Essential Stylistic Devices\n- Varied sentence lengths (simple, compound, and complex sentences)\n- Rhetorical devices (contrast, parallelism, metaphor)\n- Precise academic vocabulary (avoid vague words like 'things', 'good', 'nice')`,
    createdAt: { toDate: () => new Date("2026-01-28") }
  },
  {
    id: "mat-agri-f3-soil-fertility",
    slug: "agriculture-soil-fertility-maneb",
    title: "Agriculture: Soil Fertility & Plant Nutrition",
    type: "doc",
    subject: "Agriculture",
    level: "Form 3",
    excerpt: "Macro and micro nutrients, organic manures, chemical fertilizer calculations, and soil conservation methods.",
    content: `# Agriculture: Soil Fertility & Plant Nutrition\n\n## 1. Essential Plant Nutrients\nPlants require essential elements divided into Macronutrients and Micronutrients.\n\n### Primary Macronutrients:\n- **Nitrogen (N)**: Promotes vigorous vegetative growth and chlorophyll synthesis.\n- **Phosphorus (P)**: Essential for strong root development and flower/seed formation.\n- **Potassium (K)**: Regulates water balance, enzyme activation, and disease resistance.\n\n## 2. Inorganic Fertilizers in Malawi\n- **Basal Dressing**: Applied during planting (e.g., 23:21:0 + 4S or NPK)\n- **Top Dressing**: Applied when crop is established (e.g., Urea - 46% N, or CAN - 27% N)\n\n## 3. Organic Manures\n- Farmyard Manure (FYM)\n- Compost Manure\n- Green Manure`,
    createdAt: { toDate: () => new Date("2026-01-20") }
  },
  {
    id: "mat-geo-f3-weather-climate",
    slug: "geography-weather-climatology-malawi",
    title: "Geography: Weather, Climate & ITCZ in Malawi",
    type: "doc",
    subject: "Geography",
    level: "Form 3",
    excerpt: "Factors influencing climate in Malawi, the Inter-Tropical Convergence Zone (ITCZ), precipitation types, and weather stations.",
    content: `# Geography: Weather & Climate in Malawi\n\n## 1. Distinction Between Weather & Climate\n- **Weather**: The atmospheric condition of a specific place over a short period of time (hours to days).\n- **Climate**: The average weather condition of an extensive area recorded over a prolonged duration (usually 30-35 years).\n\n## 2. Factors Influencing Climate in Malawi\n1. **Altitude & Relief**: Mountainous regions (Mulanje, Nyika, Zomba Plateau) experience cooler temperatures and higher relief rainfall.\n2. **Proximity to Lake Malawi**: Lake breezes moderate coastal temperatures and influence localized convective rainfall.\n3. **Inter-Tropical Convergence Zone (ITCZ)**: The low-pressure belt where North-East and South-East trade winds converge, bringing Malawi's summer rainy season (November to April).\n4. **Air Masses**: Influence of the Congo Air Mass and South-East Trade Winds (Chiperoni).`,
    createdAt: { toDate: () => new Date("2026-01-15") }
  },
  {
    id: "mat-hist-f2-maravi-kingdom",
    slug: "history-maravi-kingdom-central-africa",
    title: "History: The Rise & Organization of the Maravi Kingdom",
    type: "doc",
    subject: "History",
    level: "Form 2",
    excerpt: "Origins of the Phiri clan, political centralization under Kalonga, trade routes, and social organization.",
    content: `# History: The Rise & Organization of the Maravi Kingdom\n\n## 1. Origins & Migration\nThe Maravi people migrated from the Luba-Lunda kingdom (present-day DR Congo) around the 14th to 15th century under the leadership of the Phiri clan.\n\n## 2. Political Structure\n- **The Kalonga**: Supreme paramount ruler stationed at Manthimba.\n- **Undi**: Second in command, who later migrated west into Mozambique and Zambia establishing his own kingdom.\n- **Banda Clan**: Held religious authority and priesthood (e.g. Makewana shrine at Msinja).\n\n## 3. Factors Leading to the Rise\n1. Strong, centralized military organization under Kalonga\n2. Control of ivory and gold trade with Portuguese and Arab-Swahili traders along the Shire Valley and Indian Ocean coast\n3. Spiritual authority through rain-making shrines`,
    createdAt: { toDate: () => new Date("2026-01-10") }
  },
  {
    id: "mat-soc-f1-democracy-governance",
    slug: "social-studies-democracy-human-rights",
    title: "Social Studies: Democracy, Governance & Citizen Rights",
    type: "doc",
    subject: "Social Studies",
    level: "Form 1",
    excerpt: "Principles of good governance, the three arms of government in Malawi, and constitutional human rights.",
    content: `# Social Studies: Democracy & Human Rights\n\n## 1. Principles of Democracy\nDemocracy is government of the people, by the people, and for the people.\n\n### Core Pillars:\n- Popular participation through free and fair elections\n- Rule of law and equality before the justice system\n- Transparency and accountability of public officials\n- Protection of fundamental human rights\n\n## 2. The Three Arms of Government in Malawi\n1. **The Executive**: The President, Cabinet, and Civil Service (enforces laws).\n2. **The Legislature**: Parliament (National Assembly) comprising Members of Parliament (makes laws).\n3. **The Judiciary**: High Court, Supreme Court of Appeal, and Magistrates (interprets laws and administers justice).`,
    createdAt: { toDate: () => new Date("2026-01-05") }
  }
];
