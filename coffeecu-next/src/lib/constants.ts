// ============================================================
// Coffee@CU — Constants
// Ported from client/user/user.js in the original Meteor app
// ============================================================

export const DAILY_REQUEST_LIMIT = parseInt(
  process.env.DAILY_REQUEST_LIMIT ?? '3',
  10
);

export const SCHOOLS = [
  { value: 'CC',   label: "Columbia College" },
  { value: 'SEAS', label: "Engineering (SEAS)" },
  { value: 'GS',   label: "General Studies" },
  { value: 'BC',   label: "Barnard College" },
  { value: 'GR',   label: "Graduate School" },
] as const;

export const YEARS = [
  "First Year",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate Student",
  "Alumnus",
  "Faculty/Professor",
] as const;

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
  website: [], // any https:// domain
};

export const PARALLAX_IMAGES = [
  'A','B','C','D','E','F','G','H','I','J',
  'K','M','N','O','P','Q','R','S','T',
]; // excludes L (matches existing assets)

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
