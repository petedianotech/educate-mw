export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
  synonyms?: string[];
  subject?: string;
}

export const ACADEMIC_DICTIONARY: Record<string, DictionaryEntry> = {
  // Biology & Natural Sciences
  "photosynthesis": {
    word: "photosynthesis",
    phonetic: "/ˌfəʊ.təʊˈsɪn.θə.sɪs/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The biochemical process by which green plants and certain other organisms use sunlight, water, and carbon dioxide to synthesize glucose and release oxygen.",
            example: "Photosynthesis takes place within the chloroplasts of plant leaves using chlorophyll."
          }
        ]
      }
    ],
    synonyms: ["carbon assimilation", "phototrophic process"],
    subject: "Biology"
  },
  "osmosis": {
    word: "osmosis",
    phonetic: "/ɒzˈməʊ.sɪs/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The movement of water molecules from a region of higher water potential to a region of lower water potential across a selectively permeable membrane.",
            example: "Plant root hair cells absorb soil water primarily through osmosis."
          }
        ]
      }
    ],
    synonyms: ["water diffusion", "passive transport"],
    subject: "Biology"
  },
  "diffusion": {
    word: "diffusion",
    phonetic: "/dɪˈfjuː.ʒən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The net movement of particles from an area of higher concentration to an area of lower concentration along a concentration gradient until evenly distributed.",
            example: "Oxygen enters red blood cells in the alveoli by simple diffusion."
          }
        ]
      }
    ],
    synonyms: ["dispersion", "spreading", "permeation"],
    subject: "Biology / Physics"
  },
  "respiration": {
    word: "respiration",
    phonetic: "/ˌres.pɪˈreɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The cellular chemical process of breaking down organic food molecules (like glucose) to release usable energy (ATP) for vital biological functions.",
            example: "Aerobic respiration requires oxygen and produces carbon dioxide and water as by-products."
          }
        ]
      }
    ],
    synonyms: ["cellular respiration", "metabolism"],
    subject: "Biology"
  },
  "mitosis": {
    word: "mitosis",
    phonetic: "/maɪˈtəʊ.sɪs/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A type of cell division resulting in two genetically identical daughter cells each having the same number and kind of chromosomes as the parent nucleus.",
            example: "Mitosis is responsible for growth, tissue repair, and asexual reproduction."
          }
        ]
      }
    ],
    synonyms: ["cell duplication", "equational division"],
    subject: "Biology"
  },
  "meiosis": {
    word: "meiosis",
    phonetic: "/maɪˈəʊ.sɪs/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A specialized form of cell division that reduces the chromosome number by half, creating four genetically unique haploid gamete cells.",
            example: "Meiosis occurs in reproductive organs to produce sperm and egg cells."
          }
        ]
      }
    ],
    synonyms: ["reduction division", "gametogenesis"],
    subject: "Biology"
  },
  "ecosystem": {
    word: "ecosystem",
    phonetic: "/ˈiː.kəʊˌsɪs.təm/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A biological community of interacting organisms (biotic factors) and their physical environment (abiotic factors) functioning as an integrated unit.",
            example: "Lake Malawi supports a freshwater ecosystem with hundreds of endemic cichlid fish species."
          }
        ]
      }
    ],
    synonyms: ["biome", "ecological community", "environment"],
    subject: "Biology / Geography"
  },
  "enzyme": {
    word: "enzyme",
    phonetic: "/ˈen.zaɪm/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A biological protein catalyst that speeds up specific biochemical reactions in living organisms without being consumed in the process.",
            example: "Amylase is an enzyme that breaks down starch into simple sugars in saliva."
          }
        ]
      }
    ],
    synonyms: ["biological catalyst", "biocatalyst"],
    subject: "Biology / Chemistry"
  },
  "transpiration": {
    word: "transpiration",
    phonetic: "/ˌtræn.spɪˈreɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The loss of water vapor from the aerial parts of a plant, chiefly through the stomata in the leaves.",
            example: "High temperatures and windy conditions significantly increase the rate of transpiration."
          }
        ]
      }
    ],
    synonyms: ["plant evaporation", "water loss"],
    subject: "Biology / Agriculture"
  },

  // Chemistry
  "catalyst": {
    word: "catalyst",
    phonetic: "/ˈkæt.əl.ɪst/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A substance that increases the rate of a chemical reaction by lowering the activation energy without itself undergoing any permanent chemical change.",
            example: "Manganese dioxide acts as a catalyst in the decomposition of hydrogen peroxide."
          }
        ]
      }
    ],
    synonyms: ["accelerator", "promoter", "activator"],
    subject: "Chemistry"
  },
  "electrolysis": {
    word: "electrolysis",
    phonetic: "/ɪˌlekˈtrɒl.ə.sɪs/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "Chemical decomposition produced by passing an electric current through an electrolyte liquid containing mobile ions.",
            example: "Electrolysis of acidified water splits it into hydrogen gas at the cathode and oxygen at the anode."
          }
        ]
      }
    ],
    synonyms: ["electro-decomposition", "galvanic breakdown"],
    subject: "Chemistry"
  },
  "allotropy": {
    word: "allotropy",
    phonetic: "/əˈlɒt.rə.pi/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The existence of a chemical element in two or more different physical forms in the same state, such as diamond and graphite for carbon.",
            example: "Diamond and graphite exhibit allotropy due to different crystal lattice arrangements."
          }
        ]
      }
    ],
    synonyms: ["allotropism", "structural polymorphism"],
    subject: "Chemistry"
  },
  "endothermic": {
    word: "endothermic",
    phonetic: "/ˌen.dəʊˈθɜː.mɪk/",
    meanings: [
      {
        partOfSpeech: "adjective",
        definitions: [
          {
            definition: "Accompanied by or requiring the absorption of heat energy from the surroundings (positive enthalpy change, ΔH > 0).",
            example: "Thermal decomposition of calcium carbonate is an endothermic reaction requiring continuous heating."
          }
        ]
      }
    ],
    synonyms: ["heat-absorbing"],
    subject: "Chemistry / Physics"
  },
  "exothermic": {
    word: "exothermic",
    phonetic: "/ˌek.səʊˈθɜː.mɪk/",
    meanings: [
      {
        partOfSpeech: "adjective",
        definitions: [
          {
            definition: "A chemical reaction or physical change that releases heat energy into its surroundings (negative enthalpy change, ΔH < 0).",
            example: "The combustion of charcoal and neutralisation reactions are strongly exothermic."
          }
        ]
      }
    ],
    synonyms: ["heat-releasing"],
    subject: "Chemistry / Physics"
  },
  "covalent": {
    word: "covalent",
    phonetic: "/kəʊˈveɪ.lənt/",
    meanings: [
      {
        partOfSpeech: "adjective",
        definitions: [
          {
            definition: "Relating to or denoting chemical bonds formed by the sharing of electron pairs between non-metal atoms.",
            example: "A water molecule has two single covalent bonds between hydrogen and oxygen."
          }
        ]
      }
    ],
    synonyms: ["shared-electron bonding"],
    subject: "Chemistry"
  },
  "neutralisation": {
    word: "neutralisation",
    phonetic: "/ˌnjuː.trə.laɪˈzeɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A chemical reaction in which an acid and a base react quantitatively with each other to produce a salt and water.",
            example: "Hydrochloric acid and sodium hydroxide undergo neutralisation to form table salt and water."
          }
        ]
      }
    ],
    synonyms: ["acid-base reaction", "neutralization"],
    subject: "Chemistry"
  },

  // Physics & Mathematics
  "acceleration": {
    word: "acceleration",
    phonetic: "/əkˌsel.əˈreɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The rate of change of velocity per unit of time; a vector quantity measured in metres per second squared (m/s²).",
            example: "Due to Earth's gravity, an object in free fall experiences an acceleration of approximately 9.8 m/s²."
          }
        ]
      }
    ],
    synonyms: ["speeding up", "rate of velocity change"],
    subject: "Physics"
  },
  "velocity": {
    word: "velocity",
    phonetic: "/vəˈlɒs.ə.ti/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The speed of something in a given specified direction; displacement divided by time taken.",
            example: "The vehicle was travelling with a constant velocity of 80 km/h due north."
          }
        ]
      }
    ],
    synonyms: ["speed with direction", "pace", "rate of displacement"],
    subject: "Physics"
  },
  "displacement": {
    word: "displacement",
    phonetic: "/dɪsˈpleɪs.mənt/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The shortest straight-line distance measured from an object's initial position to its final position, including direction (a vector quantity).",
            example: "Even though the runner completed a 400m lap, her total displacement was zero."
          }
        ]
      }
    ],
    synonyms: ["change in position", "net distance"],
    subject: "Physics"
  },
  "refraction": {
    word: "refraction",
    phonetic: "/rɪˈfræk.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The bending of a wave (such as light or sound) when it enters a medium of different optical density at an angle, caused by a change in wave speed.",
            example: "A straw in a glass of water appears bent because of the refraction of light."
          }
        ]
      }
    ],
    synonyms: ["wave deflection", "light bending"],
    subject: "Physics"
  },
  "diffraction": {
    word: "diffraction",
    phonetic: "/dɪˈfræk.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The spreading out of waves as they pass through an aperture or around the edge of an obstacle of comparable dimension to their wavelength.",
            example: "Sound waves undergo diffraction easily around doorways, allowing you to hear into another room."
          }
        ]
      }
    ],
    synonyms: ["wave spreading", "bending around obstacles"],
    subject: "Physics"
  },
  "hypothesis": {
    word: "hypothesis",
    phonetic: "/haɪˈpɒθ.ə.sɪs/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A proposed scientific explanation made on the basis of limited evidence as a starting point for further investigation and empirical testing.",
            example: "The student formulated a hypothesis that increasing temperature would speed up seed germination."
          }
        ]
      }
    ],
    synonyms: ["postulation", "educated guess", "theory proposition"],
    subject: "Science / Research"
  },
  "vector": {
    word: "vector",
    phonetic: "/ˈvek.tər/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A physical quantity that possesses both magnitude (size) and direction (e.g., velocity, force, acceleration).",
            example: "Force is a vector quantity because you must specify how hard you are pushing and in which direction."
          }
        ]
      }
    ],
    synonyms: ["directional quantity"],
    subject: "Physics / Mathematics"
  },
  "scalar": {
    word: "scalar",
    phonetic: "/ˈskeɪ.lər/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A physical quantity that has magnitude only and is completely specified by a numerical value with appropriate units (e.g., mass, time, speed, temperature).",
            example: "Speed and temperature are scalars because they do not have a spatial direction."
          }
        ]
      }
    ],
    synonyms: ["magnitude quantity", "non-directional"],
    subject: "Physics / Mathematics"
  },

  // Geography & Agriculture
  "erosion": {
    word: "erosion",
    phonetic: "/ɪˈrəʊ.ʒən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The gradual wearing away and transportation of soil, rock, or land surfaces by the action of wind, water, ice, or gravity.",
            example: "Contour ridging and vetiver grass planting help prevent severe soil erosion on Malawian hillsides."
          }
        ]
      }
    ],
    synonyms: ["denudation", "wearing away", "weathering transport"],
    subject: "Geography / Agriculture"
  },
  "weathering": {
    word: "weathering",
    phonetic: "/ˈweð.ər.ɪŋ/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The in situ breakdown or disintegration of rocks and minerals on Earth's surface through physical, chemical, or biological processes without transportation.",
            example: "Freeze-thaw action is an example of mechanical weathering."
          }
        ]
      }
    ],
    synonyms: ["rock breakdown", "decomposition", "disintegration"],
    subject: "Geography"
  },
  "agroforestry": {
    word: "agroforestry",
    phonetic: "/ˌæɡ.rəʊˈfɒr.ɪ.stri/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "An integrated land-use management system in which trees or shrubs are grown around or among crops or pastureland to improve soil fertility and yields.",
            example: "Planting Faidherbia albida (Nsangu) trees alongside maize crops is a common agroforestry practice in Malawi."
          }
        ]
      }
    ],
    synonyms: ["tree-crop farming", "silvoarable agriculture"],
    subject: "Agriculture / Geography"
  },
  "urbanisation": {
    word: "urbanisation",
    phonetic: "/ˌɜː.bən.aɪˈzeɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The population shift from rural areas to urban regions, accompanied by the gradual growth and expansion of towns and cities.",
            example: "Rapid urbanisation in Lilongwe has created a surge in demand for affordable housing and clean water."
          }
        ]
      }
    ],
    synonyms: ["urban growth", "city migration"],
    subject: "Geography / Social Studies"
  },

  // History, Social Studies & English Language
  "democracy": {
    word: "democracy",
    phonetic: "/dɪˈmɒk.rə.si/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A system of government in which citizens exercise power directly or elect representatives from among themselves to form a governing body.",
            example: "Malawi transitioned from a one-party state to a multiparty democracy following the 1993 National Referendum."
          }
        ]
      }
    ],
    synonyms: ["representative government", "popular sovereignty", "republic"],
    subject: "History / Social Studies"
  },
  "sovereignty": {
    word: "sovereignty",
    phonetic: "/ˈsɒv.rɪn.ti/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The supreme and independent power or authority of a state to govern itself and make decisions free from external interference.",
            example: "Malawi achieved full national sovereignty on July 6, 1964."
          }
        ]
      }
    ],
    synonyms: ["supreme authority", "autonomy", "independence"],
    subject: "History / Civics"
  },
  "metaphor": {
    word: "metaphor",
    phonetic: "/ˈmet.ə.fɔːr/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable, stating that one thing is another.",
            example: "In the poem, 'the classroom was a zoo' is a metaphor emphasizing the high noise level."
          }
        ]
      }
    ],
    synonyms: ["figure of speech", "allegory", "symbolic analogy"],
    subject: "English Literature"
  },
  "simile": {
    word: "simile",
    phonetic: "/ˈsɪm.ɪ.li/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "A figure of speech involving the explicit comparison of one thing with another thing of a different kind, using words such as 'like' or 'as'.",
            example: "The brave warrior fought as fiercely as a hungry lion."
          }
        ]
      }
    ],
    synonyms: ["comparative figure", "analogy"],
    subject: "English Literature"
  },
  "onomatopoeia": {
    word: "onomatopoeia",
    phonetic: "/ˌɒn.əˌmæt.əˈpiː.ə/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The formation of a word from a sound associated with what is named (e.g., cuckoo, sizzle, buzz, bang).",
            example: "Words like 'giggle' and 'boom' are examples of onomatopoeia commonly tested in MSCE English."
          }
        ]
      }
    ],
    synonyms: ["sound-word", "phonetic imitation"],
    subject: "English Language"
  },
  "personification": {
    word: "personification",
    phonetic: "/pəˌsɒn.ɪ.fɪˈkeɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The attribution of human characteristics, emotions, or behaviors to something non-human, such as an animal, object, or abstract concept.",
            example: "'The wind whispered through the dark forest' uses personification."
          }
        ]
      }
    ],
    synonyms: ["anthropomorphism", "humanization"],
    subject: "English Literature"
  },
  "alliteration": {
    word: "alliteration",
    phonetic: "/əˌlɪt.əˈreɪ.ʃən/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "The occurrence of the same letter or sound at the beginning of adjacent or closely connected words.",
            example: "'Peter Piper picked a peck of pickled peppers' is a classic example of alliteration."
          }
        ]
      }
    ],
    synonyms: ["head rhyme", "initial rhyme"],
    subject: "English Literature"
  },
  "hyperbole": {
    word: "hyperbole",
    phonetic: "/haɪˈpɜː.bəl.i/",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          {
            definition: "Deliberately exaggerated statements or claims not meant to be taken literally, used for emphasis or dramatic effect.",
            example: "'I have told you a million times' is an obvious hyperbole."
          }
        ]
      }
    ],
    synonyms: ["exaggeration", "overstatement", "magnification"],
    subject: "English Language"
  }
};

export const POPULAR_DICTIONARY_WORDS = [
  "Photosynthesis",
  "Osmosis",
  "Catalyst",
  "Electrolysis",
  "Endothermic",
  "Acceleration",
  "Velocity",
  "Refraction",
  "Democracy",
  "Erosion",
  "Agroforestry",
  "Metaphor",
  "Simile",
  "Allotropy",
  "Respiration"
];
