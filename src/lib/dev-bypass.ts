// ============================================================
// Dev bypass — fake auth + mock data for local testing
// Activated by DEV_BYPASS=true in local .env
// ============================================================

import type { Profile, FullProfile, DraftProfile } from '@/types';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const serverBypass = process.env.DEV_BYPASS === 'true';
const legacyClientBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

if (nodeEnv === 'production' && (serverBypass || legacyClientBypass)) {
  throw new Error('DEV_BYPASS and NEXT_PUBLIC_DEV_BYPASS must be false in production.');
}

// Keep temporary backward compatibility with NEXT_PUBLIC_DEV_BYPASS in non-production.
export const DEV_BYPASS = serverBypass || (nodeEnv !== 'production' && legacyClientBypass);

export const DEV_USER = {
  id: 'dev-user-000',
  email: 'dev@columbia.edu',
};

const now = new Date().toISOString();

export const DEV_MOCK_PROFILES: Profile[] = [
  {
    id: '1', user_id: 'u1', name: 'Amara Okafor', uni: 'ao1234', university: 'columbia',
    school: 'CC', year: 'Junior', degree: 'BA', major: ['Computer Science', 'Philosophy'], clubs: ['Black Business Student Association'],
    pronouns: 'she/her',
    responses: [
      { question: "What's a topic you could talk about for 20 minutes with zero prep?", answer: 'AI ethics and what we lose when we treat machines as moral agents — I could go forever on this.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Weekday afternoons at Butler or Riverside. I like long walks too if the weather cooperates.' },
    ],
    linkedin: 'https://linkedin.com/in/amaraokafor', instagram: 'https://instagram.com/ao.writes',
    twitter: null, facebook: null, youtube: null, tiktok: null, website: null,
    image_url: 'https://i.pravatar.cc/300?img=47', is_public: true, random_sort: 0.1, created_at: now, updated_at: now,
  },
  {
    id: '2', user_id: 'u2', name: 'Marco Reyes', uni: 'mr5678', university: 'columbia',
    school: 'SEAS', year: 'Senior', degree: 'BS', major: ['Mechanical Engineering'], clubs: ['Columbia Basketball Club'],
    pronouns: 'he/him',
    responses: [
      { question: "What's a small obsession you have right now?", answer: 'Vertical-axis wind turbines — I\'m convinced they\'re underrated for urban environments and I can\'t stop reading about them.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Weekends near campus or a quick walk around the quad. Love meeting new people over food too.' },
    ],
    linkedin: 'https://linkedin.com/in/marcoreyes-eng', website: 'https://marcoreyes.me',
    twitter: null, facebook: null, instagram: null, youtube: null, tiktok: null,
    image_url: 'https://i.pravatar.cc/300?img=11', is_public: true, random_sort: 0.2, created_at: now, updated_at: now,
  },
  {
    id: '3', user_id: 'u3', name: 'Priya Shankar', uni: 'ps9012', university: 'columbia',
    school: 'GSAS', year: 'Year 3+', degree: 'PhD', major: ['Economics'], clubs: ['AI in Business Initiative', 'Asian Business Association'],
    pronouns: 'she/they',
    responses: [
      { question: "What's something you've recently changed your mind about?", answer: 'I used to think randomized control trials were the gold standard for everything. Development work has complicated that view significantly.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Flexible — just message me. I\'m usually around campus and love a break from writing.' },
    ],
    twitter: 'https://twitter.com/priya_econ', linkedin: 'https://linkedin.com/in/priyashankar',
    facebook: null, instagram: null, youtube: null, tiktok: null, website: null,
    image_url: 'https://i.pravatar.cc/300?img=5', is_public: true, random_sort: 0.3, created_at: now, updated_at: now,
  },
  {
    id: '4', user_id: 'u4', name: 'Jake Thornton', uni: 'jt3456', university: 'columbia',
    school: 'CC', year: 'Sophomore', degree: 'BA', major: ['History', 'Political Science'], clubs: [],
    pronouns: 'he/him',
    responses: [
      { question: "What's a problem people tend to come to you for?", answer: 'Research rabbit holes — if you need to trace an event back to its roots or find primary sources, I\'m your person.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Tuesday or Thursday mornings before 11am. Butler café or somewhere quiet nearby.' },
    ],
    twitter: null, facebook: null, linkedin: null, instagram: null, youtube: null, tiktok: null, website: null,
    image_url: 'https://i.pravatar.cc/300?img=12', is_public: true, random_sort: 0.4, created_at: now, updated_at: now,
  },
  {
    id: '5', user_id: 'u5', name: 'Lena Dubois', uni: 'ld7890', university: 'columbia',
    school: 'BC', year: 'Senior', degree: 'BA', major: ['Comparative Literature'], clubs: [],
    pronouns: 'she/her',
    responses: [
      { question: "Where on campus do you go to think clearly?", answer: 'The steps behind Low Library around 7am, before anyone else shows up. Or the Barnard library when I need to actually write.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Most afternoons work. I\'m particular about coffee so let me pick the spot — promise it\'ll be worth it.' },
    ],
    instagram: 'https://instagram.com/lenadubois.writes', tiktok: 'https://tiktok.com/@lenadubois',
    twitter: null, facebook: null, linkedin: null, youtube: null, website: null,
    image_url: 'https://i.pravatar.cc/300?img=9', is_public: true, random_sort: 0.5, created_at: now, updated_at: now,
  },
  {
    id: '6', user_id: 'u6', name: 'David Kim', uni: 'dk2345', university: 'columbia',
    school: 'SEAS', year: 'First Year', degree: 'BS', major: ['Computer Science'], clubs: [],
    pronouns: 'he/him',
    responses: [
      { question: "What are you quietly trying to get better at this semester?", answer: 'Actually asking for help. I keep trying to figure everything out alone and it\'s making me slower than I need to be.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Evenings after 6pm work best. I\'m usually in the dorm area — anywhere nearby is easy.' },
    ],
    twitter: null, facebook: null, linkedin: null, instagram: null, youtube: null, tiktok: null, website: null,
    image_url: 'https://i.pravatar.cc/300?img=60', is_public: true, random_sort: 0.6, created_at: now, updated_at: now,
  },
  {
    id: '7', user_id: 'u7', name: 'Sofia Alvarez', uni: 'sa6789', university: 'columbia',
    school: 'GS', year: 'Junior', degree: 'BA', major: ['Art History'], clubs: [],
    pronouns: 'she/her',
    responses: [
      { question: "When do you feel most like yourself?", answer: 'In a museum on a Tuesday morning when it\'s nearly empty. Or making something with my hands — ceramics, mostly.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Weekday mornings are ideal. I have more energy before noon and love a slow start to the day.' },
    ],
    instagram: 'https://instagram.com/sofiaalvarez.art', website: 'https://sofiaalvarez.com',
    linkedin: 'https://linkedin.com/in/sofiaalvarez',
    twitter: null, facebook: null, youtube: null, tiktok: null,
    image_url: 'https://i.pravatar.cc/300?img=32', is_public: true, random_sort: 0.7, created_at: now, updated_at: now,
  },
  {
    id: '8', user_id: 'u8', name: 'Prof. James Wright', uni: 'jw0001', university: 'columbia',
    school: 'CC', year: 'Faculty/Professor', degree: null, major: ['Physics'], clubs: [],
    pronouns: 'he/him',
    responses: [
      { question: "What's a topic you could talk about for 20 minutes with zero prep?", answer: 'The philosophical implications of quantum entanglement. Not the physics — the question of what it means for locality and causation.' },
      { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Office hours Wednesdays 2–4pm, or email me to set something up. I genuinely like meeting students.' },
    ],
    linkedin: 'https://linkedin.com/in/jameswrightphysics',
    website: 'https://columbia.edu/~jwright',
    twitter: null, facebook: null, instagram: null, youtube: null, tiktok: null,
    image_url: 'https://i.pravatar.cc/300?img=68', is_public: true, random_sort: 0.8, created_at: now, updated_at: now,
  },
];

export const DEV_MOCK_FULL_PROFILE: FullProfile = {
  id: 'dev-profile',
  user_id: DEV_USER.id,
  name: 'Dev User',
  uni: 'dev',
  university: 'columbia',
  school: 'CC',
  year: 'Junior',
  degree: null,
  major: ['Computer Science'],
  clubs: [],
  pronouns: 'they/them',
  responses: [
    { question: "What's a small obsession you have right now?", answer: 'This is a dev mode profile for testing the UI. Nothing to see here but valid mock data.' },
    { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Always available in dev mode — just open the app and pretend to schedule something.' },
  ],
  twitter: null,
  facebook: null,
  linkedin: null,
  instagram: null,
  youtube: null,
  tiktok: null,
  website: null,
  image_url: '/img/parallax/A.jpg',
  is_public: true,
  random_sort: 0,
  created_at: now,
  updated_at: now,
  email: DEV_USER.email,
  phone: null,
  is_visible: true,
};

export const DEV_MOCK_DRAFT: DraftProfile = {
  id: 'dev-draft',
  user_id: DEV_USER.id,
  name: 'Dev User',
  uni: 'dev',
  university: 'columbia',
  email: DEV_USER.email,
  phone: null,
  school: 'CC',
  year: 'Junior',
  degree: null,
  major: ['Computer Science'],
  clubs: [],
  pronouns: 'they/them',
  responses: [
    { question: "What are you quietly trying to get better at this semester?", answer: 'Testing React components without breaking everything. Dev mode makes this a bit easier though.' },
    { question: "What's the best way to grab coffee (or tea) with you?", answer: 'Whenever you need to test the profile form. I\'m always here in dev mode.' },
  ],
  twitter: null,
  facebook: null,
  linkedin: null,
  instagram: null,
  youtube: null,
  tiktok: null,
  website: null,
  image_url: null,
  is_public: false,
  updated_at: now,
};
