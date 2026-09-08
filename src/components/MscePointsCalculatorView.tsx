import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Calculator, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Building2, 
  MapPin, 
  Briefcase, 
  Share2, 
  Check, 
  ChevronRight, 
  Info, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export interface SubjectGrade {
  id: string;
  name: string;
  shortName: string;
  grade: number; // 0 = Not set / 0 pts, 1-2 = Distinction, 3-6 = Credit, 7-8 = Pass, 9 = Fail
  category: 'core' | 'science' | 'humanities' | 'commercial' | 'language' | 'tech';
}

export interface UniversityProgram {
  id: string;
  university: 'UNIMA' | 'MUBAS' | 'MUST' | 'KUHeS' | 'MZUNI' | 'LUANAR' | 'CUNIMA' | 'MAU';
  universityFullName: string;
  location: string;
  faculty: string;
  title: string;
  degreeType: string;
  duration: string;
  category: 'health' | 'engineering' | 'business' | 'law' | 'education' | 'agriculture' | 'science' | 'humanities';
  cutoffPoints: number; // Merit cutoff points (lower is better in Malawi)
  privateCutoffPoints?: number;
  requiredSubjects: {
    subjectId: string;
    maxGrade: number; // Grade must be <= this value (e.g. <= 6 for Credit, <= 2 for Distinction)
    label: string;
  }[];
  description: string;
  careerPaths: string[];
  intakeNote?: string;
}

export const MANEB_SUBJECTS: { id: string; name: string; shortName: string; category: SubjectGrade['category'] }[] = [
  { id: 'eng', name: 'English (Language & Literature)', shortName: 'English', category: 'core' },
  { id: 'math', name: 'Mathematics', shortName: 'Maths', category: 'core' },
  { id: 'bio', name: 'Biology', shortName: 'Biology', category: 'science' },
  { id: 'ps', name: 'Physical Science / Physics / Chem', shortName: 'Physical Sci', category: 'science' },
  { id: 'agric', name: 'Agriculture', shortName: 'Agric', category: 'science' },
  { id: 'geo', name: 'Geography', shortName: 'Geography', category: 'humanities' },
  { id: 'hist', name: 'History', shortName: 'History', category: 'humanities' },
  { id: 'sds', name: 'Social & Development Studies', shortName: 'Social Studies', category: 'humanities' },
  { id: 'chich', name: 'Chichewa', shortName: 'Chichewa', category: 'language' },
  { id: 'cs', name: 'Computer Studies / ICT', shortName: 'Computer', category: 'tech' },
  { id: 'bk', name: 'Bible Knowledge / Rel. Studies', shortName: 'Bible Know.', category: 'humanities' },
  { id: 'comm', name: 'Commerce / Business Studies', shortName: 'Commerce', category: 'commercial' },
  { id: 'acc', name: 'Financial Accounting', shortName: 'Accounting', category: 'commercial' },
  { id: 'addmath', name: 'Additional Mathematics', shortName: 'Add Maths', category: 'science' },
  { id: 'he', name: 'Home Economics / Nutrition', shortName: 'Home Econ', category: 'science' },
  { id: 'french', name: 'French', shortName: 'French', category: 'language' },
];

export const MALAWI_PROGRAMMES: UniversityProgram[] = [
  // --- KUHeS (Kamuzu University of Health Sciences) ---
  {
    id: 'kuhes-mbbs',
    university: 'KUHeS',
    universityFullName: 'Kamuzu University of Health Sciences',
    location: 'Blantyre (Mahatma Gandhi)',
    faculty: 'School of Medicine',
    title: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)',
    degreeType: 'Medical Doctor Degree',
    duration: '5 - 6 Years',
    category: 'health',
    cutoffPoints: 12,
    privateCutoffPoints: 16,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
      { subjectId: 'bio', maxGrade: 2, label: 'Biology (Distinction 1-2)' },
      { subjectId: 'ps', maxGrade: 2, label: 'Physical Science (Distinction 1-2)' },
    ],
    description: 'Premier medical training programme in Malawi producing registered medical doctors, clinical surgeons, and medical researchers.',
    careerPaths: ['Medical Doctor', 'Surgeon', 'Clinical Researcher', 'Hospital Superintendent'],
    intakeNote: 'High distinctions in Biology & Physical Science are strongly prioritized for NCHE selection.'
  },
  {
    id: 'kuhes-pharm',
    university: 'KUHeS',
    universityFullName: 'Kamuzu University of Health Sciences',
    location: 'Blantyre',
    faculty: 'School of Pharmacy',
    title: 'Bachelor of Pharmacy (Honours)',
    degreeType: 'BPharm (Hons)',
    duration: '4 Years',
    category: 'health',
    cutoffPoints: 14,
    privateCutoffPoints: 18,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
      { subjectId: 'ps', maxGrade: 3, label: 'Physical Science (Credit 1-3)' },
      { subjectId: 'bio', maxGrade: 3, label: 'Biology (Credit 1-3)' },
    ],
    description: 'Clinical pharmacology, pharmaceutical formulation, and medicine regulation in hospitals and industrial healthcare.',
    careerPaths: ['Hospital Pharmacist', 'Pharmaceutical Chemist', 'Drug Regulatory Officer (PMRA)'],
  },
  {
    id: 'kuhes-nursing',
    university: 'KUHeS',
    universityFullName: 'Kamuzu University of Health Sciences',
    location: 'Blantyre & Lilongwe (KCN)',
    faculty: 'School of Nursing & Midwifery',
    title: 'Bachelor of Science in Nursing and Midwifery',
    degreeType: 'BSc Nursing',
    duration: '4 Years',
    category: 'health',
    cutoffPoints: 18,
    privateCutoffPoints: 24,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'bio', maxGrade: 4, label: 'Biology (Credit 1-4)' },
      { subjectId: 'ps', maxGrade: 6, label: 'Physical Science (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 6, label: 'Mathematics (Credit 1-6)' },
    ],
    description: 'Professional nursing care, maternal health, clinical diagnosis, and hospital ward management across Malawi healthcare centers.',
    careerPaths: ['Registered Nurse-Midwife', 'Hospital Ward Sister', 'Public Health Officer'],
  },
  {
    id: 'kuhes-mls',
    university: 'KUHeS',
    universityFullName: 'Kamuzu University of Health Sciences',
    location: 'Blantyre',
    faculty: 'School of Global & Public Health',
    title: 'Bachelor of Medical Laboratory Sciences (Honours)',
    degreeType: 'BMLS (Hons)',
    duration: '4 Years',
    category: 'health',
    cutoffPoints: 16,
    privateCutoffPoints: 20,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 5, label: 'Mathematics (Credit 1-5)' },
      { subjectId: 'bio', maxGrade: 3, label: 'Biology (Credit 1-3)' },
      { subjectId: 'ps', maxGrade: 3, label: 'Physical Science (Credit 1-3)' },
    ],
    description: 'Clinical diagnostic pathology, microbiology, haematology, and medical research in central and district hospitals.',
    careerPaths: ['Medical Laboratory Scientist', 'Pathologist', 'Clinical Diagnostic Specialist'],
  },

  // --- MUBAS (Malawi University of Business and Applied Sciences) ---
  {
    id: 'mubas-civil',
    university: 'MUBAS',
    universityFullName: 'Malawi University of Business and Applied Sciences',
    location: 'Blantyre (Chichiri)',
    faculty: 'School of Engineering',
    title: 'Bachelor of Civil Engineering (Honours)',
    degreeType: 'BEng (Hons) Civil',
    duration: '5 Years',
    category: 'engineering',
    cutoffPoints: 15,
    privateCutoffPoints: 20,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 2, label: 'Mathematics (Distinction 1-2)' },
      { subjectId: 'ps', maxGrade: 3, label: 'Physical Science (Credit 1-3)' },
    ],
    description: 'Design and construction of infrastructure including roads, bridges, water supply systems, and modern structural buildings.',
    careerPaths: ['Civil Engineer', 'Structural Engineer', 'Roads Authority Consultant', 'Project Manager'],
  },
  {
    id: 'mubas-elec',
    university: 'MUBAS',
    universityFullName: 'Malawi University of Business and Applied Sciences',
    location: 'Blantyre',
    faculty: 'School of Engineering',
    title: 'Bachelor of Electrical and Electronics Engineering (Honours)',
    degreeType: 'BEng (Hons) Electrical',
    duration: '5 Years',
    category: 'engineering',
    cutoffPoints: 15,
    privateCutoffPoints: 20,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 2, label: 'Mathematics (Distinction 1-2)' },
      { subjectId: 'ps', maxGrade: 3, label: 'Physical Science (Credit 1-3)' },
    ],
    description: 'Power systems generation (ESCOM/EGENCO), telecommunications, renewable energy grids, and electronic automation.',
    careerPaths: ['Electrical Engineer', 'Power Systems Engineer', 'Telecom Engineer', 'Energy Specialist'],
  },
  {
    id: 'mubas-cs',
    university: 'MUBAS',
    universityFullName: 'Malawi University of Business and Applied Sciences',
    location: 'Blantyre',
    faculty: 'School of Science and Technology',
    title: 'Bachelor of Science in Computer Science',
    degreeType: 'BSc Computer Science',
    duration: '4 Years',
    category: 'engineering',
    cutoffPoints: 16,
    privateCutoffPoints: 22,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 3, label: 'Mathematics (Credit 1-3)' },
      { subjectId: 'ps', maxGrade: 4, label: 'Physical Science (Credit 1-4)' },
    ],
    description: 'Software development, database architectures, algorithmic design, cybersecurity, and artificial intelligence systems.',
    careerPaths: ['Software Engineer', 'Full-Stack Developer', 'Systems Architect', 'Database Administrator'],
  },
  {
    id: 'mubas-bacc',
    university: 'MUBAS',
    universityFullName: 'Malawi University of Business and Applied Sciences',
    location: 'Blantyre',
    faculty: 'School of Commerce',
    title: 'Bachelor of Accountancy (BAcc)',
    degreeType: 'Bachelor of Accountancy',
    duration: '4 Years',
    category: 'business',
    cutoffPoints: 16,
    privateCutoffPoints: 22,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 3, label: 'Mathematics (Credit 1-3)' },
    ],
    description: 'The premier professional accounting degree in Malawi, accredited for ICAM and ACCA fast-track pathways.',
    careerPaths: ['Chartered Accountant', 'Financial Auditor', 'Chief Financial Officer', 'Tax Consultant'],
  },
  {
    id: 'mubas-bba',
    university: 'MUBAS',
    universityFullName: 'Malawi University of Business and Applied Sciences',
    location: 'Blantyre',
    faculty: 'School of Commerce',
    title: 'Bachelor of Business Administration (BBA)',
    degreeType: 'BBA Degree',
    duration: '4 Years',
    category: 'business',
    cutoffPoints: 20,
    privateCutoffPoints: 26,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 5, label: 'Mathematics (Credit 1-5)' },
    ],
    description: 'Corporate management, marketing strategy, human resources, entrepreneurship, and organizational leadership.',
    careerPaths: ['Business Manager', 'Marketing Director', 'Operations Specialist', 'Entrepreneur'],
  },

  // --- MUST (Malawi University of Science and Technology) ---
  {
    id: 'must-biomed',
    university: 'MUST',
    universityFullName: 'Malawi University of Science and Technology',
    location: 'Thyolo (Goliati)',
    faculty: 'Malawi Institute of Technology',
    title: 'Bachelor of Engineering in Biomedical Engineering (Honours)',
    degreeType: 'BEng (Hons) Biomedical',
    duration: '5 Years',
    category: 'engineering',
    cutoffPoints: 15,
    privateCutoffPoints: 20,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 2, label: 'Mathematics (Distinction 1-2)' },
      { subjectId: 'ps', maxGrade: 2, label: 'Physical Science (Distinction 1-2)' },
      { subjectId: 'bio', maxGrade: 3, label: 'Biology (Credit 1-3)' },
    ],
    description: 'Medical instrumentation, hospital device maintenance, bio-sensors, MRI calibration, and healthcare technology.',
    careerPaths: ['Biomedical Engineer', 'Clinical Technology Specialist', 'Medical Equipment Engineer'],
  },
  {
    id: 'must-cyber',
    university: 'MUST',
    universityFullName: 'Malawi University of Science and Technology',
    location: 'Thyolo',
    faculty: 'Ndata School of Climate & Heritage Sciences',
    title: 'Bachelor of Science in Computer Systems & Security (Cybersecurity)',
    degreeType: 'BSc Cybersecurity',
    duration: '4 Years',
    category: 'engineering',
    cutoffPoints: 16,
    privateCutoffPoints: 22,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 3, label: 'Mathematics (Credit 1-3)' },
      { subjectId: 'ps', maxGrade: 4, label: 'Physical Science (Credit 1-4)' },
    ],
    description: 'Network defense, ethical hacking, digital forensics, cryptography, and banking systems security.',
    careerPaths: ['Cybersecurity Analyst', 'Information Security Officer', 'Network Security Architect'],
  },
  {
    id: 'must-chem-eng',
    university: 'MUST',
    universityFullName: 'Malawi University of Science and Technology',
    location: 'Thyolo',
    faculty: 'Malawi Institute of Technology',
    title: 'Bachelor of Engineering in Chemical Engineering (Honours)',
    degreeType: 'BEng (Hons) Chemical',
    duration: '5 Years',
    category: 'engineering',
    cutoffPoints: 16,
    privateCutoffPoints: 22,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 2, label: 'Mathematics (Distinction 1-2)' },
      { subjectId: 'ps', maxGrade: 2, label: 'Physical Science (Distinction 1-2)' },
    ],
    description: 'Industrial manufacturing, food processing, mineral refining, chemical plastics, and water treatment plants.',
    careerPaths: ['Chemical Engineer', 'Process Plant Engineer', 'Industrial Quality Assurance Specialist'],
  },

  // --- UNIMA (University of Malawi) ---
  {
    id: 'unima-law',
    university: 'UNIMA',
    universityFullName: 'University of Malawi',
    location: 'Zomba (Chancellor College)',
    faculty: 'Faculty of Law',
    title: 'Bachelor of Laws (Honours) - LLB (Hons)',
    degreeType: 'LLB (Honours)',
    duration: '4 - 5 Years',
    category: 'law',
    cutoffPoints: 12,
    privateCutoffPoints: 16,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 2, label: 'English (Distinction 1-2)' },
      { subjectId: 'math', maxGrade: 6, label: 'Mathematics (Credit 1-6)' },
    ],
    description: 'Premier legal education in Malawi. Produces high court advocates, judges, corporate legal counsels, and human rights champions.',
    careerPaths: ['Legal Practitioner / Attorney', 'Magistrate / Judge', 'Corporate Legal Counsel', 'State Advocate'],
    intakeNote: 'Distinction 1 or 2 in English is mandatory for high merit selection rank.'
  },
  {
    id: 'unima-econ',
    university: 'UNIMA',
    universityFullName: 'University of Malawi',
    location: 'Zomba',
    faculty: 'Faculty of Social Science',
    title: 'Bachelor of Social Science in Economics',
    degreeType: 'BSocSc Economics',
    duration: '4 Years',
    category: 'business',
    cutoffPoints: 16,
    privateCutoffPoints: 22,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 3, label: 'Mathematics (Credit 1-3)' },
    ],
    description: 'Macroeconomic modeling, Reserve Bank of Malawi fiscal policies, econometrics, and international trade.',
    careerPaths: ['Economist (RBM / MoF)', 'Financial Market Analyst', 'Policy Researcher', 'Development Banker'],
  },
  {
    id: 'unima-science',
    university: 'UNIMA',
    universityFullName: 'University of Malawi',
    location: 'Zomba',
    faculty: 'Faculty of Science',
    title: 'Bachelor of Science (Pure & Applied Sciences)',
    degreeType: 'BSc Generic',
    duration: '4 Years',
    category: 'science',
    cutoffPoints: 18,
    privateCutoffPoints: 24,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
      { subjectId: 'ps', maxGrade: 4, label: 'Physical Science (Credit 1-4)' },
      { subjectId: 'bio', maxGrade: 4, label: 'Biology (Credit 1-4)' },
    ],
    description: 'Foundational scientific degrees majoring in Chemistry, Physics, Mathematics, Biology, Geology, or Statistics.',
    careerPaths: ['Research Scientist', 'Laboratory Analyst', 'Scientific Officer', 'Data Analyst'],
  },
  {
    id: 'unima-edu-sci',
    university: 'UNIMA',
    universityFullName: 'University of Malawi',
    location: 'Zomba',
    faculty: 'School of Education',
    title: 'Bachelor of Education (Science)',
    degreeType: 'BEd (Science)',
    duration: '4 Years',
    category: 'education',
    cutoffPoints: 22,
    privateCutoffPoints: 28,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 5, label: 'Mathematics (Credit 1-5)' },
      { subjectId: 'ps', maxGrade: 5, label: 'Physical Science / Biology (Credit 1-5)' },
    ],
    description: 'Secondary school science pedagogy, curriculum development, and educational administration.',
    careerPaths: ['Secondary School Science Teacher', 'Education Inspector', 'Curriculum Developer (MIE)'],
  },

  // --- LUANAR (Lilongwe University of Agriculture and Natural Resources) ---
  {
    id: 'luanar-dvm',
    university: 'LUANAR',
    universityFullName: 'Lilongwe University of Agriculture & Natural Resources',
    location: 'Lilongwe (Bunda Campus)',
    faculty: 'Faculty of Veterinary Medicine',
    title: 'Doctor of Veterinary Medicine (DVM)',
    degreeType: 'Doctor of Vet Medicine',
    duration: '6 Years',
    category: 'health',
    cutoffPoints: 14,
    privateCutoffPoints: 18,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'bio', maxGrade: 2, label: 'Biology (Distinction 1-2)' },
      { subjectId: 'ps', maxGrade: 3, label: 'Physical Science (Credit 1-3)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
    ],
    description: 'Animal surgery, livestock pathology, zoonotic disease control, wildlife health, and veterinary clinical practice.',
    careerPaths: ['Veterinary Surgeon', 'Livestock Health Specialist', 'Wildlife Vet Officer (DNPW)'],
  },
  {
    id: 'luanar-agribiz',
    university: 'LUANAR',
    universityFullName: 'Lilongwe University of Agriculture & Natural Resources',
    location: 'Lilongwe (Bunda)',
    faculty: 'Faculty of Development Studies',
    title: 'Bachelor of Science in Agribusiness Management',
    degreeType: 'BSc Agribusiness',
    duration: '4 Years',
    category: 'agriculture',
    cutoffPoints: 18,
    privateCutoffPoints: 24,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
      { subjectId: 'agric', maxGrade: 4, label: 'Agriculture / Biology (Credit 1-4)' },
    ],
    description: 'Agricultural economics, value chain financing, commodity trading, and farm enterprise management.',
    careerPaths: ['Agribusiness Manager', 'Agricultural Loan Officer', 'Commodity Broker', 'Farm Director'],
  },
  {
    id: 'luanar-food-sci',
    university: 'LUANAR',
    universityFullName: 'Lilongwe University of Agriculture & Natural Resources',
    location: 'Lilongwe (Bunda)',
    faculty: 'Faculty of Food and Human Sciences',
    title: 'Bachelor of Science in Food Science and Technology',
    degreeType: 'BSc Food Science',
    duration: '4 Years',
    category: 'science',
    cutoffPoints: 18,
    privateCutoffPoints: 24,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'ps', maxGrade: 4, label: 'Physical Science (Credit 1-4)' },
      { subjectId: 'bio', maxGrade: 4, label: 'Biology (Credit 1-4)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
    ],
    description: 'Food preservation, processing engineering, nutritional quality assurance, and Malawi Bureau of Standards (MBS) testing.',
    careerPaths: ['Food Technologist', 'MBS Standards Inspector', 'Brewery / Beverages Quality Manager'],
  },

  // --- MZUNI (Mzuzu University) ---
  {
    id: 'mzuni-optom',
    university: 'MZUNI',
    universityFullName: 'Mzuzu University',
    location: 'Mzuzu (Luwinga)',
    faculty: 'Faculty of Health Sciences',
    title: 'Bachelor of Science in Optometry (OD)',
    degreeType: 'Doctor of Optometry',
    duration: '5 Years',
    category: 'health',
    cutoffPoints: 15,
    privateCutoffPoints: 20,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'ps', maxGrade: 3, label: 'Physical Science / Physics (Credit 1-3)' },
      { subjectId: 'bio', maxGrade: 3, label: 'Biology (Credit 1-3)' },
      { subjectId: 'math', maxGrade: 4, label: 'Mathematics (Credit 1-4)' },
    ],
    description: 'Vision examination, eye refraction, optics diagnosis, contact lens fittings, and ocular health treatment.',
    careerPaths: ['Optometrist', 'Eye Care Specialist', 'Hospital Optical Consultant'],
  },
  {
    id: 'mzuni-ict',
    university: 'MZUNI',
    universityFullName: 'Mzuzu University',
    location: 'Mzuzu',
    faculty: 'Faculty of Science, Technology & Innovation',
    title: 'Bachelor of Science in Information and Communication Technology (ICT)',
    degreeType: 'BSc ICT',
    duration: '4 Years',
    category: 'engineering',
    cutoffPoints: 18,
    privateCutoffPoints: 24,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 3, label: 'Mathematics (Credit 1-3)' },
      { subjectId: 'ps', maxGrade: 5, label: 'Physical Science (Credit 1-5)' },
    ],
    description: 'Network engineering, enterprise database administration, web applications, and ICT infrastructure.',
    careerPaths: ['ICT Officer', 'Network Administrator', 'Systems Analyst', 'Web Engineer'],
  },
  {
    id: 'mzuni-forestry',
    university: 'MZUNI',
    universityFullName: 'Mzuzu University',
    location: 'Mzuzu',
    faculty: 'Faculty of Environmental Sciences',
    title: 'Bachelor of Science in Forestry and Environmental Management',
    degreeType: 'BSc Forestry',
    duration: '4 Years',
    category: 'agriculture',
    cutoffPoints: 22,
    privateCutoffPoints: 28,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'bio', maxGrade: 5, label: 'Biology (Credit 1-5)' },
      { subjectId: 'geo', maxGrade: 5, label: 'Geography (Credit 1-5)' },
      { subjectId: 'math', maxGrade: 6, label: 'Mathematics (Credit 1-6)' },
    ],
    description: 'Forest conservation, timber management, environmental carbon credits, and national park ecosystems.',
    careerPaths: ['Forestry Officer', 'Environmental Impact Assessor', 'Conservation Ranger'],
  },

  // --- CUNIMA (Catholic University of Malawi) ---
  {
    id: 'cunima-law',
    university: 'CUNIMA',
    universityFullName: 'Catholic University of Malawi',
    location: 'Chiradzulu (Montfort Campus, Nguludi)',
    faculty: 'Faculty of Law',
    title: 'Bachelor of Laws (LLB)',
    degreeType: 'LLB Degree',
    duration: '4 Years',
    category: 'law',
    cutoffPoints: 16,
    privateCutoffPoints: 24,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 4, label: 'English (Credit 1-4)' },
      { subjectId: 'math', maxGrade: 6, label: 'Mathematics (Credit 1-6)' },
    ],
    description: 'High-quality private legal education with strong focus on jurisprudence, commercial litigation, and civil law.',
    careerPaths: ['Legal Counsel', 'Human Rights Advocate', 'Corporate Lawyer'],
  },
  {
    id: 'cunima-nursing',
    university: 'CUNIMA',
    universityFullName: 'Catholic University of Malawi',
    location: 'Chiradzulu',
    faculty: 'Faculty of Nursing and Midwifery',
    title: 'Bachelor of Science in Nursing and Midwifery',
    degreeType: 'BSc Nursing',
    duration: '4 Years',
    category: 'health',
    cutoffPoints: 20,
    privateCutoffPoints: 26,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'bio', maxGrade: 5, label: 'Biology (Credit 1-5)' },
      { subjectId: 'ps', maxGrade: 6, label: 'Physical Science (Credit 1-6)' },
      { subjectId: 'math', maxGrade: 6, label: 'Mathematics (Credit 1-6)' },
    ],
    description: 'Accredited clinical nursing degree recognized by the Nurses and Midwives Council of Malawi (NMCM).',
    careerPaths: ['Registered Nurse', 'Clinic Supervisor', 'Community Health Specialist'],
  },

  // --- MAU (Malawi Adventist University) ---
  {
    id: 'mau-mls',
    university: 'MAU',
    universityFullName: 'Malawi Adventist University',
    location: 'Thyolo (Malamulo Campus)',
    faculty: 'Faculty of Health Sciences',
    title: 'Bachelor of Science in Medical Laboratory Science',
    degreeType: 'BSc MLS',
    duration: '4 Years',
    category: 'health',
    cutoffPoints: 20,
    privateCutoffPoints: 26,
    requiredSubjects: [
      { subjectId: 'eng', maxGrade: 6, label: 'English (Credit 1-6)' },
      { subjectId: 'bio', maxGrade: 4, label: 'Biology (Credit 1-4)' },
      { subjectId: 'ps', maxGrade: 5, label: 'Physical Science (Credit 1-5)' },
      { subjectId: 'math', maxGrade: 6, label: 'Mathematics (Credit 1-6)' },
    ],
    description: 'Medical laboratory pathology at historic Malamulo Hospital training campus.',
    careerPaths: ['Medical Lab Technologist', 'Diagnostic Specialist', 'Hospital Laboratory Manager'],
  }
];

interface MsceCalculatorProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  profile?: any;
  onUpdateProfile?: (p: any) => void;
}

export function MscePointsCalculatorView({ onBack, theme = 'dark', profile, onUpdateProfile }: MsceCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'calculator' | 'directory'>('calculator');
  
  // Default user subjects defaulting to ZERO (0 = unset)
  const [subjects, setSubjects] = useState<SubjectGrade[]>(() => {
    try {
      const saved = localStorage.getItem('mw_user_msce_grades_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'eng', name: 'English (Language & Lit)', shortName: 'English', grade: 0, category: 'core' },
      { id: 'math', name: 'Mathematics', shortName: 'Maths', grade: 0, category: 'core' },
      { id: 'bio', name: 'Biology', shortName: 'Biology', grade: 0, category: 'science' },
      { id: 'ps', name: 'Physical Science (Phys / Chem)', shortName: 'Physical Sci', grade: 0, category: 'science' },
      { id: 'agric', name: 'Agriculture', shortName: 'Agric', grade: 0, category: 'science' },
      { id: 'geo', name: 'Geography', shortName: 'Geography', grade: 0, category: 'humanities' },
      { id: 'hist', name: 'History', shortName: 'History', grade: 0, category: 'humanities' },
      { id: 'chich', name: 'Chichewa', shortName: 'Chichewa', grade: 0, category: 'language' },
    ];
  });

  // Search & Filter state for recommendations and university directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [matchFilter, setMatchFilter] = useState<'all' | 'qualified' | 'competitive'>('all');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Update a single grade
  const updateGrade = (id: string, newGrade: number) => {
    setSubjects(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, grade: newGrade } : s);
      try {
        localStorage.setItem('mw_user_msce_grades_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Reset all grades to zero
  const handleResetAllToZero = () => {
    const zeroed = subjects.map(s => ({ ...s, grade: 0 }));
    setSubjects(zeroed);
    try {
      localStorage.setItem('mw_user_msce_grades_v2', JSON.stringify(zeroed));
    } catch (e) {}
    showToast("All points reset to 0. Select your grades below to calculate.");
  };

  // Add a new subject
  const handleAddSubject = (subjectId: string) => {
    const template = MANEB_SUBJECTS.find(s => s.id === subjectId);
    if (!template) return;
    if (subjects.some(s => s.id === subjectId)) return;
    
    setSubjects(prev => {
      const updated = [...prev, { ...template, grade: 0 }];
      try {
        localStorage.setItem('mw_user_msce_grades_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Remove a subject
  const handleRemoveSubject = (id: string) => {
    if (id === 'eng') {
      showToast("English is mandatory for MANEB calculations.");
      return;
    }
    if (subjects.length <= 6) {
      showToast("An MSCE calculation requires at least 6 subjects.");
      return;
    }
    setSubjects(prev => {
      const updated = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('mw_user_msce_grades_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Preset example loaders
  const loadPreset = (presetType: 'medicine' | 'engineering' | 'law' | 'general') => {
    let preset: SubjectGrade[] = [];
    if (presetType === 'medicine') {
      preset = [
        { id: 'eng', name: 'English (Language & Lit)', shortName: 'English', grade: 2, category: 'core' },
        { id: 'math', name: 'Mathematics', shortName: 'Maths', grade: 2, category: 'core' },
        { id: 'bio', name: 'Biology', shortName: 'Biology', grade: 1, category: 'science' },
        { id: 'ps', name: 'Physical Science (Phys / Chem)', shortName: 'Physical Sci', grade: 1, category: 'science' },
        { id: 'agric', name: 'Agriculture', shortName: 'Agric', grade: 2, category: 'science' },
        { id: 'geo', name: 'Geography', shortName: 'Geography', grade: 2, category: 'humanities' },
        { id: 'chich', name: 'Chichewa', shortName: 'Chichewa', grade: 3, category: 'language' },
        { id: 'hist', name: 'History', shortName: 'History', grade: 3, category: 'humanities' },
      ];
    } else if (presetType === 'engineering') {
      preset = [
        { id: 'eng', name: 'English (Language & Lit)', shortName: 'English', grade: 3, category: 'core' },
        { id: 'math', name: 'Mathematics', shortName: 'Maths', grade: 1, category: 'core' },
        { id: 'ps', name: 'Physical Science (Phys / Chem)', shortName: 'Physical Sci', grade: 2, category: 'science' },
        { id: 'bio', name: 'Biology', shortName: 'Biology', grade: 3, category: 'science' },
        { id: 'agric', name: 'Agriculture', shortName: 'Agric', grade: 3, category: 'science' },
        { id: 'geo', name: 'Geography', shortName: 'Geography', grade: 3, category: 'humanities' },
        { id: 'hist', name: 'History', shortName: 'History', grade: 4, category: 'humanities' },
        { id: 'chich', name: 'Chichewa', shortName: 'Chichewa', grade: 4, category: 'language' },
      ];
    } else if (presetType === 'law') {
      preset = [
        { id: 'eng', name: 'English (Language & Lit)', shortName: 'English', grade: 1, category: 'core' },
        { id: 'hist', name: 'History', shortName: 'History', grade: 2, category: 'humanities' },
        { id: 'geo', name: 'Geography', shortName: 'Geography', grade: 2, category: 'humanities' },
        { id: 'math', name: 'Mathematics', shortName: 'Maths', grade: 3, category: 'core' },
        { id: 'chich', name: 'Chichewa', shortName: 'Chichewa', grade: 2, category: 'language' },
        { id: 'bio', name: 'Biology', shortName: 'Biology', grade: 4, category: 'science' },
        { id: 'agric', name: 'Agriculture', shortName: 'Agric', grade: 3, category: 'science' },
        { id: 'ps', name: 'Physical Science (Phys / Chem)', shortName: 'Physical Sci', grade: 4, category: 'science' },
      ];
    } else {
      preset = [
        { id: 'eng', name: 'English (Language & Lit)', shortName: 'English', grade: 4, category: 'core' },
        { id: 'math', name: 'Mathematics', shortName: 'Maths', grade: 4, category: 'core' },
        { id: 'bio', name: 'Biology', shortName: 'Biology', grade: 3, category: 'science' },
        { id: 'ps', name: 'Physical Science (Phys / Chem)', shortName: 'Physical Sci', grade: 4, category: 'science' },
        { id: 'agric', name: 'Agriculture', shortName: 'Agric', grade: 3, category: 'science' },
        { id: 'geo', name: 'Geography', shortName: 'Geography', grade: 4, category: 'humanities' },
        { id: 'chich', name: 'Chichewa', shortName: 'Chichewa', grade: 4, category: 'language' },
        { id: 'hist', name: 'History', shortName: 'History', grade: 4, category: 'humanities' },
      ];
    }
    setSubjects(preset);
    try {
      localStorage.setItem('mw_user_msce_grades_v2', JSON.stringify(preset));
    } catch (e) {}
    showToast(`Loaded example with ${presetType} grades!`);
  };

  // Calculation Engine: handles 0 (unentered) grades gracefully
  const stats = useMemo(() => {
    // Only consider subjects that have a grade > 0 (1 to 9)
    const validEnteredSubjects = subjects.filter(s => s.grade >= 1 && s.grade <= 9);
    const enteredCount = validEnteredSubjects.length;

    // Check English Status
    const engSubject = subjects.find(s => s.id === 'eng');
    const englishGrade = engSubject ? engSubject.grade : 0;
    const hasEnteredEnglish = englishGrade >= 1 && englishGrade <= 9;
    const hasEnglishCredit = englishGrade >= 1 && englishGrade <= 6;
    const hasEnglishPass = englishGrade >= 1 && englishGrade <= 8;

    // Distinctions, Credits, Passes
    const distinctions = validEnteredSubjects.filter(s => s.grade <= 2).length;
    const credits = validEnteredSubjects.filter(s => s.grade >= 1 && s.grade <= 6).length;
    const passes = validEnteredSubjects.filter(s => s.grade >= 7 && s.grade <= 8).length;
    const fails = validEnteredSubjects.filter(s => s.grade === 9).length;

    // Calculate Best 6 according to MANEB Rules:
    // In Malawi, English is mandatory. Best 6 = English + Top 5 best grades among other subjects.
    let best6List: SubjectGrade[] = [];
    let best6Sum = 0;
    let isComplete = false;

    if (enteredCount >= 6) {
      isComplete = true;
      if (hasEnteredEnglish) {
        const otherSubjects = validEnteredSubjects
          .filter(s => s.id !== 'eng')
          .sort((a, b) => a.grade - b.grade);
        const top5Others = otherSubjects.slice(0, 5);
        best6List = [engSubject!, ...top5Others];
      } else {
        const sorted = [...validEnteredSubjects].sort((a, b) => a.grade - b.grade);
        best6List = sorted.slice(0, 6);
      }
      best6Sum = best6List.reduce((acc, curr) => acc + curr.grade, 0);
    } else if (enteredCount > 0) {
      // Partial points for entered subjects
      const sorted = [...validEnteredSubjects].sort((a, b) => a.grade - b.grade);
      best6List = sorted;
      best6Sum = sorted.reduce((acc, curr) => acc + curr.grade, 0);
    } else {
      best6Sum = 0;
      best6List = [];
    }

    const best6Ids = new Set(best6List.map(s => s.id));

    // Qualification assessment
    const isCertificateQualified = isComplete && hasEnglishPass && credits + passes >= 6;
    const isUniversityEligible = isComplete && hasEnglishCredit && credits >= 6;

    let qualificationTier = 'Awaiting Your Grades';
    let tierColor = 'text-slate-400';
    let tierBadgeBg = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    if (enteredCount === 0) {
      qualificationTier = 'Select your subject grades below';
    } else if (!isComplete) {
      qualificationTier = `Entered ${enteredCount} of 6 required subjects`;
      tierColor = 'text-amber-400';
      tierBadgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else if (best6Sum <= 12 && isUniversityEligible) {
      qualificationTier = 'Elite (Medicine / Top STEM / Law)';
      tierColor = 'text-emerald-400';
      tierBadgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (best6Sum <= 18 && isUniversityEligible) {
      qualificationTier = 'High Competitive (Engineering / Health / BAcc)';
      tierColor = 'text-indigo-400';
      tierBadgeBg = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    } else if (best6Sum <= 26 && isUniversityEligible) {
      qualificationTier = 'Public University Generic Eligible';
      tierColor = 'text-blue-400';
      tierBadgeBg = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    } else if (best6Sum <= 36 && isUniversityEligible) {
      qualificationTier = 'Degree Eligible (Private / Upgrading)';
      tierColor = 'text-amber-400';
      tierBadgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    } else if (isCertificateQualified) {
      qualificationTier = 'MSCE Certificate Pass (Diploma / College)';
      tierColor = 'text-amber-500';
      tierBadgeBg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    } else {
      qualificationTier = 'Below University Entry Threshold';
      tierColor = 'text-red-400';
      tierBadgeBg = 'bg-red-500/10 text-red-400 border-red-500/20';
    }

    const gradesMap: Record<string, number> = {};
    subjects.forEach(s => {
      gradesMap[s.id] = s.grade;
    });

    return {
      enteredCount,
      isComplete,
      best6Sum,
      best6List,
      best6Ids,
      distinctions,
      credits,
      passes,
      fails,
      englishGrade,
      hasEnteredEnglish,
      hasEnglishCredit,
      hasEnglishPass,
      isCertificateQualified,
      isUniversityEligible,
      qualificationTier,
      tierColor,
      tierBadgeBg,
      gradesMap
    };
  }, [subjects]);

  // Program Match Analysis Engine
  const analyzedProgrammes = useMemo(() => {
    return MALAWI_PROGRAMMES.map(prog => {
      if (stats.enteredCount < 6) {
        return {
          ...prog,
          matchStatus: 'pending' as const,
          matchLabel: 'Awaiting Grades',
          matchBadgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          meritQualified: false,
          prerequisitesMet: false,
          missingRequirements: ['Enter your grades to calculate matching']
        };
      }

      // 1. Cutoff Points Check (Malawi: lower points is better)
      const meritQualified = stats.best6Sum <= prog.cutoffPoints;
      const privateQualified = prog.privateCutoffPoints ? stats.best6Sum <= prog.privateCutoffPoints : stats.best6Sum <= prog.cutoffPoints + 6;
      
      // 2. Prerequisite Subject Checks
      let prerequisitesMet = true;
      const missingRequirements: string[] = [];

      prog.requiredSubjects.forEach(req => {
        const studentGrade = stats.gradesMap[req.subjectId];
        if (!studentGrade || studentGrade === 0) {
          prerequisitesMet = false;
          missingRequirements.push(`Subject not entered: ${req.label}`);
        } else if (studentGrade > req.maxGrade) {
          prerequisitesMet = false;
          missingRequirements.push(`Requires ${req.label} (You have: Grade ${studentGrade})`);
        }
      });

      let matchStatus: 'qualified' | 'competitive' | 'missing';
      let matchLabel = '';
      let matchBadgeColor = '';

      if (meritQualified && prerequisitesMet && stats.isUniversityEligible) {
        matchStatus = 'qualified';
        matchLabel = 'High Chance (Merit Selection)';
        matchBadgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      } else if ((privateQualified || (stats.best6Sum <= prog.cutoffPoints + 4)) && prerequisitesMet && stats.hasEnglishCredit) {
        matchStatus = 'competitive';
        matchLabel = 'Competitive / Self-Sponsored';
        matchBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      } else {
        matchStatus = 'missing';
        matchLabel = 'Requirements Not Met';
        matchBadgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
      }

      return {
        ...prog,
        meritQualified,
        privateQualified,
        prerequisitesMet,
        missingRequirements,
        matchStatus,
        matchLabel,
        matchBadgeColor,
      };
    });
  }, [stats]);

  // Filtered recommendations
  const filteredProgrammes = useMemo(() => {
    return analyzedProgrammes.filter(prog => {
      // Match status filter
      if (matchFilter === 'qualified' && prog.matchStatus !== 'qualified') return false;
      if (matchFilter === 'competitive' && prog.matchStatus !== 'competitive') return false;

      // University Filter
      if (selectedUniversity !== 'ALL' && prog.university !== selectedUniversity) return false;

      // Category Filter
      if (selectedCategory !== 'ALL' && prog.category !== selectedCategory) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = prog.title.toLowerCase().includes(q);
        const matchesUni = prog.universityFullName.toLowerCase().includes(q) || prog.university.toLowerCase().includes(q);
        const matchesLocation = prog.location.toLowerCase().includes(q);
        const matchesCareers = prog.careerPaths.some(c => c.toLowerCase().includes(q));
        const matchesFaculty = prog.faculty.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUni && !matchesLocation && !matchesCareers && !matchesFaculty) {
          return false;
        }
      }

      return true;
    });
  }, [analyzedProgrammes, matchFilter, selectedUniversity, selectedCategory, searchQuery]);

  // Copy share report
  const handleCopyReport = () => {
    const qualifiedCount = analyzedProgrammes.filter(p => p.matchStatus === 'qualified').length;
    const competitiveCount = analyzedProgrammes.filter(p => p.matchStatus === 'competitive').length;
    
    const reportText = `🇲🇼 *Educate MW - MSCE Points & University Report*\n\n` +
      `📊 *My Best 6 Points:* ${stats.enteredCount >= 6 ? `${stats.best6Sum} Points` : 'Incomplete'}\n` +
      `🏆 *Distinctions (1-2):* ${stats.distinctions} | *Credits (1-6):* ${stats.credits}\n` +
      `🎯 *English Grade:* ${stats.englishGrade > 0 ? `Grade ${stats.englishGrade}` : 'Not set'}\n` +
      `🎓 *National Status:* ${stats.qualificationTier}\n\n` +
      `✨ *Eligible University Programmes:* ${qualifiedCount} Direct Merit Degrees | ${competitiveCount} Competitive Degrees\n\n` +
      `Calculate your MSCE university points on Educate MW:\nhttps://educatemw.app`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    });
  };

  const getGradePill = (grade: number) => {
    if (grade === 0) return { label: 'Not Set', color: 'bg-slate-800/60 text-slate-400 border-slate-700' };
    if (grade <= 2) return { label: `Distinction (${grade})`, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (grade <= 6) return { label: `Credit (${grade})`, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    if (grade <= 8) return { label: `Pass (${grade})`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { label: `Fail (${grade})`, color: 'bg-red-500/20 text-red-300 border-red-500/40' };
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300 overflow-hidden select-none`}>
      
      {/* Clean Top Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200'} border-b flex items-center justify-between py-3 px-4 md:px-6 shrink-0 z-20 backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className={`w-9 h-9 rounded-xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} flex items-center justify-center transition-transform active:scale-95`}
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className={`text-sm md:text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase flex items-center gap-1.5`}>
              <Calculator size={17} className="text-indigo-500" /> MSCE Points Calculator
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Malawi MANEB Aggregate & University Course Recommender
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAllToZero}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Reset all grades to 0"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset to 0</span>
          </button>

          <button
            onClick={handleCopyReport}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              copiedNotification 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copiedNotification ? <Check size={13} /> : <Share2 size={13} />}
            <span>{copiedNotification ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Toast Warning Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90%] bg-indigo-700 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold"
          >
            <Info size={16} className="shrink-0 text-indigo-200" />
            <span className="flex-1">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <Check size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Sub-Tabs */}
      <div className={`px-4 md:px-6 pt-2.5 pb-2 shrink-0 border-b ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-slate-200'} flex items-center gap-2 overflow-x-auto hide-scrollbar`}>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'calculator'
              ? 'bg-indigo-600 text-white shadow-sm'
              : theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator size={14} />
          <span>Calculator & Matches</span>
          {stats.enteredCount >= 6 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/20 text-white">
              {stats.best6Sum} pts
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 size={14} />
          <span>Malawi Universities Explorer</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 md:px-6 py-5 pb-24">
        
        {/* ================= TAB 1: CALCULATOR & RECOMMENDATIONS ================= */}
        {activeTab === 'calculator' && (
          <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
            
            {/* Friendly Hero Summary Card */}
            <div className={`p-5 md:p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                
                {/* Score Number + Status */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 border ${
                    stats.enteredCount >= 6 
                      ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' 
                      : 'bg-slate-800/40 border-slate-700 text-slate-400'
                  }`}>
                    <span className="text-3xl md:text-4xl font-black font-mono leading-none">
                      {stats.enteredCount >= 6 ? stats.best6Sum : stats.enteredCount > 0 ? stats.best6Sum : 0}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider mt-1 text-slate-400">
                      {stats.enteredCount >= 6 ? 'Best 6 Pts' : stats.enteredCount > 0 ? `${stats.enteredCount}/6 Added` : 'Points'}
                    </span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stats.tierBadgeBg}`}>
                      {stats.qualificationTier}
                    </span>
                    <h2 className={`text-base md:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {stats.enteredCount === 0 
                        ? 'Select your subject grades below'
                        : stats.enteredCount < 6 
                          ? `Add ${6 - stats.enteredCount} more subject(s) to finish`
                          : `MSCE Aggregate: ${stats.best6Sum} Points`}
                    </h2>
                    <p className="text-xs text-slate-400 leading-snug">
                      {stats.enteredCount === 0 
                        ? 'All values default to 0. Tap a grade (1 to 9) on your subjects below to calculate your points.'
                        : 'In Malawi, lower points are better (1 = Distinction, 6 = Credit, 9 = Fail). English + 5 best subjects make your aggregate.'}
                    </p>
                  </div>
                </div>

                {/* Score Metrics Pills */}
                <div className="grid grid-cols-3 gap-2 w-full md:w-auto shrink-0 text-center">
                  <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{stats.distinctions}</div>
                    <div className="text-[9px] text-slate-400 font-medium">Distinctions (1-2)</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-lg font-bold text-indigo-400 font-mono">{stats.credits}</div>
                    <div className="text-[9px] text-slate-400 font-medium">Credits (1-6)</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`text-lg font-bold font-mono ${stats.hasEnglishCredit ? 'text-emerald-400' : stats.englishGrade > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {stats.englishGrade > 0 ? stats.englishGrade : '--'}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">English Grade</div>
                  </div>
                </div>

              </div>

              {/* Quick Example Presets bar */}
              <div className="mt-4 pt-3.5 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Try quick examples:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => loadPreset('medicine')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all ${
                      theme === 'dark' ? 'bg-gray-800/80 hover:bg-gray-700 border-gray-700 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    10 pts (Medicine)
                  </button>
                  <button
                    onClick={() => loadPreset('engineering')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all ${
                      theme === 'dark' ? 'bg-gray-800/80 hover:bg-gray-700 border-gray-700 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    14 pts (Engineering)
                  </button>
                  <button
                    onClick={() => loadPreset('law')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all ${
                      theme === 'dark' ? 'bg-gray-800/80 hover:bg-gray-700 border-gray-700 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    12 pts (Law)
                  </button>
                  <button
                    onClick={() => loadPreset('general')}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all ${
                      theme === 'dark' ? 'bg-gray-800/80 hover:bg-gray-700 border-gray-700 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    22 pts (General)
                  </button>
                </div>
              </div>
            </div>

            {/* Subject Grade Inputs Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                  Your Subjects ({subjects.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  {stats.enteredCount >= 6 ? '⭐ = Best 6 Subject' : 'Select grades 1 (best) to 9 (fail)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {subjects.map((sub) => {
                  const isBest6 = stats.best6Ids.has(sub.id) && sub.grade > 0;
                  const pill = getGradePill(sub.grade);

                  return (
                    <div 
                      key={sub.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isBest6
                          ? theme === 'dark'
                            ? 'bg-indigo-950/20 border-indigo-500/40' 
                            : 'bg-indigo-50/60 border-indigo-300'
                          : theme === 'dark'
                            ? 'bg-gray-900/60 border-gray-800' 
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs md:text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {sub.name}
                          </h4>
                          {isBest6 && (
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-md shrink-0">
                              Best 6
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {sub.id === 'eng' ? 'Mandatory for MSCE' : sub.category}
                        </p>
                      </div>

                      {/* Grade Selector Dropdown */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={sub.grade}
                          onChange={(e) => updateGrade(sub.id, Number(e.target.value))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer outline-none transition-all ${
                            sub.grade === 0 
                              ? theme === 'dark' ? 'bg-gray-950 border-gray-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                              : pill.color
                          }`}
                        >
                          <option value={0} className="bg-gray-900 text-slate-300">0 (Not Set)</option>
                          <option value={1} className="bg-gray-900 text-emerald-300">Grade 1 (Distinction)</option>
                          <option value={2} className="bg-gray-900 text-emerald-300">Grade 2 (Distinction)</option>
                          <option value={3} className="bg-gray-900 text-indigo-300">Grade 3 (Credit)</option>
                          <option value={4} className="bg-gray-900 text-indigo-300">Grade 4 (Credit)</option>
                          <option value={5} className="bg-gray-900 text-indigo-300">Grade 5 (Credit)</option>
                          <option value={6} className="bg-gray-900 text-indigo-300">Grade 6 (Credit)</option>
                          <option value={7} className="bg-gray-900 text-amber-300">Grade 7 (Pass)</option>
                          <option value={8} className="bg-gray-900 text-amber-300">Grade 8 (Pass)</option>
                          <option value={9} className="bg-gray-900 text-red-300">Grade 9 (Fail)</option>
                        </select>

                        {sub.id !== 'eng' && (
                          <button
                            onClick={() => handleRemoveSubject(sub.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            title="Remove subject"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Additional Subject Row */}
              {MANEB_SUBJECTS.some(ms => !subjects.some(s => s.id === ms.id)) && (
                <div className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-slate-100 border-slate-200'} flex flex-col sm:flex-row items-center justify-between gap-2.5 mt-2`}>
                  <span className="text-xs font-medium text-slate-400">
                    Need to add Computer Studies, Accounting, French, etc.?
                  </span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSubject(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="" disabled>+ Add Another Subject...</option>
                    {MANEB_SUBJECTS.filter(ms => !subjects.some(s => s.id === ms.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* University Recommendations Section */}
            <div className="pt-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    University Course Matches ({filteredProgrammes.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    {stats.enteredCount >= 6 
                      ? `Based on your aggregate of ${stats.best6Sum} points and subject grades`
                      : 'Showing course admission requirements. Enter your points above to see your exact eligibility!'}
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setMatchFilter('all')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                      matchFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : theme === 'dark' ? 'bg-gray-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    All Courses
                  </button>
                  {stats.enteredCount >= 6 && (
                    <>
                      <button
                        onClick={() => setMatchFilter('qualified')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                          matchFilter === 'qualified'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        Qualified ({analyzedProgrammes.filter(p => p.matchStatus === 'qualified').length})
                      </button>
                      <button
                        onClick={() => setMatchFilter('competitive')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                          matchFilter === 'competitive'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        Competitive ({analyzedProgrammes.filter(p => p.matchStatus === 'competitive').length})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Search & University Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search degrees (e.g. Nursing, Law)..."
                    className="bg-transparent text-xs font-medium outline-none w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                      <XCircle size={13} />
                    </button>
                  )}
                </div>

                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="ALL">All Universities (Public & Private)</option>
                  <option value="KUHeS">KUHeS (Kamuzu University of Health Sciences)</option>
                  <option value="MUST">MUST (Malawi Univ of Science & Tech)</option>
                  <option value="MUBAS">MUBAS (Business & Engineering)</option>
                  <option value="UNIMA">UNIMA (Chancellor College)</option>
                  <option value="LUANAR">LUANAR (Agriculture & Vet Med)</option>
                  <option value="MZUNI">MZUNI (Mzuzu University)</option>
                  <option value="CUNIMA">CUNIMA (Catholic University)</option>
                  <option value="MAU">MAU (Malawi Adventist University)</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="ALL">All Fields of Study</option>
                  <option value="health">Medicine & Health Sciences</option>
                  <option value="engineering">Engineering & Computer Tech</option>
                  <option value="business">Business & Accountancy</option>
                  <option value="law">Law & Legal Studies</option>
                  <option value="agriculture">Agriculture & Environment</option>
                  <option value="science">Pure & Applied Science</option>
                  <option value="education">Education</option>
                </select>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {filteredProgrammes.map((prog) => (
                  <div
                    key={prog.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      prog.matchStatus === 'qualified'
                        ? theme === 'dark' ? 'bg-gray-900/90 border-emerald-500/30' : 'bg-white border-emerald-300 shadow-sm'
                        : prog.matchStatus === 'competitive'
                          ? theme === 'dark' ? 'bg-gray-900/80 border-amber-500/30' : 'bg-white border-amber-300 shadow-sm'
                          : theme === 'dark' ? 'bg-gray-900/40 border-gray-800 opacity-80' : 'bg-slate-50 border-slate-200 opacity-85'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${prog.matchBadgeColor}`}>
                          {prog.matchLabel}
                        </span>

                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Cutoff: ≤ {prog.cutoffPoints} pts
                        </span>
                      </div>

                      {/* University & Degree Title */}
                      <div className="mb-1.5">
                        <div className="text-[10.5px] text-indigo-400 font-bold uppercase tracking-wider">
                          {prog.university} • <span className="text-slate-400 font-medium">{prog.location}</span>
                        </div>
                        <h4 className={`text-sm font-bold mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {prog.title}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {prog.degreeType} ({prog.duration})
                        </p>
                      </div>

                      {/* Brief description */}
                      <p className="text-xs text-slate-400 line-clamp-2 my-2">
                        {prog.description}
                      </p>

                      {/* Prerequisites Pills */}
                      <div className={`p-2.5 rounded-xl border my-2 ${
                        theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div className="text-[9.5px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                          <span>Required Subject Grades:</span>
                          {stats.enteredCount >= 6 && (
                            <span className={prog.prerequisitesMet ? 'text-emerald-400' : 'text-amber-400'}>
                              {prog.prerequisitesMet ? '✅ Requirements Met' : '⚠️ Missing Grades'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {prog.requiredSubjects.map((req, rIdx) => {
                            const userG = stats.gradesMap[req.subjectId];
                            const isMet = userG > 0 && userG <= req.maxGrade;
                            return (
                              <span
                                key={rIdx}
                                className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-medium border ${
                                  userG > 0 
                                    ? isMet 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                                }`}
                              >
                                {req.label} {userG > 0 ? `(You: ${userG})` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Careers Footer */}
                    <div className="pt-2 border-t border-gray-800/40 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate flex items-center gap-1">
                        <Briefcase size={11} className="text-indigo-400 shrink-0" />
                        {prog.careerPaths.slice(0, 2).join(', ')}
                      </span>
                      <span className="text-indigo-400 font-bold shrink-0 ml-2">
                        {prog.faculty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: MALAWI UNIVERSITIES EXPLORER ================= */}
        {activeTab === 'directory' && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
            
            <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Building2 size={16} /> Accredited Higher Education Institutions in Malawi
              </div>
              <h2 className={`text-base md:text-lg font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Public & Private Universities Directory (NCHE Accredited)
              </h2>
              <p className="text-xs text-slate-400">
                Explore campus locations, flagship programmes, and official university admission portals.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  code: 'UNIMA',
                  name: 'University of Malawi',
                  campuses: 'Chancellor College (Zomba)',
                  type: 'Public University',
                  est: '1964',
                  strengths: 'Law (LLB), Economics, Social Sciences, Pure Sciences, Education',
                  website: 'unima.ac.mw'
                },
                {
                  code: 'KUHeS',
                  name: 'Kamuzu University of Health Sciences',
                  campuses: 'Mahatma Gandhi Campus (Blantyre) & KCN (Lilongwe)',
                  type: 'Public Medical University',
                  est: '2021 (College of Medicine & KCN)',
                  strengths: 'Medicine (MBBS), Pharmacy, Dental Surgery, Nursing & Midwifery, MLS',
                  website: 'kuhes.ac.mw'
                },
                {
                  code: 'MUST',
                  name: 'Malawi University of Science and Technology',
                  campuses: 'Goliati Campus (Thyolo)',
                  type: 'Public Technological University',
                  est: '2014',
                  strengths: 'Biomedical Eng, Chemical Eng, Cybersecurity, Petroleum Geoscience',
                  website: 'must.ac.mw'
                },
                {
                  code: 'MUBAS',
                  name: 'Malawi University of Business and Applied Sciences',
                  campuses: 'Chichiri Campus (Blantyre)',
                  type: 'Public Business & Engineering University',
                  est: '2021 (The Polytechnic)',
                  strengths: 'Civil/Electrical/Mechanical Eng, Computer Science, Accountancy (BAcc), BBA',
                  website: 'mubas.ac.mw'
                },
                {
                  code: 'LUANAR',
                  name: 'Lilongwe University of Agriculture and Natural Resources',
                  campuses: 'Bunda & NRC (Lilongwe)',
                  type: 'Public Agricultural University',
                  est: '2011',
                  strengths: 'Veterinary Medicine (DVM), Agribusiness, Agricultural Eng, Food Science',
                  website: 'luanar.ac.mw'
                },
                {
                  code: 'MZUNI',
                  name: 'Mzuzu University',
                  campuses: 'Luwinga (Mzuzu)',
                  type: 'Public University',
                  est: '1997',
                  strengths: 'Optometry (OD), ICT, Land Surveying, Renewable Energy, Forestry',
                  website: 'mzuni.ac.mw'
                },
                {
                  code: 'CUNIMA',
                  name: 'Catholic University of Malawi',
                  campuses: 'Montfort Campus (Nguludi, Chiradzulu)',
                  type: 'Private Accredited University',
                  est: '2006',
                  strengths: 'Law (LLB), Nursing & Midwifery, Commerce, Special Education',
                  website: 'cunima.ac.mw'
                },
                {
                  code: 'MAU',
                  name: 'Malawi Adventist University',
                  campuses: 'Malamulo (Makwasa, Thyolo) & Lakeview (Dedza)',
                  type: 'Private Medical & Business University',
                  est: '1902 / 2006',
                  strengths: 'Medical Laboratory Science, Nursing & Public Health, Business Admin',
                  website: 'mau.ac.mw'
                }
              ].map((uni, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border ${
                    theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {uni.code}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {uni.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {uni.campuses}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 self-start sm:self-auto">
                      {uni.type}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl border my-2 text-xs ${
                    theme === 'dark' ? 'bg-gray-950/40 border-gray-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <span className="text-slate-400 font-semibold">Flagship Programmes: </span>
                    {uni.strengths}
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span>Est: {uni.est}</span>
                    <span className="text-indigo-400 font-medium">
                      {uni.website}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
