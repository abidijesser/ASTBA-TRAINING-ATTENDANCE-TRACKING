// Minimal gloss/key → sequence mapper for the SignAvatar
// This is a pragmatic placeholder. Expand with HamNoSys/SiGML later.

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
  const t = String(text || '').toLowerCase();
  // Basic keyword detection; extend with domain phrases as needed
  if (!t.trim()) return { sequence: [] };

  const seq = [];
  // Prioritize explicit commands/keywords
  if (t.includes('ok')) {
    seq.push({ handshape: 'ok' });
  } else if (t.includes('présent') || t.includes('present')) {
    seq.push({ handshape: 'present' });
  } else if (t.includes('absent')) {
    seq.push({ handshape: 'absent' });
  } else {
    seq.push({ handshape: 'neutral' });
  }
  return { sequence: seq };
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
