// ============================================================
// Dev bypass — fake auth + mock data for local testing
// Activated by NEXT_PUBLIC_DEV_BYPASS=true in .env.local
// ============================================================

import type { Profile, FullProfile, DraftProfile } from '@/types';

export const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';

export const DEV_USER = {
  id: 'dev-user-000',
  email: 'dev@columbia.edu',
};

const now = new Date().toISOString();

export const DEV_MOCK_PROFILES: Profile[] = [
  {
    id: '1', user_id: 'u1', name: 'Amara Okafor', uni: 'ao1234', university: 'columbia',
    school: 'CC', year: 'Junior', major: ['Computer Science', 'Philosophy'],
    pronouns: 'she/her', about: 'Interested in AI ethics, jazz piano, and long walks through Riverside Park.',
    likes: 'Jazz, philosophy podcasts, rock climbing', contact_for: 'AI ethics, study groups, hackathons',
    availability: 'Weekday afternoons', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/A.jpg', is_public: true, random_sort: 0.1, created_at: now, updated_at: now,
  },
  {
    id: '2', user_id: 'u2', name: 'Marco Reyes', uni: 'mr5678', university: 'columbia',
    school: 'SEAS', year: 'Senior', major: ['Mechanical Engineering'],
    pronouns: 'he/him', about: 'Building sustainable energy solutions. Also a huge foodie.',
    likes: 'Cooking, sustainability, basketball', contact_for: 'Energy tech, grad school advice',
    availability: 'Weekends', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/B.jpg', is_public: true, random_sort: 0.2, created_at: now, updated_at: now,
  },
  {
    id: '3', user_id: 'u3', name: 'Priya Shankar', uni: 'ps9012', university: 'columbia',
    school: 'GR', year: 'Graduate Student', major: ['Economics'],
    pronouns: 'she/they', about: 'PhD candidate studying development economics in South Asia.',
    likes: 'Board games, hiking, Tamil cinema', contact_for: 'Research collaboration, mentoring undergrads',
    availability: 'Flexible — just message me', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/C.jpg', is_public: true, random_sort: 0.3, created_at: now, updated_at: now,
  },
  {
    id: '4', user_id: 'u4', name: 'Jake Thornton', uni: 'jt3456', university: 'columbia',
    school: 'CC', year: 'Sophomore', major: ['History', 'Political Science'],
    pronouns: 'he/him', about: 'History nerd. Working on a documentary about Columbia\'s protest history.',
    likes: 'Documentaries, debate, running', contact_for: 'Journalism, campus history, documentary projects',
    availability: 'Tue/Thu mornings', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/D.jpg', is_public: true, random_sort: 0.4, created_at: now, updated_at: now,
  },
  {
    id: '5', user_id: 'u5', name: 'Lena Dubois', uni: 'ld7890', university: 'columbia',
    school: 'BC', year: 'Senior', major: ['Comparative Literature'],
    pronouns: 'she/her', about: 'Trilingual writer. Barnard \'26. Obsessed with translation theory.',
    likes: 'Poetry, language exchange, coffee (obviously)', contact_for: 'Creative writing, French lit, publishing',
    availability: 'Most afternoons', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/E.jpg', is_public: true, random_sort: 0.5, created_at: now, updated_at: now,
  },
  {
    id: '6', user_id: 'u6', name: 'David Kim', uni: 'dk2345', university: 'columbia',
    school: 'SEAS', year: 'First Year', major: ['Computer Science'],
    pronouns: 'he/him', about: 'Freshman trying to figure out CS vs. pre-med. Love playing guitar.',
    likes: 'Guitar, anime, pickup soccer', contact_for: 'Freshman advice, CS study groups',
    availability: 'Evenings after 6pm', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/F.jpg', is_public: true, random_sort: 0.6, created_at: now, updated_at: now,
  },
  {
    id: '7', user_id: 'u7', name: 'Sofia Alvarez', uni: 'sa6789', university: 'columbia',
    school: 'GS', year: 'Junior', major: ['Art History'],
    pronouns: 'she/her', about: 'Non-trad student. Spent 4 years working in galleries before GS.',
    likes: 'Museums, ceramics, mezcal', contact_for: 'Art world careers, non-trad student life',
    availability: 'Weekday mornings', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/G.jpg', is_public: true, random_sort: 0.7, created_at: now, updated_at: now,
  },
  {
    id: '8', user_id: 'u8', name: 'Prof. James Wright', uni: 'jw0001', university: 'columbia',
    school: 'CC', year: 'Faculty/Professor', major: ['Physics'],
    pronouns: 'he/him', about: 'Teaching intro physics. Happy to chat with students about research or grad school.',
    likes: 'Astrophotography, crosswords, jazz', contact_for: 'Physics research, grad school applications, office hours chat',
    availability: 'Office hours: Wed 2-4pm', twitter: null, facebook: null, linkedin: null, website: null,
    image_url: '/img/parallax/H.jpg', is_public: true, random_sort: 0.8, created_at: now, updated_at: now,
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
  major: ['Computer Science'],
  pronouns: 'they/them',
  about: 'This is a dev mode profile for testing the UI.',
  likes: 'Coffee, code, testing',
  contact_for: 'Testing the app',
  availability: 'Always available (dev mode)',
  twitter: null,
  facebook: null,
  linkedin: null,
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
  major: ['Computer Science'],
  pronouns: 'they/them',
  about: 'This is a dev mode profile for testing the UI.',
  likes: 'Coffee, code, testing',
  contact_for: 'Testing the app',
  availability: 'Always available (dev mode)',
  twitter: null,
  facebook: null,
  linkedin: null,
  website: null,
  image_url: null,
  is_public: false,
  updated_at: now,
};
