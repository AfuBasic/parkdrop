import { normalizePhone } from '@/offline/helpers/phoneNormalizer';
import type { QueryType } from './package-search-types';

// ParkDrop canonical ambiguity-safe alphabet, excluding 0, O, 1, I, L
const SAFE_ALPHABET_SET = new Set('23456789ABCDEFGHJKMNPQRSTUVWXYZ');

export interface ClassifiedQuery {
  type: QueryType;
  raw: string;
  normalized: string;
  phoneNormalized?: string;
  tokens: string[];
}

/**
 * Classifies an attendant's typed input to determine the optimal search strategy.
 * Does not silently rewrite ambiguous characters (e.g. O -> 0 or I -> 1).
 */
export function classifyQuery(rawQuery: string): ClassifiedQuery {
  const trimmed = rawQuery.trim();

  if (!trimmed) {
    return {
      type: 'EMPTY',
      raw: rawQuery,
      normalized: '',
      tokens: [],
    };
  }

  // 1. PUBLIC_PACKAGE_ID
  // Matches "PD-XXXXX" or "pd-xxxxx", or partial public ID starting with "PD-"
  const upperTrimmed = trimmed.toUpperCase();
  if (upperTrimmed.startsWith('PD-')) {
    return {
      type: 'PUBLIC_PACKAGE_ID',
      raw: rawQuery,
      normalized: upperTrimmed,
      tokens: [upperTrimmed],
    };
  }

  // 2. PICKUP_CODE
  // Strip whitespace if the attendant typed spaces between letters (e.g. "7 K 4 P 2 M X")
  const compactCandidate = upperTrimmed.replace(/\s+/g, '');
  const isAllSafeChars = compactCandidate.split('').every(ch => SAFE_ALPHABET_SET.has(ch));

  // A pickup code is 7 characters in the safe alphabet (or candidate range 6-8 without dashes)
  if (isAllSafeChars && compactCandidate.length >= 6 && compactCandidate.length <= 8 && !compactCandidate.includes('-')) {
    return {
      type: 'PICKUP_CODE',
      raw: rawQuery,
      normalized: compactCandidate,
      tokens: [compactCandidate],
    };
  }

  // 3. PHONE
  // Check if string could be a phone number: contains digits, possibly '+', '-', ' '
  const digitsOnly = trimmed.replace(/[^\d+]/g, '');
  if (digitsOnly.length >= 7) {
    const phoneNorm = normalizePhone(trimmed);
    if (phoneNorm) {
      return {
        type: 'PHONE',
        raw: rawQuery,
        normalized: digitsOnly,
        phoneNormalized: phoneNorm,
        tokens: [phoneNorm, digitsOnly],
      };
    }
  }

  // 4. NAME_OR_TEXT (Default)
  // Collapse repeated whitespaces, case-fold for search tokens
  const collapsed = trimmed.replace(/\s+/g, ' ');
  const normalizedTokens = collapsed
    .toLowerCase()
    .split(' ')
    .filter(t => t.length > 0);

  return {
    type: 'NAME_OR_TEXT',
    raw: rawQuery,
    normalized: collapsed.toLowerCase(),
    tokens: normalizedTokens,
  };
}
