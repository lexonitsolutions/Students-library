export interface IndianCourseConfig {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly durationYears: number;
  readonly years: string[];
  readonly branches: {
    readonly id: string;
    readonly name: string;
    readonly subjects: string[];
  }[];
}

export const INDIAN_COURSES: IndianCourseConfig[] = [
  {
    id: 'engineering',
    name: 'Engineering & Technology (B.Tech / B.E.)',
    shortName: 'Engineering',
    durationYears: 4,
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    branches: [
      {
        id: 'cse',
        name: 'Computer Science & Engineering (CSE)',
        subjects: [
          'Data Structures & Algorithms',
          'Database Management Systems (DBMS)',
          'Operating Systems',
          'Computer Networks',
          'Object Oriented Programming (Java/C++)',
          'Discrete Mathematics',
          'Computer Organization & Architecture',
          'Theory of Computation',
          'Compiler Design',
          'Software Engineering',
          'Web Technologies',
          'Artificial Intelligence',
          'Machine Learning',
          'Cloud Computing',
          'Cyber Security',
          'Engineering Mathematics',
          'Engineering Physics',
        ],
      },
      {
        id: 'aiml',
        name: 'Artificial Intelligence & Machine Learning (AI & ML)',
        subjects: [
          'Machine Learning',
          'Deep Learning',
          'Artificial Intelligence',
          'Data Structures & Algorithms',
          'Python for Data Science',
          'Probability & Statistics',
          'Natural Language Processing (NLP)',
          'Computer Vision',
          'Operating Systems',
          'Database Management Systems (DBMS)',
          'Computer Networks',
          'Big Data Analytics',
          'Neural Networks',
        ],
      },
      {
        id: 'ds',
        name: 'Data Science (CSE-DS)',
        subjects: [
          'Data Analysis & Visualization',
          'Statistical Methods for Data Science',
          'Data Structures & Algorithms',
          'Database Management Systems (DBMS)',
          'Machine Learning',
          'Big Data Technologies',
          'Data Mining & Warehousing',
          'Python Programming',
          'Operating Systems',
          'Business Analytics',
        ],
      },
      {
        id: 'it',
        name: 'Information Technology (IT)',
        subjects: [
          'Web Technologies',
          'Database Management Systems (DBMS)',
          'Computer Networks',
          'Information Security',
          'Cloud Computing',
          'Object Oriented Programming',
          'Software Engineering',
          'Data Structures & Algorithms',
          'Mobile Application Development',
          'Operating Systems',
        ],
      },
      {
        id: 'ece',
        name: 'Electronics & Communication Engineering (ECE)',
        subjects: [
          'Digital Electronics',
          'Signals & Systems',
          'Analog Electronic Circuits',
          'Microprocessors & Microcontrollers',
          'Electromagnetic Waves & Transmission Lines',
          'VLSI Design',
          'Control Systems',
          'Digital Signal Processing (DSP)',
          'Communication Systems',
          'Embedded Systems',
          'Antenna & Microwave Engineering',
        ],
      },
      {
        id: 'eee',
        name: 'Electrical & Electronics Engineering (EEE)',
        subjects: [
          'Electrical Circuit Analysis',
          'Electrical Machines',
          'Power Systems',
          'Control Systems',
          'Power Electronics',
          'Transmission & Distribution',
          'Measurements & Instrumentation',
          'Renewable Energy Systems',
          'High Voltage Engineering',
          'Microcontrollers',
        ],
      },
      {
        id: 'mech',
        name: 'Mechanical Engineering (ME)',
        subjects: [
          'Engineering Thermodynamics',
          'Fluid Mechanics & Machinery',
          'Strength of Materials',
          'Theory of Machines',
          'Manufacturing Technology',
          'Heat & Mass Transfer',
          'Machine Design',
          'CAD / CAM / CIM',
          'Automobile Engineering',
          'Refrigeration & Air Conditioning',
        ],
      },
      {
        id: 'civil',
        name: 'Civil Engineering (CE)',
        subjects: [
          'Structural Analysis',
          'Building Materials & Construction',
          'Surveying & Geomatics',
          'Fluid Mechanics & Hydraulics',
          'Geotechnical & Soil Mechanics',
          'Transportation Engineering',
          'Environmental Engineering',
          'Concrete Technology',
          'Design of Steel Structures',
          'Hydrology & Water Resources',
        ],
      },
      {
        id: 'chem',
        name: 'Chemical Engineering',
        subjects: [
          'Chemical Process Calculations',
          'Fluid Flow Operations',
          'Heat Transfer Operations',
          'Mass Transfer Operations',
          'Chemical Reaction Engineering',
          'Chemical Engineering Thermodynamics',
          'Process Dynamics & Control',
          'Petroleum Refining',
        ],
      },
      {
        id: 'biotech',
        name: 'Biotechnology Engineering',
        subjects: [
          'Biochemistry',
          'Microbiology',
          'Cell Biology & Genetics',
          'Molecular Biology',
          'Bioprocess Engineering',
          'Genetic Engineering',
          'Bioinformatics',
          'Immunology',
        ],
      },
    ],
  },
  {
    id: 'degree_science',
    name: 'Degree - Science & Computer Applications (BCA / B.Sc)',
    shortName: 'Science & BCA',
    durationYears: 3,
    years: ['1st Year', '2nd Year', '3rd Year'],
    branches: [
      {
        id: 'bca',
        name: 'BCA (Bachelor of Computer Applications)',
        subjects: [
          'Computer Fundamentals & Office Tools',
          'Programming in C',
          'Data Structures using C/C++',
          'Object Oriented Programming with C++',
          'Java Programming',
          'Database Management Systems',
          'Web Development (HTML/CSS/JS)',
          'Operating Systems',
          'Computer Networks',
          'Software Engineering',
          'Python Programming',
          'E-Commerce & Digital Marketing',
        ],
      },
      {
        id: 'bsc_cs',
        name: 'B.Sc Computer Science',
        subjects: [
          'Programming in C & C++',
          'Data Structures',
          'Java & Web Technologies',
          'Database Systems',
          'Discrete Mathematics',
          'Computer Architecture',
          'Operating Systems',
          'Software Testing',
          'Python for Computing',
        ],
      },
      {
        id: 'bsc_math',
        name: 'B.Sc Mathematics',
        subjects: [
          'Calculus & Analytical Geometry',
          'Differential Equations',
          'Linear Algebra',
          'Real Analysis',
          'Abstract Algebra',
          'Complex Analysis',
          'Numerical Analysis',
          'Probability & Statistics',
          'Operations Research',
        ],
      },
      {
        id: 'bsc_phy',
        name: 'B.Sc Physics',
        subjects: [
          'Mechanics & Relativity',
          'Thermal Physics',
          'Electricity & Magnetism',
          'Optics & Waves',
          'Quantum Mechanics',
          'Atomic & Nuclear Physics',
          'Solid State Physics',
          'Electronics',
        ],
      },
      {
        id: 'bsc_chem',
        name: 'B.Sc Chemistry',
        subjects: [
          'Inorganic Chemistry',
          'Organic Chemistry',
          'Physical Chemistry',
          'Analytical Chemistry',
          'Biochemistry',
          'Industrial Chemistry',
          'Polymer Chemistry',
        ],
      },
    ],
  },
  {
    id: 'degree_commerce',
    name: 'Commerce & Management (B.Com / BBA / BMS)',
    shortName: 'Commerce & Management',
    durationYears: 3,
    years: ['1st Year', '2nd Year', '3rd Year'],
    branches: [
      {
        id: 'bcom_general',
        name: 'B.Com (General & Honours)',
        subjects: [
          'Financial Accounting',
          'Business Organization & Management',
          'Business Law',
          'Business Economics / Microeconomics',
          'Corporate Accounting',
          'Cost Accounting',
          'Business Statistics & Mathematics',
          'Income Tax Law & Practice',
          'Auditing & Corporate Governance',
          'Goods & Services Tax (GST)',
          'Financial Management',
          'Banking & Insurance Operations',
        ],
      },
      {
        id: 'bcom_comp',
        name: 'B.Com (Computer Applications)',
        subjects: [
          'Financial Accounting',
          'Computer Applications in Business',
          'Tally ERP & Accounting Software',
          'Business Law',
          'E-Commerce & Digital Payments',
          'Corporate Accounting',
          'Database Management Systems',
          'Income Tax & GST',
          'Web Technologies',
        ],
      },
      {
        id: 'bba',
        name: 'BBA (Bachelor of Business Administration)',
        subjects: [
          'Principles of Management',
          'Business Economics',
          'Financial Accounting & Analysis',
          'Marketing Management',
          'Human Resource Management (HRM)',
          'Organizational Behavior',
          'Financial Management',
          'Business Research Methods',
          'Operations & Supply Chain Management',
          'Strategic Management',
          'Entrepreneurship Development',
        ],
      },
    ],
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy (B.Pharm)',
    shortName: 'Pharmacy',
    durationYears: 4,
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    branches: [
      {
        id: 'bpharm',
        name: 'B.Pharmacy (Bachelor of Pharmacy)',
        subjects: [
          'Human Anatomy and Physiology',
          'Pharmaceutical Analysis',
          'Pharmaceutics',
          'Pharmaceutical Inorganic Chemistry',
          'Pharmaceutical Organic Chemistry',
          'Biochemistry',
          'Pathophysiology',
          'Physical Pharmaceutics',
          'Pharmaceutical Microbiology',
          'Pharmacology',
          'Medicinal Chemistry',
          'Pharmacognosy & Phytochemistry',
          'Industrial Pharmacy',
          'Biopharmaceutics & Pharmacokinetics',
          'Hospital & Clinical Pharmacy',
        ],
      },
    ],
  },
  {
    id: 'medical_allied',
    name: 'Medical & Allied Health Sciences',
    shortName: 'Medical & Allied',
    durationYears: 4,
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    branches: [
      {
        id: 'nursing',
        name: 'B.Sc Nursing',
        subjects: [
          'Anatomy & Physiology',
          'Nutrition & Biochemistry',
          'Nursing Foundations',
          'Psychology',
          'Microbiology',
          'Medical Surgical Nursing',
          'Pharmacology, Pathology & Genetics',
          'Community Health Nursing',
          'Child Health Nursing (Paediatrics)',
          'Mental Health Nursing',
          'Midwifery & Obstetrical Nursing',
        ],
      },
      {
        id: 'physio',
        name: 'B.P.T (Bachelor of Physiotherapy)',
        subjects: [
          'Human Anatomy',
          'Human Physiology',
          'Basic Biochemistry',
          'Biomechanics & Kinesiology',
          'Exercise Therapy',
          'Electrotherapy',
          'General Pathology & Microbiology',
          'Pharmacology',
          'Clinical Orthopaedics',
          'Neurology & Neurosurgery',
          'Cardiopulmonary Conditions',
          'Rehabilitation Medicine',
        ],
      },
      {
        id: 'mlt',
        name: 'B.Sc Medical Laboratory Technology (MLT)',
        subjects: [
          'Human Anatomy & Physiology',
          'Clinical Biochemistry',
          'Haematology & Blood Banking',
          'Clinical Pathology',
          'Medical Microbiology',
          'Immunology & Serology',
          'Histopathology & Cytology',
        ],
      },
    ],
  },
  {
    id: 'law',
    name: 'Law (LL.B / Integrated Law)',
    shortName: 'Law',
    durationYears: 5,
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
    branches: [
      {
        id: 'ba_llb',
        name: '5-Year Integrated B.A. LL.B',
        subjects: [
          'Constitutional Law',
          'Law of Torts & Consumer Protection',
          'Law of Contract',
          'Family Law (Hindu & Muslim Law)',
          'Criminal Law (IPC / BNS)',
          'Legal Methods & Legal Reasoning',
          'Jurisprudence (Legal Theory)',
          'Property Law & Easements',
          'Administrative Law',
          'Company Law & Corporate Governance',
          'Public International Law',
          'Code of Civil Procedure (CPC)',
          'Code of Criminal Procedure (CrPC)',
          'Law of Evidence',
          'Labour & Industrial Law',
          'Intellectual Property Rights (IPR)',
          'Environmental Law',
        ],
      },
      {
        id: 'bba_llb',
        name: '5-Year Integrated B.B.A. LL.B',
        subjects: [
          'Constitutional Law',
          'Law of Contract & Specific Relief',
          'Corporate Law & Securities Regulation',
          'Law of Torts',
          'Criminal Law',
          'Banking & Insurance Law',
          'Competition Law',
          'Taxation Law (Direct & Indirect)',
          'Civil Procedure Code',
          'Intellectual Property Rights (IPR)',
          'Arbitration & Dispute Resolution (ADR)',
        ],
      },
      {
        id: 'llb_3yr',
        name: '3-Year LL.B',
        subjects: [
          'Constitutional Law',
          'Law of Contracts',
          'Law of Crimes',
          'Law of Torts',
          'Family Law',
          'Jurisprudence',
          'Property Law',
          'Company Law',
          'Administrative Law',
          'Code of Civil Procedure',
          'Code of Criminal Procedure',
          'Law of Evidence',
        ],
      },
    ],
  },
  {
    id: 'arts',
    name: 'Arts & Humanities (B.A.)',
    shortName: 'Arts & Humanities',
    durationYears: 3,
    years: ['1st Year', '2nd Year', '3rd Year'],
    branches: [
      {
        id: 'ba_econ',
        name: 'B.A. Economics',
        subjects: [
          'Introductory Microeconomics',
          'Introductory Macroeconomics',
          'Mathematical Methods for Economics',
          'Statistical Methods for Economics',
          'Intermediate Microeconomics',
          'Intermediate Macroeconomics',
          'Indian Economy',
          'Development Economics',
          'Public Finance',
          'International Trade',
        ],
      },
      {
        id: 'ba_eng',
        name: 'B.A. English Literature',
        subjects: [
          'Indian Classical Literature',
          'European Classical Literature',
          'British Poetry & Drama',
          'American Literature',
          'Postcolonial Literatures',
          'Literary Theory & Criticism',
          'Academic Writing & Composition',
          'Linguistics & Phonetics',
        ],
      },
      {
        id: 'ba_pol',
        name: 'B.A. Political Science',
        subjects: [
          'Understanding Political Theory',
          'Constitutional Government and Democracy in India',
          'Political Theory - Concepts & Debates',
          'Political Process in India',
          'Introduction to Comparative Government & Politics',
          'Perspectives on Public Administration',
          'Global Politics / International Relations',
          'Indian Political Thought',
        ],
      },
    ],
  },
];

/** Helper to retrieve a course config by id or name */
export function findIndianCourse(courseIdOrName?: string | null): IndianCourseConfig | undefined {
  if (!courseIdOrName) return undefined;
  const query = courseIdOrName.trim().toLowerCase();
  return INDIAN_COURSES.find(
    (c) =>
      c.id.toLowerCase() === query ||
      c.name.toLowerCase().includes(query) ||
      c.shortName.toLowerCase() === query
  );
}

/** Helper to retrieve branches for a given course */
export function getBranchesForCourse(courseIdOrName?: string | null) {
  const course = findIndianCourse(courseIdOrName);
  return course ? course.branches : INDIAN_COURSES[0].branches;
}

/** Helper to retrieve dynamic study years for a given course */
export function getStudyYearsForCourse(courseIdOrName?: string | null) {
  const course = findIndianCourse(courseIdOrName);
  return course ? course.years : INDIAN_COURSES[0].years;
}

/** Helper to retrieve recommended subjects based on course and branch */
export function getSubjectsForBranch(courseIdOrName?: string | null, branchIdOrName?: string | null): string[] {
  const course = findIndianCourse(courseIdOrName) || INDIAN_COURSES[0];
  if (!branchIdOrName) {
    const all = course.branches.flatMap((b) => b.subjects);
    return Array.from(new Set(all));
  }
  const branchLower = branchIdOrName.toLowerCase();
  const matchedBranch = course.branches.find(
    (b) => b.id.toLowerCase() === branchLower || b.name.toLowerCase().includes(branchLower)
  );
  if (matchedBranch) {
    return matchedBranch.subjects;
  }
  const all = course.branches.flatMap((b) => b.subjects);
  return Array.from(new Set(all));
}
