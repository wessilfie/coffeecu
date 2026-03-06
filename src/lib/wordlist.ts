/**
 * Content moderation wordlist for profile text scanning.
 *
 * Adapted from LDNOOBW (github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
 * Curated for a university professional-networking context.
 *
 * All terms are matched with \b word-boundary regex so substrings don't trigger:
 *   "ass" will NOT match "class", "assessment", "harass"
 *   "fag" will NOT match "fagot" (bundle of sticks)
 *   "anal" will NOT match "analytical"
 *
 * Known acceptable false positives (mods should dismiss):
 *   "cum" → "cum laude"
 *   "dick" → given name "Dick"
 *   "homo" → "homo sapiens"
 *   "tit" → "title", "titmouse" (word boundary prevents "title" ✓)
 */

export const FLAGGED_TERMS: readonly string[] = [
  // ——— Profanity ———
  'ass',
  'asshole',
  'asswipe',
  'bastard',
  'bitch',
  'bullshit',
  'cock',
  'crap',
  'cunt',
  'damn',
  'dick',
  'dickhead',
  'fuck',
  'fucker',
  'fuckers',
  'fucking',
  'fucks',
  'motherfucker',
  'motherfucking',
  'piss',
  'pissed',
  'prick',
  'shit',
  'shits',
  'shitty',
  'twat',
  'wank',
  'wanker',

  // ——— Sexual / explicit ———
  'anal',
  'anus',
  'arse',
  'ballsack',
  'blowjob',
  'boner',
  'boobs',
  'buttplug',
  'cum',
  'dildo',
  'ejaculate',
  'erection',
  'foreskin',
  'gangbang',
  'handjob',
  'horny',
  'jizz',
  'masturbate',
  'masturbation',
  'milf',
  'nutsack',
  'orgasm',
  'orgy',
  'penis',
  'porn',
  'porno',
  'pornography',
  'prostitute',
  'pussy',
  'rape',
  'rectum',
  'rimjob',
  'rimming',
  'scrotum',
  'semen',
  'slut',
  'slutty',
  'smegma',
  'spunk',
  'testicle',
  'tit',
  'tits',
  'titties',
  'vagina',
  'vibrator',
  'vulva',
  'whore',

  // ——— Slurs ———
  'chink',
  'coon',
  'cracker',
  'dyke',
  'fag',
  'faggot',
  'gook',
  'homo',
  'kike',
  'nigga',
  'nigger',
  'paki',
  'retard',
  'retarded',
  'spic',
  'tranny',
  'wetback',

  // ——— Threats ———
  'kill yourself',
  'kys',
];
