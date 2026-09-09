export interface SyllabusTopic {
  id: string;
  form: 1 | 2 | 3 | 4;
  term: 1 | 2 | 3;
  subject: string;
  unit: string;
  title: string;
  objectives: string[];
  keyConcepts: string[];
  manebFrequency: 'High' | 'Medium' | 'Essential';
}

export interface SubjectMeta {
  id: string;
  name: string;
  iconName: string;
  color: string;
  accentBg: string;
  description: string;
}

export const SUBJECTS_META: SubjectMeta[] = [
  {
    id: 'mathematics',
    name: 'Mathematics',
    iconName: 'Calculator',
    color: 'text-blue-500',
    accentBg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    description: 'Algebra, Geometry, Trigonometry, Statistics & Calculus'
  },
  {
    id: 'biology',
    name: 'Biology',
    iconName: 'Dna',
    color: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    description: 'Cell Biology, Genetics, Ecology, Anatomy & Physiology'
  },
  {
    id: 'physical_science',
    name: 'Physical Science',
    iconName: 'Atom',
    color: 'text-indigo-500',
    accentBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
    description: 'Physics & Chemistry fundamentals, Organic Chem & Mechanics'
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    iconName: 'Sprout',
    color: 'text-green-600',
    accentBg: 'bg-green-600/10 border-green-600/20 text-green-600',
    description: 'Crop Science, Soil Conservation, Animal Husbandry & Agribusiness'
  },
  {
    id: 'english',
    name: 'English',
    iconName: 'BookOpen',
    color: 'text-purple-500',
    accentBg: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
    description: 'Grammar, Formal Letters, Report Writing, Literature & Summaries'
  },
  {
    id: 'chichewa',
    name: 'Chichewa',
    iconName: 'Feather',
    color: 'text-amber-500',
    accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    description: 'Malamulo a chilankhulo, Nthondo, Chamdothe ndi Ndakatulo'
  },
  {
    id: 'geography',
    name: 'Geography',
    iconName: 'Globe',
    color: 'text-cyan-500',
    accentBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500',
    description: 'Map Work, Climatology, Environmental Studies & Population'
  },
  {
    id: 'history',
    name: 'History',
    iconName: 'Landmark',
    color: 'text-rose-500',
    accentBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
    description: 'Pre-Colonial Malawi, Nyasaland Protectorate & World History'
  },
  {
    id: 'social_studies',
    name: 'Social Studies',
    iconName: 'Users',
    color: 'text-orange-500',
    accentBg: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
    description: 'Civics, Human Rights, Democracy & Community Development'
  },
  {
    id: 'computer_studies',
    name: 'Computer Studies',
    iconName: 'Laptop',
    color: 'text-teal-500',
    accentBg: 'bg-teal-500/10 border-teal-500/20 text-teal-500',
    description: 'Computer Systems, Software, Networking & Cyber Safety'
  }
];

export const SYLLABUS_TOPICS: SyllabusTopic[] = [
  // --- MATHEMATICS ---
  {
    id: 'math-f1-01',
    form: 1,
    term: 1,
    subject: 'mathematics',
    unit: 'Unit 1: Numbers & Operations',
    title: 'Integers, Prime Factorization & Indices',
    objectives: [
      'Find HCF and LCM of algebraic terms and numbers',
      'Apply standard index laws to simplify exponential expressions',
      'Perform directed number calculations with negative integers'
    ],
    keyConcepts: ['Prime Factor Trees', 'Index Laws', 'BODMAS with Negatives'],
    manebFrequency: 'Essential'
  },
  {
    id: 'math-f1-02',
    form: 1,
    term: 2,
    subject: 'mathematics',
    unit: 'Unit 2: Basic Algebra',
    title: 'Linear Equations & Algebraic Expansion',
    objectives: [
      'Expand and factorize simple algebraic expressions',
      'Solve linear equations with one unknown and fractional coefficients',
      'Translate word problems into linear algebraic equations'
    ],
    keyConcepts: ['Expansion of Brackets', 'Common Factors', 'Balancing Equations'],
    manebFrequency: 'Essential'
  },
  {
    id: 'math-f2-01',
    form: 2,
    term: 1,
    subject: 'mathematics',
    unit: 'Unit 3: Plane Geometry',
    title: 'Angles, Triangles & Polygons (JCE Focus)',
    objectives: [
      'Calculate interior and exterior angles of regular polygons',
      'Apply Pythagoras theorem to right-angled triangles',
      'Solve geometric proof problems using congruent triangle tests'
    ],
    keyConcepts: ['(n-2)×180° Formula', 'Pythagorean Triples', 'Congruence (SSS, SAS, RHS)'],
    manebFrequency: 'High'
  },
  {
    id: 'math-f2-02',
    form: 2,
    term: 2,
    subject: 'mathematics',
    unit: 'Unit 4: Simultaneous Equations',
    title: 'Simultaneous Linear Equations & Graphs',
    objectives: [
      'Solve simultaneous linear equations using elimination and substitution',
      'Find points of intersection graphically',
      'Model two-variable practical scenarios'
    ],
    keyConcepts: ['Elimination Method', 'Substitution Method', 'Cartesian Intersection'],
    manebFrequency: 'High'
  },
  {
    id: 'math-f3-01',
    form: 3,
    term: 1,
    subject: 'mathematics',
    unit: 'Unit 5: Quadratic Equations',
    title: 'Quadratic Factorization & The Quadratic Formula',
    objectives: [
      'Solve quadratic equations by factoring, completing the square, and quadratic formula',
      'Form quadratic equations from given roots',
      'Interpret quadratic graph parabolas, vertices, and intercepts'
    ],
    keyConcepts: ['x = (-b ± √(b² - 4ac)) / 2a', 'Completing the Square', 'Axis of Symmetry'],
    manebFrequency: 'High'
  },
  {
    id: 'math-f3-02',
    form: 3,
    term: 2,
    subject: 'mathematics',
    unit: 'Unit 6: Trigonometry',
    title: 'Trigonometric Ratios & Sine/Cosine Rules',
    objectives: [
      'Use Sine, Cosine, and Tangent to calculate unknown sides and angles in right triangles',
      'Apply the Sine Rule and Cosine Rule for non-right angled triangles',
      'Calculate angles of elevation, depression, and three-figure bearings'
    ],
    keyConcepts: ['SOH CAH TOA', 'Sine Rule: a/sinA = b/sinB', 'Cosine Rule: a² = b² + c² - 2bc cosA'],
    manebFrequency: 'High'
  },
  {
    id: 'math-f4-01',
    form: 4,
    term: 1,
    subject: 'mathematics',
    unit: 'Unit 7: Circle Theorems',
    title: 'Circle Geometry & Tangents (MSCE Core)',
    objectives: [
      'Prove and apply the angle at the centre is twice the angle at the circumference',
      'Apply cyclic quadrilateral properties and alternate segment theorem',
      'Calculate lengths of tangents and chords'
    ],
    keyConcepts: ['Angle in Semicircle = 90°', 'Opposite Angles of Cyclic Quad = 180°', 'Alternate Segment Theorem'],
    manebFrequency: 'High'
  },
  {
    id: 'math-f4-02',
    form: 4,
    term: 2,
    subject: 'mathematics',
    unit: 'Unit 8: Statistics & Probability',
    title: 'Cumulative Frequency, Standard Deviation & Probability Trees',
    objectives: [
      'Construct and interpret cumulative frequency curves (Ogive) to estimate median and quartiles',
      'Calculate mean and standard deviation for grouped frequency distributions',
      'Determine combined probabilities using tree diagrams and Venn diagrams'
    ],
    keyConcepts: ['Ogive & Quartiles', 'Standard Deviation (σ)', 'Independent vs Mutually Exclusive Events'],
    manebFrequency: 'High'
  },

  // --- BIOLOGY ---
  {
    id: 'bio-f1-01',
    form: 1,
    term: 1,
    subject: 'biology',
    unit: 'Unit 1: Cell Biology',
    title: 'Cell Structure, Organization & Microscopy',
    objectives: [
      'Identify and describe the functions of plant and animal cell organelles',
      'Explain cellular specialization and tissue organization',
      'Calculate magnification and specimen size under a light microscope'
    ],
    keyConcepts: ['Nucleus, Mitochondria, Chloroplasts', 'Cell Wall vs Cell Membrane', 'Magnification = Image / Actual'],
    manebFrequency: 'Essential'
  },
  {
    id: 'bio-f2-01',
    form: 2,
    term: 1,
    subject: 'biology',
    unit: 'Unit 2: Transport Systems',
    title: 'Osmosis, Diffusion & Transport in Plants & Animals',
    objectives: [
      'Explain mechanism of osmosis, diffusion, and active transport',
      'Describe water and mineral uptake through xylem and phloem translocation',
      'Outline the human circulatory system, double circulation, and blood composition'
    ],
    keyConcepts: ['Water Potential Gradient', 'Transpiration Pull', 'Structure of the Heart & Valves'],
    manebFrequency: 'High'
  },
  {
    id: 'bio-f3-01',
    form: 3,
    term: 1,
    subject: 'biology',
    unit: 'Unit 3: Respiration & Gas Exchange',
    title: 'Cellular Respiration & Respiratory Systems',
    objectives: [
      'Compare aerobic and anaerobic respiration pathways and ATP yields',
      'Describe human alveolar gaseous exchange and breathing mechanics',
      'Explain gas exchange in fish gills and insect spiracles'
    ],
    keyConcepts: ['C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP', 'Lactic Acid Fermentation', 'Alveoli Adaptations'],
    manebFrequency: 'High'
  },
  {
    id: 'bio-f3-02',
    form: 3,
    term: 2,
    subject: 'biology',
    unit: 'Unit 4: Homeostasis & Coordination',
    title: 'Kidney Function, Thermoregulation & Nervous System',
    objectives: [
      'Explain nephron filtration, selective reabsorption, and osmoregulation by ADH',
      'Outline skin thermoregulation mechanisms (vasoconstriction, sweating)',
      'Describe reflex arcs, synaptic transmission, and endocrine hormones'
    ],
    keyConcepts: ['Nephron & Bowman\'s Capsule', 'Feedback Loops', 'Insulin & Glucagon'],
    manebFrequency: 'High'
  },
  {
    id: 'bio-f4-01',
    form: 4,
    term: 1,
    subject: 'biology',
    unit: 'Unit 5: Genetics & Heredity',
    title: 'Mendelian Genetics, DNA & Genetic Inheritance (MSCE)',
    objectives: [
      'Solve monohybrid and sex-linked genetic crosses using Punnett squares',
      'Describe DNA structure, replication, and transcription basics',
      'Explain genetic mutations, continuous vs discontinuous variation, and natural selection'
    ],
    keyConcepts: ['3:1 Phenotypic Ratio', 'Sex Linkage (Hemophilia/Colorblindness)', 'Speciation & Evolution'],
    manebFrequency: 'High'
  },
  {
    id: 'bio-f4-02',
    form: 4,
    term: 2,
    subject: 'biology',
    unit: 'Unit 6: Ecology & Conservation',
    title: 'Ecosystems, Energy Flow & Biodiversity in Malawi',
    objectives: [
      'Analyze food webs, trophic levels, and ecological pyramids',
      'Describe carbon and nitrogen biogeochemical cycles',
      'Assess threats to Lake Malawi biodiversity and deforestation countermeasures'
    ],
    keyConcepts: ['10% Energy Transfer Rule', 'Nitrifying & Denitrifying Bacteria', 'Lake Malawi Endemic Cichlids'],
    manebFrequency: 'High'
  },

  // --- PHYSICAL SCIENCE ---
  {
    id: 'ps-f1-01',
    form: 1,
    term: 1,
    subject: 'physical_science',
    unit: 'Unit 1: Matter & Measurements',
    title: 'States of Matter, Density & Laboratory Apparatus',
    objectives: [
      'Explain kinetic particle theory in solids, liquids, and gases',
      'Accurately measure length, volume, and density using vernier calipers and micrometer',
      'Distinguish between physical and chemical changes'
    ],
    keyConcepts: ['Kinetic Particle Theory', 'Density = Mass / Volume', 'Vernier Calipers Reading'],
    manebFrequency: 'Essential'
  },
  {
    id: 'ps-f2-01',
    form: 2,
    term: 1,
    subject: 'physical_science',
    unit: 'Unit 2: Atomic Structure & Bonding',
    title: 'Periodic Table, Ions & Chemical Bonding (JCE Focus)',
    objectives: [
      'Determine electron configurations for the first 20 elements',
      'Explain ionic bonding via electron transfer and covalent bonding via electron sharing',
      'Balance chemical equations and deduce valency'
    ],
    keyConcepts: ['Electron Shells (2,8,8)', 'Dot-and-Cross Diagrams', 'Conservation of Mass in Equations'],
    manebFrequency: 'High'
  },
  {
    id: 'ps-f3-01',
    form: 3,
    term: 1,
    subject: 'physical_science',
    unit: 'Unit 3: Mechanics & Energy',
    title: 'Newton\'s Laws of Motion, Momentum & Work Done',
    objectives: [
      'Apply Newton\'s three laws of motion to real-life situations',
      'Calculate linear momentum, impulse, and conservation of momentum',
      'Calculate work, kinetic energy, gravitational potential energy, and power'
    ],
    keyConcepts: ['F = ma', 'Total Momentum Before = Total Momentum After', 'KE = 1/2mv², GPE = mgh'],
    manebFrequency: 'High'
  },
  {
    id: 'ps-f3-02',
    form: 3,
    term: 2,
    subject: 'physical_science',
    unit: 'Unit 4: Acids, Bases & Salts',
    title: 'pH Scale, Neutralization & Qualitative Analysis',
    objectives: [
      'Explain acid-base reactions, titration procedures, and pH indicators',
      'Outline methods of preparing soluble and insoluble salts',
      'Perform chemical qualitative tests for cations and anions'
    ],
    keyConcepts: ['Acid + Base → Salt + Water', 'Precipitation Reactions', 'Flame Tests & Cation Identification'],
    manebFrequency: 'High'
  },
  {
    id: 'ps-f4-01',
    form: 4,
    term: 1,
    subject: 'physical_science',
    unit: 'Unit 5: Electricity & Magnetism',
    title: 'Current Electricity, Ohm\'s Law & Electromagnetic Induction',
    objectives: [
      'Calculate equivalent resistance in series and parallel circuits using Ohm\'s law',
      'Explain electrical power, household circuits, and safety fuses',
      'Demonstrate Faraday\'s law of induction and step-up/step-down transformers'
    ],
    keyConcepts: ['V = IR', 'P = IV = I²R', 'Transformer Equation: Vp/Vs = Np/Ns'],
    manebFrequency: 'High'
  },
  {
    id: 'ps-f4-02',
    form: 4,
    term: 2,
    subject: 'physical_science',
    unit: 'Unit 6: Organic Chemistry',
    title: 'Hydrocarbons (Alkanes, Alkenes) & Alcohols (MSCE Core)',
    objectives: [
      'Name and draw structural isomers for alkanes, alkenes, and alcohols',
      'Compare combustion, substitution, and addition reactions of hydrocarbons',
      'Explain fractional distillation of crude oil and polymerization polymers'
    ],
    keyConcepts: ['General Formula CnH2n+2 vs CnH2n', 'Bromine Water Test for Alkenes', 'Addition Polymerization'],
    manebFrequency: 'High'
  },

  // --- AGRICULTURE ---
  {
    id: 'agri-f1-01',
    form: 1,
    term: 1,
    subject: 'agriculture',
    unit: 'Unit 1: Introduction to Agriculture',
    title: 'Agricultural Systems & Soil Composition in Malawi',
    objectives: [
      'Classify farming systems in Malawi (subsistence, commercial, estate)',
      'Analyze soil profile layers, soil texture, and soil structure',
      'Conduct experiments on soil water retention and soil pH'
    ],
    keyConcepts: ['Soil Profile (Horizons A, B, C)', 'Sand vs Clay vs Loam', 'Importance to Malawi Economy'],
    manebFrequency: 'Essential'
  },
  {
    id: 'agri-f2-01',
    form: 2,
    term: 1,
    subject: 'agriculture',
    unit: 'Unit 2: Crop Husbandry',
    title: 'Maize, Legume & Cash Crop Production Techniques',
    objectives: [
      'Describe land preparation, planting spacing, and fertilizer application for maize and groundnuts',
      'Identify major crop pests (Fall Armyworm, stalk borer) and cultural/chemical control methods',
      'Explain weed management and post-harvest storage methods'
    ],
    keyConcepts: ['Basal vs Top Dressing Fertilizers', 'Integrated Pest Management (IPM)', 'Hermetic Grain Storage'],
    manebFrequency: 'High'
  },
  {
    id: 'agri-f3-01',
    form: 3,
    term: 1,
    subject: 'agriculture',
    unit: 'Unit 3: Soil Conservation & Irrigation',
    title: 'Soil Erosion Control, Terracing & Irrigation Schemes',
    objectives: [
      'Explain causes, types, and prevention of water and wind soil erosion',
      'Design contour ridging, vetiver grass hedgerows, and check dams',
      'Evaluate irrigation methods (drip, sprinkler, surface) used in Malawi schemes'
    ],
    keyConcepts: ['Sheet, Rill & Gully Erosion', 'A-Frame & Contour Alignment', 'Bwanje Valley & Shire Valley Schemes'],
    manebFrequency: 'High'
  },
  {
    id: 'agri-f4-01',
    form: 4,
    term: 1,
    subject: 'agriculture',
    unit: 'Unit 4: Livestock Production & Agribusiness',
    title: 'Animal Nutrition, Disease Control & Farm Budgeting (MSCE)',
    objectives: [
      'Formulate balanced feed rations for poultry, dairy cows, and pigs',
      'Identify causes, symptoms, and vaccinations for Newcastle, East Coast Fever, and Anthrax',
      'Prepare enterprise gross margin budgets and farm profit-and-loss statements'
    ],
    keyConcepts: ['Ruminant vs Non-Ruminant Digestion', 'Tick-Borne Disease Control (Dipping)', 'Gross Margin = Revenue - Variable Costs'],
    manebFrequency: 'High'
  },

  // --- ENGLISH ---
  {
    id: 'eng-f1-01',
    form: 1,
    term: 1,
    subject: 'english',
    unit: 'Unit 1: Grammar Foundations',
    title: 'Parts of Speech, Tenses & Sentence Structures',
    objectives: [
      'Identify and correctly use active and passive voice',
      'Apply subject-verb agreement rules with complex compound subjects',
      'Form correct past perfect and conditional clauses'
    ],
    keyConcepts: ['Subject-Verb Concord', 'Active vs Passive Voice', 'If-Clauses (Conditional 1, 2, 3)'],
    manebFrequency: 'Essential'
  },
  {
    id: 'eng-f2-01',
    form: 2,
    term: 1,
    subject: 'english',
    unit: 'Unit 2: Composition & Creative Writing',
    title: 'Narrative & Descriptive Essays, Paragraphing',
    objectives: [
      'Plan and organize structured essays with compelling introductions and cohesive transitions',
      'Employ sensory details and figurative language (metaphors, similes, personification)',
      'Effectively punctuate dialogues and direct speech'
    ],
    keyConcepts: ['5-Paragraph Structure', 'Show, Don\'t Tell Techniques', 'Direct Speech Inverted Commas'],
    manebFrequency: 'High'
  },
  {
    id: 'eng-f3-01',
    form: 3,
    term: 1,
    subject: 'english',
    unit: 'Unit 3: Functional & Formal Writing',
    title: 'Formal Business Letters, Reports & Curriculum Vitae (CV)',
    objectives: [
      'Format official letters using correct Malawian conventions (Sender Address, Date, Receiver, Salutation, Heading)',
      'Write structured investigative and incident reports with findings and recommendations',
      'Draft concise modern resumes (CV) and job application letters'
    ],
    keyConcepts: ['Malawian Standard Letter Layout', 'Report Headings: Terms of Reference, Findings, Recommendations', 'Formal Register'],
    manebFrequency: 'High'
  },
  {
    id: 'eng-f4-01',
    form: 4,
    term: 1,
    subject: 'english',
    unit: 'Unit 4: Comprehension & Summary Skills',
    title: 'Critical Reading, Inferences & Summary Writing (MSCE)',
    objectives: [
      'Extract explicit and implicit meanings from complex analytical reading passages',
      'Condense extended texts into structured 80-100 word summaries without losing essential points',
      'Identify rhetorical devices and author tone/bias in national exam papers'
    ],
    keyConcepts: ['Note-Making Strategy', 'Own Words Paraphrasing', 'Word Count Discipline (MANEB criteria)'],
    manebFrequency: 'High'
  },

  // --- CHICHEWA ---
  {
    id: 'chich-f1-01',
    form: 1,
    term: 1,
    subject: 'chichewa',
    unit: 'Gawo 1: Zakalembedwe ka Chichewa',
    title: 'Miyambo ya Mkalembedwe, Mipata ya Mawu ndi Mitu ya Chichewa',
    objectives: [
      'Kutsatira malamulo a kalembedwe koyenera ka Chichewa (Kulekanitsa mawu molondola)',
      'Kugawa mawu m\'magulu a maina, mneni, ndi zolongosola',
      'Kulemba ziganizo zosamveka bwino ndi kuzikonza'
    ],
    keyConcepts: ['Mipata ya Mawu (Spacing Rules)', 'Magulu a Maina (Noun Classes)', 'Zilembo Zazikulu'],
    manebFrequency: 'Essential'
  },
  {
    id: 'chich-f3-01',
    form: 3,
    term: 1,
    subject: 'chichewa',
    unit: 'Gawo 2: Mabukhu a Literature (Nthondo)',
    title: 'Kusanthula Bukhu la "Nthondo" (Samuel Josiah Nthara)',
    objectives: [
      'Kufotokoza mbiri ya moyo wa Nthondo kuyambira pa ubwana mpaka kusintha kwake',
      'Kusanthula mitu ikuluikulu: Chikhalidwe cha Achewa, Zikhulupiriro zakale, ndi Kulowa kwa Uthenga Wabwino',
      'Kufotokoza makhalidwe a otchulidwa m\'bukhu monga Nthondo, Nthondo Mkazi wake, ndi Mafumu'
    ],
    keyConcepts: ['Kusintha kwa Nthondo', 'Chikhalidwe cha Achewa ndi Mwambo', 'Phunziro lalikulu kwa Achinyamata'],
    manebFrequency: 'High'
  },
  {
    id: 'chich-f4-01',
    form: 4,
    term: 1,
    subject: 'chichewa',
    unit: 'Gawo 3: Mabukhu a Literature (Chamdothe)',
    title: 'Kusanthula Bukhu la "Chamdothe" (J.M. Ntaba)',
    objectives: [
      'Kusanthula zochitika zazikulu mu bukhu la Chamdothe ndi nkhani ya umphawi ndi zovuta',
      'Kufufuza mmene mlembi wagwiritsira ntchito chilankhulo cha m\'nyimbo, miyambi, ndi mafanizo',
      'Kuyankha mafunso a mayeso a MANEB MSCE okhudza mikangano ya m\'bukhu'
    ],
    keyConcepts: ['Mikangano mu Bukhu (Conflicts)', 'Moyo wa Chamdothe', 'Miyambi ndi Zining\'a za m\'bukhu'],
    manebFrequency: 'High'
  },

  // --- GEOGRAPHY ---
  {
    id: 'geog-f1-01',
    form: 1,
    term: 1,
    subject: 'geography',
    unit: 'Unit 1: Practical Geography & Maps',
    title: 'Map Reading, Scale Calculations & Grid References',
    objectives: [
      'Interpret conventional topographic map symbols and contour patterns',
      'Convert between linear scale, representative fraction, and statement scales',
      'Find 4-figure and 6-figure grid references on Malawi 1:50,000 survey maps'
    ],
    keyConcepts: ['Contour Intervals & Relief Forms', '6-Figure Coordinates', 'Gradient Calculation'],
    manebFrequency: 'Essential'
  },
  {
    id: 'geog-f3-01',
    form: 3,
    term: 1,
    subject: 'geography',
    unit: 'Unit 2: Physical Landscapes & Climate',
    title: 'Plate Tectonics, The East African Rift Valley & Malawi Weather',
    objectives: [
      'Explain formation of the East African Great Rift Valley and Lake Malawi graben',
      'Describe volcanic landforms and seismic activity in the Shire Highlands',
      'Analyze ITCZ (Inter-Tropical Convergence Zone) and Chiperoni weather systems'
    ],
    keyConcepts: ['Tension & Faulting', 'Lake Malawi Rift Basin', 'ITCZ Rainfall Patterns & Chiperoni Winds'],
    manebFrequency: 'High'
  },
  {
    id: 'geog-f4-01',
    form: 4,
    term: 1,
    subject: 'geography',
    unit: 'Unit 3: Human & Economic Geography',
    title: 'Population Distribution, Urbanization & Environmental Conservation in Malawi',
    objectives: [
      'Evaluate factors influencing high population density in Southern Malawi versus Northern Region',
      'Assess social and economic impacts of rural-to-urban migration (Lilongwe, Blantyre, Mzuzu)',
      'Propose sustainable catchment management strategies for Shire River hydroelectric dams'
    ],
    keyConcepts: ['Demographic Transition Model', 'Nkula & Tedzani Hydroelectric Siltation', 'Deforestation Impacts'],
    manebFrequency: 'High'
  },

  // --- HISTORY ---
  {
    id: 'hist-f2-01',
    form: 2,
    term: 1,
    subject: 'history',
    unit: 'Unit 1: Pre-Colonial Malawi',
    title: 'The Maravi Empire, Chewa Migration & Trade Networks',
    objectives: [
      'Trace the migration of the Bantu and establishment of the Maravi Kingdom under the Kalonga',
      'Describe religious shrines and the M\'bona cult of Nsanje',
      'Analyze Long-distance trade in ivory and iron with the Swahili and Portuguese'
    ],
    keyConcepts: ['Kalonga Dynasty', 'M\'bona Shrine System', 'Pangwa & Swahili Trade Routes'],
    manebFrequency: 'High'
  },
  {
    id: 'hist-f3-01',
    form: 3,
    term: 1,
    subject: 'history',
    unit: 'Unit 2: The Colonial Era',
    title: 'The Nyasaland Protectorate, Thangata System & 1915 Chilembwe Uprising',
    objectives: [
      'Explain the establishment of British rule and the notorious "Thangata" tenancy system',
      'Examine the causes, events, and significance of the 1915 John Chilembwe Uprising',
      'Assess the impact of the Federation of Rhodesia and Nyasaland (1953)'
    ],
    keyConcepts: ['Thangata Labor System', 'John Chilembwe Providence Industrial Mission', 'Anti-Federation Resistance'],
    manebFrequency: 'High'
  },
  {
    id: 'hist-f4-01',
    form: 4,
    term: 1,
    subject: 'history',
    unit: 'Unit 3: Nationalism & Independence',
    title: 'The Struggle for Independence, 1959 State of Emergency & 1994 Democratic Transition',
    objectives: [
      'Trace the rise of the Nyasaland African Congress (NAC) and Dr. H. Kamuzu Banda\'s return',
      'Explain the 1959 State of Emergency, Operation Sunrise, and the Devlin Commission Report',
      'Analyze the transition from one-party rule to multiparty democracy in 1994'
    ],
    keyConcepts: ['1959 State of Emergency', '1964 Independence Day', '1993 National Referendum & Bakili Muluzi'],
    manebFrequency: 'High'
  }
];
