import { FLAGGED_TERMS } from './wordlist';
import type { FullProfile } from '@/types';

export interface ContentFlag {
  field: string;
  term: string;
  snippet: string;
}

export interface FlaggedProfileData {
  profile: FullProfile;
  flags: ContentFlag[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pre-compile all term regexes once at module load time
const COMPILED = FLAGGED_TERMS.map(term => ({
  term,
  regex: new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi'),
}));

function getSnippet(text: string, index: number, matchLen: number, radius = 50): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + matchLen + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function scanText(text: string, fieldLabel: string): ContentFlag[] {
  const flags: ContentFlag[] = [];
  for (const { term, regex } of COMPILED) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match) {
      flags.push({
        field: fieldLabel,
        term,
        snippet: getSnippet(text, match.index, match[0].length),
      });
    }
  }
  return flags;
}

export function scanProfile(profile: FullProfile): ContentFlag[] {
  const flags: ContentFlag[] = [];

  if (profile.name) {
    flags.push(...scanText(profile.name, 'name'));
  }

  if (profile.responses?.length) {
    for (const r of profile.responses) {
      if (r.answer) {
        flags.push(...scanText(r.answer, `"${r.question}"`));
      }
    }
  }

  return flags;
}
