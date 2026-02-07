// Minimal gloss/key → sequence mapper for the SignAvatar
// Expanded with normalization + phrase dictionary. Replace with HamNoSys/SiGML later.
import dict from './dictionary.json';

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replaceAll(/[^a-z0-9\s']/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function longestPhraseMatch(tokens, start) {
  for (let len = Math.min(6, tokens.length - start); len > 0; len--) {
    const phrase = tokens.slice(start, start + len).join(' ');
    const entry = dict[phrase];
    if (entry) return { len, entry };
  }
  return null;
}

// Map high-level keys used across the app to avatar sequences
export function keyToSequence(key) {
  const k = String(key || '').toLowerCase();
  switch (k) {
    case 'welcome':
      return { sequence: [{ handshape: 'neutral' }] };
    case 'presencerecorded':
      return { sequence: [{ handshape: 'present' }] };
    case 'confirmprofile':
      return { sequence: [{ handshape: 'ok' }] };
    default:
      return { sequence: [{ handshape: 'neutral' }] };
  }
}

// Map free-form gloss text to a simple sequence
export function glossToSequence(text) {
  const norm = normalize(text);
  if (!norm) return { sequence: [] };
  const tokens = norm.split(' ');
  const actions = [];
  let i = 0;
  while (i < tokens.length) {
    const match = longestPhraseMatch(tokens, i);
    if (match) {
      actions.push(...(match.entry.actions || []));
      i += match.len;
    } else {
      const w = tokens[i];
      if (w.includes('ok')) actions.push({ handshape: 'ok' });
      else if (w.includes('present')) actions.push({ handshape: 'present' });
      else if (w.includes('absent')) actions.push({ handshape: 'absent' });
      else actions.push({ handshape: 'neutral' });
      i += 1;
    }
  }
  return { sequence: actions };
}

// Provide a suggestion for a free-form phrase
export function suggestForText(text) {
  const t = String(text || '').toLowerCase();
  const mapping = glossToSequence(t);
  const handshape = mapping.sequence?.[0]?.handshape || 'neutral';
  return {
    recognized: handshape,
    sequence: mapping.sequence,
  };
}
