import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { AvatarState } from '@astro-care/engine';
import { Avatar } from './Avatar';

const MODEL_URL = '/models/circulatory.glb';

const AURA: Record<AvatarState, number> = {
  optimal: 0x4ade80,
  low: 0xeab308,
  medium: 0xf97316,
  high: 0xf43f5e,
};

const ARTERY_OXY = new THREE.Color(0.808, 0.035, 0.024);
const ARTERY_HYPOXIC = new THREE.Color(0.32, 0.05, 0.38);

export interface Anchor {
  id: string;
  /** model-space position in metres (feet at y = 0) */
  pos: [number, number, number];
}

interface Props {
  state: AvatarState;
  heartRate: number;
  respRate: number;
  spo2: number;
  /** DOM elements positioned every frame at the projected anchor (hotspots, callouts) */
  anchors?: Anchor[];
  anchorEls?: MutableRefObject<Record<string, HTMLElement | null>>;
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
 * Hologram circulatory-system avatar driven by live vitals:
 * heart beats at HR, blood flow speeds up with HR, arteries turn purple as SpO₂ drops,
 * the body breathes at RR and glows with the NEWS2 state colour.
 */
export function Avatar3D({ state, heartRate, respRate, spo2, anchors = [], anchorEls }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const live = useRef({ state, heartRate, respRate, spo2, anchors });
  live.current = { state, heartRate, respRate, spo2, anchors };
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
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    el.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, el.clientWidth / el.clientHeight, 0.05, 50);
    camera.position.set(0, 0.92, 4.3);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.9, 0);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.35;
    controls.maxPolarAngle = Math.PI * 0.65;

    scene.add(new THREE.HemisphereLight(0xdff0e6, 0x0b1410, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(1.5, 3, 2.5);
    scene.add(key);

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

    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        const body = model.getObjectByName('Body') as THREE.Mesh;
        skin = body.material as THREE.MeshStandardMaterial;
        // hologram skin: green wireframe over the vessels
        skin.wireframe = true;
        skin.color.setHex(0x4ade80);
        skin.opacity = 0.06;
        skin.transparent = true;
        skin.depthWrite = false;
        body.renderOrder = 2;
        artery = (model.getObjectByName('Arteries') as THREE.Mesh).material as THREE.MeshStandardMaterial;
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
    const v3 = new THREE.Vector3();
    const auraColor = new THREE.Color();
    let t = 0;
    let beatPhase = 0;
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
        // hologram stays green when normal; tints toward the NEWS2 colour otherwise
        auraColor.setHex(AURA[v.state]);
        const pulse = v.state === 'high' ? 0.5 + 0.5 * Math.sin(t * 8) : 1;
        skin.color.copy(auraColor);
        skin.emissive.copy(auraColor);
        skin.emissiveIntensity = 0.25 * pulse;
        skin.opacity = v.state === 'high' ? 0.06 + 0.06 * pulse : 0.06;
      }
      controls.update();
      renderer.render(scene, camera);

      // project anchors to screen space and move their DOM elements
      if (anchorEls) {
        const w = el.clientWidth;
        const h = el.clientHeight;
        for (const a of v.anchors) {
          const node = anchorEls.current[a.id];
          if (!node) continue;
          v3.set(...a.pos).project(camera);
          node.style.transform = `translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px)`;
          node.style.visibility = model ? 'visible' : 'hidden';
        }
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center">
        <Avatar state={state} respRate={respRate} />
      </div>
    );
  }

  return (
    <div ref={mount} className="absolute inset-0" aria-hidden>
      {!loaded && <div className="label absolute inset-0 flex items-center justify-center">Loading hologram…</div>}
    </div>
  );
}
