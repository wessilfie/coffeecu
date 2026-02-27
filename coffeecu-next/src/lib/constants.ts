// ============================================================
// Coffee@CU — Constants
// Ported from client/user/user.js in the original Meteor app
// ============================================================

export const DAILY_REQUEST_LIMIT = parseInt(
  process.env.DAILY_REQUEST_LIMIT ?? '3',
  10
);

// Grouped by undergrad vs. graduate/professional
export const SCHOOL_GROUPS = [
  {
    label: 'Undergraduate',
    schools: [
      { value: 'CC',   label: 'Columbia College' },
      { value: 'SEAS', label: 'Fu Foundation School of Engineering & Applied Science' },
      { value: 'GS',   label: 'School of General Studies' },
      { value: 'BC',   label: 'Barnard College' },
    ],
  },
  {
    label: 'Graduate & Professional',
    schools: [
      { value: 'GSAS',  label: 'Graduate School of Arts & Sciences' },
      { value: 'BUS',   label: 'Columbia Business School' },
      { value: 'LAW',   label: 'Columbia Law School' },
      { value: 'VPS',   label: 'Vagelos College of Physicians & Surgeons' },
      { value: 'JRN',   label: 'Columbia Journalism School' },
      { value: 'SIPA',  label: 'School of International & Public Affairs' },
      { value: 'GSAPP', label: 'Graduate School of Architecture, Planning & Preservation' },
      { value: 'SOA',   label: 'School of the Arts' },
      { value: 'SW',    label: 'School of Social Work' },
      { value: 'PH',    label: 'Mailman School of Public Health' },
      { value: 'NRS',   label: 'School of Nursing' },
      { value: 'DM',    label: 'College of Dental Medicine' },
      { value: 'SPS',   label: 'School of Professional Studies' },
      { value: 'CS',    label: 'Columbia Climate School' },
      { value: 'TC',    label: 'Teachers College' },
    ],
  },
] as const;

// Flat list for filters, badges, etc.
export const SCHOOLS: { value: string; label: string }[] = SCHOOL_GROUPS.flatMap(g => g.schools as unknown as { value: string; label: string }[]);

// Set of undergrad school codes — used to show context-aware year options
export const UNDERGRAD_SCHOOL_CODES = new Set(['CC', 'SEAS', 'GS', 'BC']);

export const UNDERGRAD_YEARS = [
  "First Year",
  "Sophomore",
  "Junior",
  "Senior",
  "Alumnus",
  "Faculty/Professor",
] as const;

export const GRAD_YEARS = [
  "Year 1",
  "Year 2",
  "Year 3+",
  "Alumnus",
  "Faculty/Professor",
] as const;

// Full list used for the home filter (covers all possible values)
export const YEARS = [
  "First Year",
  "Sophomore",
  "Junior",
  "Senior",
  "Year 1",
  "Year 2",
  "Year 3+",
  "Alumnus",
  "Faculty/Professor",
] as const;

// Degree programs grouped by level
export const DEGREE_GROUPS = [
  {
    label: 'Undergraduate',
    degrees: [
      { value: 'AB',    label: 'AB — Bachelor of Arts' },
      { value: 'BS',    label: 'BS — Bachelor of Science' },
      { value: 'BFA',   label: 'BFA — Fine Arts' },
      { value: 'BArch', label: 'BArch — Architecture' },
    ],
  },
  {
    label: 'Graduate & Professional',
    degrees: [
      { value: 'MA',    label: 'MA — Master of Arts' },
      { value: 'MS',    label: 'MS — Master of Science' },
      { value: 'MPhil', label: 'MPhil — Master of Philosophy' },
      { value: 'PhD',   label: 'PhD — Doctor of Philosophy' },
      { value: 'MBA',   label: 'MBA — Business Administration' },
      { value: 'EMBA',  label: 'EMBA — Executive MBA' },
      { value: 'MFA',   label: 'MFA — Fine Arts' },
      { value: 'MArch', label: 'MArch — Architecture' },
      { value: 'MPA',   label: 'MPA — Public Administration' },
      { value: 'MIA',   label: 'MIA — International Affairs' },
      { value: 'MAIA',  label: 'MAIA — International Affairs' },
      { value: 'MSW',   label: 'MSW — Social Work' },
      { value: 'MPH',   label: 'MPH — Public Health' },
      { value: 'JD',    label: 'JD — Juris Doctor' },
      { value: 'LLM',   label: 'LLM — Master of Laws' },
      { value: 'JSD',   label: 'JSD — Doctor of Laws' },
      { value: 'MD',    label: 'MD — Medicine' },
      { value: 'DDS',   label: 'DDS — Dental Surgery' },
      { value: 'DNP',   label: 'DNP — Nursing Practice' },
      { value: 'EdM',   label: 'EdM — Master of Education' },
      { value: 'EdD',   label: 'EdD — Doctor of Education' },
      { value: 'DrPH',  label: 'DrPH — Doctor of Public Health' },
    ],
  },
] as const;

export const DEGREES: { value: string; label: string }[] = DEGREE_GROUPS.flatMap(g => g.degrees as unknown as { value: string; label: string }[]);

// University domain configuration
// Mirrors the university_domains table in Supabase
// Also used for client-side UX feedback before API call
export const UNIVERSITY_DOMAINS: Record<string, string[]> = {
  columbia: ['columbia.edu', 'barnard.edu'],
  // future: yale: ['yale.edu'],
};

export function isAllowedDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return Object.values(UNIVERSITY_DOMAINS).flat().includes(domain);
}

export function getUniversityFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase();
  for (const [university, domains] of Object.entries(UNIVERSITY_DOMAINS)) {
    if (domains.includes(domain)) return university;
  }
  return 'columbia';
}

// Derive uni (email prefix) server-side from verified email
export function getUniFromEmail(email: string): string {
  return email.split('@')[0].toLowerCase();
}

// Social link domain allowlists (security: prevent javascript: URLs)
export const SOCIAL_DOMAINS: Record<string, string[]> = {
  twitter: ['twitter.com', 'x.com'],
  facebook: ['facebook.com', 'fb.com'],
  linkedin: ['linkedin.com'],
  instagram: ['instagram.com'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  website: [], // any https:// domain
};

export const PARALLAX_IMAGES = [
  'A','B','C','D','E','F','G','H','I','J',
  'K','M','N','O','P','Q','R','S','T',
]; // excludes L (matches existing assets)

export const COFFEE_QUESTION =
  "What's the best way to grab coffee (or tea) with you?";

export const PROFILE_QUESTIONS = [
  "What's something you've recently changed your mind about?",
  "Where on campus do you go to think clearly?",
  "What's a topic you could talk about for 20 minutes with zero prep?",
  "What's a problem people tend to come to you for?",
  "What's a small obsession you have right now?",
  "When do you feel most like yourself?",
  "What are you quietly trying to get better at this semester?",
] as const;

export const MAJORS = [
  "African American and African Diaspora Studies",
  "African Studies",
  "American Studies",
  "Ancient Studies",
  "Anthropology",
  "Applied Mathematics",
  "Applied Physics",
  "Architecture",
  "Art History",
  "Astronomy",
  "Astrophysics",
  "Biochemistry",
  "Biological Sciences",
  "Biomedical Engineering",
  "Biophysics",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Classical Studies",
  "Classics",
  "Climate Systems Science",
  "Cognitive Science",
  "Columbia College",
  "Communication",
  "Comparative Literature",
  "Comparative Literature and Society",
  "Computer Engineering",
  "Computer Science",
  "Creative Writing",
  "Dance",
  "Data Science",
  "Dramatic Arts",
  "Earth and Environmental Sciences",
  "East Asian Languages and Cultures",
  "East Asian Regional Studies",
  "Economics",
  "Economics - Political Science",
  "Education",
  "Electrical Engineering",
  "English and Comparative Literature",
  "Environmental Biology",
  "Environmental Chemistry",
  "Environmental Engineering",
  "Environmental Science",
  "Film",
  "Film Studies",
  "Financial Economics",
  "French",
  "French and Romance Philology",
  "Gender Studies",
  "Germanic Languages",
  "History",
  "Human Rights",
  "Industrial Engineering and Operations Research",
  "Italian",
  "Italian Studies",
  "Jewish Studies",
  "Journalism",
  "Latin American and Iberian Cultures",
  "Latin American Studies",
  "Linguistics",
  "Mathematics",
  "Mathematics-Computer Science",
  "Mathematics-Statistics",
  "Medieval and Renaissance Studies",
  "Mechanical Engineering",
  "Middle Eastern, South Asian, and African Studies",
  "Music",
  "Neuroscience",
  "Operations Research",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Public Health",
  "Religion",
  "Russian, Eurasian, and East European Studies",
  "Slavic Languages",
  "Social Work",
  "Sociology",
  "South Asian Studies",
  "Spanish",
  "Statistics",
  "Statistics and Mathematics",
  "Sustainable Development",
  "Theatre",
  "Urban Studies",
  "Visual Arts",
  "Women's, Gender, and Sexuality Studies",
  "Other",
];
