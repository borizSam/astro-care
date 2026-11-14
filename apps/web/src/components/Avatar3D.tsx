import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { AvatarState } from '@astro-care/engine';
import { Avatar } from './Avatar';

const MODEL_URL = '/models/circulatory.glb';

const AURA: Record<AvatarState, number> = {
  optimal: 0x22c55e,
  low: 0xeab308,
  medium: 0xf97316,
  high: 0xef4444,
};

const LABEL: Record<AvatarState, string> = {
  optimal: 'Feeling good',
  low: 'A bit tired',
  medium: 'Not well: check guidance',
  high: 'Distress: crew alert',
};

const ARTERY_OXY = new THREE.Color(0.808, 0.035, 0.024); // oxygenated red (model default)
const ARTERY_HYPOXIC = new THREE.Color(0.32, 0.05, 0.38); // cyanotic purple

interface Props {
  state: AvatarState;
  heartRate: number;
  respRate: number;
  spo2: number;
  height?: number;
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * 3D circulatory-system avatar. Live vitals drive it:
 *  - heart beats at the astronaut's heart rate
 *  - blood-flow waves speed up with heart rate
 *  - arteries shift from red to purple as SpO₂ drops
 *  - body breathes at the respiratory rate
 *  - skin glows with the NEWS2 state colour (pulses in distress)
 */
export function Avatar3D({ state, heartRate, respRate, spo2, height = 380 }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef({ state, heartRate, respRate, spo2 });
  live.current = { state, heartRate, respRate, spo2 };
  const [failed, setFailed] = useState(() => typeof window !== 'undefined' && !webglAvailable());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = mount.current;
    if (!el || failed) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, el.clientWidth / el.clientHeight, 0.05, 50);
    camera.position.set(0, 0.95, 4.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.9, 0);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.3;
    controls.maxPolarAngle = Math.PI * 0.7;

    scene.add(new THREE.HemisphereLight(0xdfe6f0, 0x1a1c20, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1.5, 3, 2.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.6);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    // Blood flow: each vessel vertex carries `_flow` = distance from the heart (m).
    const flowPhase = { value: 0 };
    const addFlow = (material: THREE.Material, outward: boolean) => {
      material.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = flowPhase;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nattribute float _flow; varying float vFlow;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFlow = _flow;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying float vFlow; uniform float uTime;')
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            float w = fract(vFlow * 4.0 ${outward ? '-' : '+'} uTime);
            totalEmissiveRadiance += diffuseColor.rgb * smoothstep(0.0, 0.08, w) * (1.0 - smoothstep(0.08, 0.38, w)) * 0.8;`,
          );
      };
    };

    let model: THREE.Object3D | null = null;
    let heart: THREE.Group | null = null;
    let skin: THREE.MeshStandardMaterial | null = null;
    let artery: THREE.MeshStandardMaterial | null = null;
    let disposed = false;

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        const body = model.getObjectByName('Body') as THREE.Mesh;
        skin = body.material as THREE.MeshStandardMaterial;
        skin.depthWrite = false; // translucent skin over the vessels
        body.renderOrder = 2;
        const arteries = model.getObjectByName('Arteries') as THREE.Mesh;
        artery = arteries.material as THREE.MeshStandardMaterial;
        addFlow(artery, true);
        addFlow((model.getObjectByName('Veins') as THREE.Mesh).material as THREE.Material, false);
        heart = new THREE.Group();
        heart.position.set(0.012, 1.262, 0.052);
        for (const name of ['HeartLeft', 'HeartRight']) {
          const m = model.getObjectByName(name)!;
          m.position.sub(heart.position);
          heart.add(m);
        }
        model.add(heart);
        scene.add(model);
        setLoaded(true);
      },
      undefined,
      () => setFailed(true),
    );

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    const clock = new THREE.Clock();
    let t = 0;
    let beatPhase = 0;
    const auraColor = new THREE.Color();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1);
      t += dt;
      const v = live.current;
      const hr = Math.max(30, Math.min(180, v.heartRate || 60));
      flowPhase.value += dt * 0.55 * (hr / 69);
      beatPhase = (beatPhase + dt * (hr / 60)) % 1;

      if (heart) heart.scale.setScalar(1 + 0.07 * Math.exp(-beatPhase * 14));
      if (model) {
        const breath = Math.sin(t * 2 * Math.PI * (Math.max(6, v.respRate || 14) / 60));
        model.scale.set(1 + 0.008 * breath, 1, 1 + 0.012 * breath);
      }
      if (artery) {
        const hypoxia = THREE.MathUtils.clamp((97 - v.spo2) / 12, 0, 1);
        artery.color.copy(ARTERY_OXY).lerp(ARTERY_HYPOXIC, hypoxia);
      }
      if (skin) {
        auraColor.setHex(AURA[v.state]);
        const pulse = v.state === 'high' ? 0.5 + 0.5 * Math.sin(t * 8) : v.state === 'medium' ? 0.7 + 0.3 * Math.sin(t * 3) : 1;
        skin.emissive.copy(auraColor);
        skin.emissiveIntensity = (v.state === 'optimal' ? 0.12 : 0.3) * pulse;
      }
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      ro.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [failed]);

  if (failed) return <Avatar state={state} respRate={respRate} />;

  const aura = `#${AURA[state].toString(16).padStart(6, '0')}`;
  return (
    <figure className="flex w-full flex-col items-center gap-2" aria-label={`3D astronaut avatar: ${LABEL[state]}. Heart rate ${heartRate}, SpO₂ ${spo2}%.`}>
      <div
        ref={mount}
        className="relative w-full cursor-grab overflow-hidden rounded-xl active:cursor-grabbing"
        style={{ height, background: `radial-gradient(ellipse at 50% 45%, ${aura}22, transparent 65%)` }}
      >
        {!loaded && <div className="label absolute inset-0 flex items-center justify-center">Loading 3D model…</div>}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col gap-1 font-mono text-[11px]">
          <span className="text-nogo">♥ {heartRate} bpm</span>
          <span style={{ color: spo2 < 94 ? '#c084fc' : '#7dd3fc' }}>O₂ {spo2}%</span>
          <span className="text-dim">RR {respRate}/min</span>
        </div>
        <span className="pointer-events-none absolute bottom-2 right-2 text-[10px] text-dim">drag to rotate</span>
      </div>
      <figcaption className="label" style={{ color: aura }}>{LABEL[state]}</figcaption>
    </figure>
  );
}
