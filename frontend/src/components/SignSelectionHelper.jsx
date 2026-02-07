import { useEffect, useRef, useState } from 'react';

// Globally shows a small floating button near selected text to open the sign controls
function SignSelectionHelper() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('');
  const btnRef = useRef(null);

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection && window.getSelection();
      const str = sel ? String(sel.toString()).trim() : '';
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

  if (!visible) return null;
  return (
    <button
      ref={btnRef}
      onClick={() => { globalThis.openSignControls?.(text); setVisible(false); }}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 2000,
        padding: '6px 10px',
        borderRadius: 8,
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
      }}
      aria-label="Voir cette phrase en langue des signes"
    >Voir en signes</button>
  );
}

export default SignSelectionHelper;
