import { useEffect, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';
import { normalizePhraseExact } from '../sign/signLanguageLibrary';

// Globally shows a small floating button near selected text to open sign-language video.
function SignSelectionHelper() {
  const { prefs } = usePreferences();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const btnRef = useRef(null);

  useEffect(() => {
    const onMouseUp = () => {
      const sel = globalThis.getSelection?.();
      const str = sel ? normalizePhraseExact(sel.toString()) : '';
      if (!str) { setVisible(false); return; }
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      const rect = range ? range.getBoundingClientRect() : null;
      if (!rect) { setVisible(false); return; }
      setText(str);
      setPos({ x: rect.right + 8 + window.scrollX, y: rect.bottom + window.scrollY });
      setVisible(true);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  if (!prefs.signVideosUnlocked) return null;
  if (!visible) return null;
  return (
    <button
      ref={btnRef}
      onClick={() => {
        globalThis.openSignLanguage?.(text);
        setVisible(false);
      }}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 2000,
        padding: '6px 10px',
        borderRadius: 8,
        background: 'var(--color-primary-dark)',
        color: '#fff',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
      }}
      aria-label="Voir cette phrase en langue des signes"
    >Voir en signes</button>
  );
}

export default SignSelectionHelper;
