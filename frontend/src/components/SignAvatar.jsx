import { useEffect, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';
import { glossToSequence, keyToSequence } from '../sign/lexicon';

// Lightweight 3D avatar scaffold using Three.js
// API: globalThis.playSignAvatar(key), globalThis.playSiGML(si), globalThis.playGlossText(text)
// This is a minimal POC: simple rig with arms + hand; gestures are simplified

function SignAvatar() {
  const { prefs } = usePreferences();
  const mountRef = useRef(null);
  const threeRef = useRef(null);
  const sceneRef = useRef(null);
  const camRef = useRef(null);
  const rendererRef = useRef(null);
  const rigRef = useRef({});
  const animQueueRef = useRef([]);
  const playingRef = useRef(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controlsText, setControlsText] = useState('');

  // Lazy-load Three.js to avoid hard dependency at build time
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const THREE = await import('three');
        if (disposed) return;
        threeRef.current = THREE;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1117); // dark slate for contrast
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 1.3, 3.2);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        const mount = mountRef.current;
        if (!mount) return;
        renderer.setPixelRatio(globalThis.devicePixelRatio || 1);
        const w = mount.clientWidth || 280;
        const h = mount.clientHeight || 220;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        camera.lookAt(new THREE.Vector3(0, 0.9, 0));
        renderer.domElement.style.display = 'block';
        mount.appendChild(renderer.domElement);

        // Lights
        const key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(2, 2, 2);
        scene.add(key);
        const fill = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(fill);

        // Simple rig: torso + arms + hands
        const torso = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.8, 0.3),
          new THREE.MeshStandardMaterial({ color: 0x64748b }) // gray 500 for visibility
        );
        torso.position.set(0, 0.9, 0);
        scene.add(torso);

        const leftUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x60a5fa }));
        leftUpper.position.set(-0.35, 1.2, 0);
        leftUpper.rotation.z = Math.PI / 4;
        scene.add(leftUpper);

        const leftLower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 16), new THREE.MeshStandardMaterial({ color: 0x60a5fa }));
        leftLower.position.set(-0.55, 0.95, 0);
        leftLower.rotation.z = Math.PI / 3;
        scene.add(leftLower);

        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
        leftHand.position.set(-0.75, 0.78, 0);
        scene.add(leftHand);

        const rightUpper = leftUpper.clone();
        rightUpper.position.set(0.35, 1.2, 0);
        rightUpper.rotation.z = -Math.PI / 4;
        scene.add(rightUpper);
        const rightLower = leftLower.clone();
        rightLower.position.set(0.55, 0.95, 0);
        rightLower.rotation.z = -Math.PI / 3;
        scene.add(rightLower);
        const rightHand = leftHand.clone();
        rightHand.position.set(0.75, 0.78, 0);
        scene.add(rightHand);

        rigRef.current = { leftHand, rightHand, leftLower, rightLower, leftUpper, rightUpper };
        sceneRef.current = scene;
        camRef.current = camera;
        rendererRef.current = renderer;
        // Ready when renderer and scene are initialized

        let rafId;
        const animate = () => {
          renderer.render(scene, camera);
          rafId = requestAnimationFrame(animate);
        };
        animate();

        // Resize handler to keep aspect correct
        const onResize = () => {
          const width = mount.clientWidth || 280;
          const height = mount.clientHeight || 220;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        return () => {
          cancelAnimationFrame(rafId);
          renderer.dispose();
          renderer.domElement?.remove?.();
          window.removeEventListener('resize', onResize);
        };
      } catch (e) {
        console.error('Three.js load error', e);
      }
    })();
    return () => { disposed = true; };
  }, []);

  // Minimal gesture player
  const playGesture = (name) => {
    const rig = rigRef.current;
    const THREE = threeRef.current;
    if (!rig || !THREE) return;
    // Simple animations via tween-ish steps
    const duration = 900;
    const start = performance.now();

    const initial = {
      l: rig.leftHand.position.clone(),
      r: rig.rightHand.position.clone(),
    };

    const targetByName = {
      ok: { // bring right hand near left to form ring
        left: new THREE.Vector3(-0.62, 0.82, 0),
        right: new THREE.Vector3(-0.58, 0.84, 0),
      },
      present: { // small fist front
        left: new THREE.Vector3(-0.72, 0.8, 0.05),
        right: new THREE.Vector3(0.78, 0.82, 0.05),
      },
      absent: { // open palm
        left: new THREE.Vector3(-0.78, 0.78, -0.05),
        right: new THREE.Vector3(0.82, 0.78, -0.05),
      },
      neutral: {
        left: new THREE.Vector3(-0.75, 0.78, 0),
        right: new THREE.Vector3(0.75, 0.78, 0),
      },
    };
    const tgt = targetByName[name] || targetByName.neutral;

    const step = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      rig.leftHand.position.lerpVectors(initial.l, tgt.left, t);
      rig.rightHand.position.lerpVectors(initial.r, tgt.right, t);
      if (t < 1) requestAnimationFrame(step);
      else {
        // return to neutral after a short hold
        setTimeout(() => playGesture('neutral'), 500);
      }
    };
    step();
  };

  // SiGML subset player (very simplified): { sequence: [ { handshape: 'ok'|'present'|'absent' } ] }
  const playSi = (si) => {
    try {
      const seq = si?.sequence || [];
      if (!seq.length) return;
      seq.forEach((item, idx) => {
        const name = item.handshape || 'neutral';
        setTimeout(() => playGesture(name), idx * 1200);
      });
    } catch {}
  };

  // Gloss mapper: trivial mapping per word
  const playGloss = (text) => {
    const seqObj = glossToSequence(text || '');
    if (!seqObj?.sequence?.length) return;
    playSi(seqObj);
  };

  useEffect(() => {
    // Expose global APIs
    globalThis.playSiGML = (si) => animQueueRef.current.push(si);
    globalThis.playGlossText = (text) => animQueueRef.current.push({ gloss: text });
    globalThis.playSignAvatar = (key) => {
      animQueueRef.current.push(keyToSequence(key));
    };
    globalThis.openSignControls = (text) => {
      setControlsText(String(text || ''));
      setControlsOpen(true);
    };
    const pump = () => {
      if (playingRef.current) return;
      const next = animQueueRef.current.shift();
      if (!next) return;
      playingRef.current = true;
      if (next.gloss) playGloss(next.gloss);
      else playSi(next);
      setTimeout(() => { playingRef.current = false; pump(); }, 1600);
    };
    const id = setInterval(pump, 400);
    // Demo: play a welcome sign once on mount so users see motion
    animQueueRef.current.push(keyToSequence('welcome'));
    return () => {
      clearInterval(id);
      try { delete globalThis.playSiGML; delete globalThis.playGlossText; delete globalThis.playSignAvatar; delete globalThis.openSignControls; } catch {}
    };
  }, []);

  if (!prefs.signLanguageMode) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: 280,
        height: 220,
        background: '#0d1117',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
      aria-label="Avatar langue des signes"
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {controlsOpen && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            right: 8,
            background: 'rgba(20,23,28,0.9)',
            borderRadius: 10,
            padding: 8,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <input
            aria-label="Texte à signer"
            value={controlsText}
            onChange={(e) => setControlsText(e.target.value)}
            placeholder="Écrire une phrase…"
            style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid #334155', background: '#0b1220', color: '#e5e7eb' }}
          />
          <button
            onClick={() => globalThis.playGlossText?.(controlsText)}
            style={{ padding: '6px 10px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none' }}
          >Voir en signes</button>
          <button
            onClick={() => setControlsOpen(false)}
            style={{ padding: '6px 10px', borderRadius: 8, background: '#475569', color: '#fff', border: 'none' }}
          >Fermer</button>
        </div>
      )}
      {!controlsOpen && (
        <div
          style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 6 }}
        >
          <button onClick={() => globalThis.playSignAvatar?.('confirmprofile')} style={{ padding: '6px 8px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none' }}>👌 OK</button>
          <button onClick={() => globalThis.playSignAvatar?.('presencerecorded')} style={{ padding: '6px 8px', borderRadius: 8, background: '#f59e0b', color: '#111827', border: 'none' }}>✊ Présent</button>
          <button onClick={() => globalThis.playGlossText?.('absent')} style={{ padding: '6px 8px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none' }}>🖐️ Absent</button>
          <button onClick={() => setControlsOpen(true)} style={{ padding: '6px 8px', borderRadius: 8, background: '#334155', color: '#fff', border: 'none' }}>+ Phrase</button>
        </div>
      )}
    </div>
  );
}

export default SignAvatar;
