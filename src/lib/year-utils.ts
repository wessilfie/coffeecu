import { UNDERGRAD_SCHOOL_CODES } from './constants';

/**
 * Derives the display label for a profile's year/standing.
 *
 * Priority:
 *   1. Admin-assigned designation ('faculty' | 'staff') always wins.
 *   2. Stored graduation year (e.g. "2026") → derive class standing.
 *   3. Backward compat: if stored value is an old label ("Junior"), return it unchanged.
 *
 * Academic year boundary: June.
 *   Before June  → current academic year ends this spring (academicEndYear = currentYear)
 *   June onwards → new academic year started, ends next spring (academicEndYear = currentYear + 1)
 */
export function deriveYearLabel(
  year: string | null,
  school: string | null,
  designation?: string | null,
): string | null {
  if (designation === 'faculty') return 'Faculty';
  if (designation === 'staff') return 'Staff';
  if (!year) return null;

  const gradYear = parseInt(year, 10);
  // Backward compat: not a 4-digit year → return stored label unchanged
  if (isNaN(gradYear) || gradYear < 2000 || gradYear > 2100) return year;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const academicEndYear = currentMonth >= 6 ? currentYear + 1 : currentYear;

  if (gradYear < academicEndYear) return 'Alum';

  const yearsLeft = gradYear - academicEndYear;
  const isUndergrad = !!school && UNDERGRAD_SCHOOL_CODES.has(school);

  if (isUndergrad) {
    switch (yearsLeft) {
      case 0: return 'Senior';
      case 1: return 'Junior';
      case 2: return 'Sophomore';
      case 3: return 'First Year';
      default: return `Class of ${gradYear}`;
    }
  }

  // CBS MBA is a 2-year program — derive Year 1 / Year 2
  if (school === 'BUS') {
    if (yearsLeft === 0) return 'Year 2';
    return 'Year 1';
  }

  // All other grad programs: show class year
  return `Class of ${gradYear}`;
}

/**
 * Generates selectable graduation years for the profile form.
 * Past 3 years (recent alums who haven't updated) through 8 years out.
 */
export function generateGradYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 3; y <= currentYear + 8; y++) {
    years.push(y);
  }
  return years;
}
