import { useEffect, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';
import { glossToSequence, keyToSequence } from '../sign/lexicon';

// Lightweight 3D avatar scaffold using Three.js
// API: globalThis.playSignAvatar(key), globalThis.playSiGML(si), globalThis.playGlossText(text)
// This is a minimal POC: simple rig with arms + hand; gestures are simplified

function createFinger(THREE, skinMaterial, handGroup, x) {
  const base = new THREE.Group();
  base.position.set(x, 0.06, 0.02);
  handGroup.add(base);

  const seg1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.08, 16),
    skinMaterial
  );
  seg1.castShadow = true;
  seg1.position.set(0, 0.04, 0);
  base.add(seg1);

  const seg2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.06, 16),
    skinMaterial
  );
  seg2.castShadow = true;
  seg2.position.set(0, 0.08, 0);
  base.add(seg2);

  return {
    base,
    seg1,
    seg2,
    neutral: { baseX: 0, seg1X: 0, seg2X: 0 },
  };
}

function setNeutralFingerPose(fingers) {
  fingers.forEach((f, i) => {
    const baseX = -0.2 - i * 0.02;
    const seg1X = -0.1;
    const seg2X = -0.05;
    f.base.rotation.x = baseX;
    f.seg1.rotation.x = seg1X;
    f.seg2.rotation.x = seg2X;
    f.neutral = { baseX, seg1X, seg2X };
  });
}

function buildHand(THREE, handGroup) {
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

  const palm = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.08),
    skinMaterial
  );
  palm.castShadow = true;
  handGroup.add(palm);

  const fingerPositions = [-0.07, -0.035, 0, 0.035, 0.07];
  const fingers = fingerPositions.map((x) => createFinger(THREE, skinMaterial, handGroup, x));

  // Thumb offset
  fingers[0].base.position.set(fingerPositions[0], 0.02, -0.02);

  setNeutralFingerPose(fingers);
  return { palm, fingers };
}

function setHandsPose(rig, name) {
  if (!rig?.leftArm?.fingers || !rig?.rightArm?.fingers) return;

  const apply = (arm, open, isOk) => {
    arm.fingers.forEach((f) => {
      const curl1 = open ? -0.05 : -0.6;
      const curl2 = open ? -0.02 : -0.5;
      f.seg1.rotation.x = curl1;
      f.seg2.rotation.x = curl2;
      // keep base around neutral unless OK needs it
      if (f.neutral) f.base.rotation.x = f.neutral.baseX;
    });
    if (isOk) {
      // Thumb touches index finger (approx)
      if (arm.fingers[1]) arm.fingers[1].base.rotation.x = -0.3;
      if (arm.fingers[0]) arm.fingers[0].base.rotation.x = -0.3;
    }
  };

  if (name === 'neutral') {
    setNeutralFingerPose(rig.leftArm.fingers);
    setNeutralFingerPose(rig.rightArm.fingers);
    return;
  }
  if (name === 'absent') {
    apply(rig.leftArm, true, false);
    apply(rig.rightArm, true, false);
    return;
  }
  if (name === 'present') {
    apply(rig.leftArm, false, false);
    apply(rig.rightArm, false, false);
    return;
  }
  if (name === 'ok') {
    apply(rig.leftArm, false, true);
    apply(rig.rightArm, false, true);
  }
}

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
        renderer.shadowMap.enabled = true;
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
        key.castShadow = true;
        scene.add(key);
        const fill = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(fill);

        // Ground plane for soft shadows
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 2.5),
          new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 1 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, 0.6, 0);
        ground.receiveShadow = true;
        scene.add(ground);

        // Simple rig: torso + arms + hands
        const torso = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 1, 0.32),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
        );
        torso.position.set(0, 1, 0);
        torso.castShadow = true;
        scene.add(torso);

        // Head + neck
        const neck = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
        );
        neck.position.set(0, 1.46, 0);
        neck.castShadow = true;
        scene.add(neck);

        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 24, 24),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
        );
        head.position.set(0, 1.66, 0);
        head.castShadow = true;
        scene.add(head);
        // Build articulated arms with shoulder + elbow pivots
        const createArm = (side) => {
          const group = new THREE.Group();
          const shoulderX = side === 'left' ? -0.45 : 0.45;
          group.position.set(shoulderX, 1.4, 0);

          const upper = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.42, 20),
            new THREE.MeshStandardMaterial({ color: 0x60a5fa })
          );
          upper.castShadow = true;
          upper.position.set(0, -0.21, 0);
          upper.rotation.z = side === 'left' ? Math.PI / 8 : -Math.PI / 8; // slight outward
          group.add(upper);

          const elbow = new THREE.Group();
          elbow.position.set(0, -0.42, 0);
          group.add(elbow);

          const lower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.36, 20),
            new THREE.MeshStandardMaterial({ color: 0x60a5fa })
          );
          lower.castShadow = true;
          lower.position.set(0, -0.18, 0);
          elbow.add(lower);

          // Hand: palm + 5 fingers
          const handGroup = new THREE.Group();
          handGroup.position.set(0, -0.18, 0);
          elbow.add(handGroup);

          const { fingers } = buildHand(THREE, handGroup);

          // Neutral arm pose: slight forward
          group.rotation.x = -0.2;
          elbow.rotation.x = -0.1;
          // expose hand group and fingers for posing
          return { group, upper, elbow, lower, handGroup, fingers };
        };

        const leftArm = createArm('left');
        const rightArm = createArm('right');
        scene.add(leftArm.group);
        scene.add(rightArm.group);

        rigRef.current = { leftArm, rightArm };
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
    const duration = 900;
    const start = performance.now();

    // Apply finger pose once at gesture start
    setHandsPose(rig, name);

    // Capture initial rotations
    const init = {
      lGroupX: rig.leftArm.group.rotation.x,
      lElbowX: rig.leftArm.elbow.rotation.x,
      rGroupX: rig.rightArm.group.rotation.x,
      rElbowX: rig.rightArm.elbow.rotation.x,
    };

    // Target rotations per gesture
    const targets = {
      neutral: { lGroupX: -0.2, lElbowX: -0.1, rGroupX: -0.2, rElbowX: -0.1 },
      present: { lGroupX: -0.4, lElbowX: -0.6, rGroupX: -0.4, rElbowX: -0.6 },
      absent: { lGroupX: -0.1, lElbowX: 0.2, rGroupX: -0.1, rElbowX: 0.2 },
      ok: { lGroupX: -0.3, lElbowX: -0.5, rGroupX: -0.3, rElbowX: -0.7 },
    };
    const tgt = targets[name] || targets.neutral;

    const step = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
      rig.leftArm.group.rotation.x = init.lGroupX + (tgt.lGroupX - init.lGroupX) * ease;
      rig.leftArm.elbow.rotation.x = init.lElbowX + (tgt.lElbowX - init.lElbowX) * ease;
      rig.rightArm.group.rotation.x = init.rGroupX + (tgt.rGroupX - init.rGroupX) * ease;
      rig.rightArm.elbow.rotation.x = init.rElbowX + (tgt.rElbowX - init.rElbowX) * ease;
      if (t < 1) requestAnimationFrame(step);
      else setTimeout(() => playGesture('neutral'), 500);
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
        right: 312,
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
