"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, useCursor } from "@react-three/drei";
import { LanyardSim, TICK, stretchMax } from "./lanyard-sim";
import { CARD_TEX_H, CARD_TEX_W, SLOT, STRAP_TEX_H, STRAP_TEX_W, createCardTextures } from "./card-textures";

// Card in world units, in the artwork's proportions.
const CARD_W = 3.2;
const CARD_H = (CARD_W * CARD_TEX_H) / CARD_TEX_W;
const CARD_R = 0.11;
const CARD_DEPTH = 0.028;
const BEVEL = 0.008;
const px = (v: number) => (v / CARD_TEX_W) * CARD_W;

// Slot punched near the top edge; the clip ring passes through it.
const SLOT_Y = CARD_H / 2 - px(SLOT.cy);
const SLOT_W = px(SLOT.w);
const SLOT_H = px(SLOT.h);
// Hardware stack, bottom to top: split ring through the slot -> swivel eye -> barrel -> crimp on the strap.
const STRAP_W = 0.6;
const RING_R = 0.14;
const RING_Y = SLOT_Y + RING_R;
const EYE_R = 0.05;
const EYE_Y = SLOT_Y + RING_R * 2 + 0.03;
const BARREL_H = 0.1;
const BARREL_Y = EYE_Y + EYE_R + BARREL_H / 2 - 0.008;
const CRIMP_H = 0.12;
const CRIMP_Y = BARREL_Y + BARREL_H / 2 + CRIMP_H / 2 - 0.008;
const CRIMP_TOP = CRIMP_Y + CRIMP_H / 2;
const HANG_Y = CRIMP_TOP - 0.01; // where the rope joins the card, in card space

export const CAMERA_FOV = 25;

const ANCHOR_Y = 4.0;
const STRAP_LENGTH = 2.88;
const SEGMENTS = 12;

// Strap ribbon: sampled along a spline through the rope, lit like fabric, twisting with the card.
const RIBBON_SAMPLES = 96;
const STRAP_TILE = STRAP_W * (STRAP_TEX_W / STRAP_TEX_H); // world length of one texture repeat

function cardShape(withSlot: boolean) {
  const s = new THREE.Shape();
  {
    const x = -CARD_W / 2;
    const y = -CARD_H / 2;
    const r = CARD_R;
    s.moveTo(x + r, y);
    s.lineTo(x + CARD_W - r, y);
    s.absarc(x + CARD_W - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + CARD_W, y + CARD_H - r);
    s.absarc(x + CARD_W - r, y + CARD_H - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + CARD_H);
    s.absarc(x + r, y + CARD_H - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r);
    s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  }
  if (withSlot) {
    const hole = new THREE.Path();
    const hr = SLOT_H / 2;
    const hx = SLOT_W / 2 - hr;
    hole.absarc(hx, SLOT_Y, hr, -Math.PI / 2, Math.PI / 2, false);
    hole.lineTo(-hx, SLOT_Y + hr);
    hole.absarc(-hx, SLOT_Y, hr, Math.PI / 2, Math.PI * 1.5, false);
    hole.lineTo(hx, SLOT_Y - hr);
    s.holes.push(hole);
  }
  return s;
}

/** Flat face with 0..1 UVs across the card, so the texture maps edge to edge. */
function faceGeometry() {
  const geo = new THREE.ShapeGeometry(cardShape(true), 24);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / CARD_W + 0.5, pos.getY(i) / CARD_H + 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

function bodyGeometry() {
  const geo = new THREE.ExtrudeGeometry(cardShape(true), {
    depth: CARD_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 24,
  });
  geo.translate(0, 0, -CARD_DEPTH / 2);
  return geo;
}

function ribbonGeometry() {
  const geo = new THREE.BufferGeometry();
  const verts = RIBBON_SAMPLES * 2;
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(verts * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(verts * 2), 2).setUsage(THREE.DynamicDrawUsage));
  const index: number[] = [];
  for (let i = 0; i < RIBBON_SAMPLES - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setIndex(index);
  return geo;
}

function strapMaterial(map: THREE.Texture, side: THREE.Side) {
  return new THREE.MeshPhysicalMaterial({
    map,
    side,
    roughness: 0.78,
    metalness: 0,
    sheen: 0.25,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#3A6EA5"),
  });
}

/** Same image (shared, repainted together), flipped across the strap's width. */
function mirroredAcross(tex: THREE.Texture) {
  const t = tex.clone();
  t.repeat.set(1, -1);
  t.offset.set(0, 1);
  return t;
}

/** Pointer capture keeps the drag alive outside the card; it throws if the pointer is already gone (very fast taps). */
function capture(e: ThreeEvent<PointerEvent>, on: boolean) {
  const el = e.target as Element;
  try {
    if (on) el.setPointerCapture?.(e.pointerId);
    else el.releasePointerCapture?.(e.pointerId);
  } catch {
    // Nothing to capture or release; the window listeners still end the drag.
  }
}

/** Hit-tests client touch coordinates against 3D targets (card and strap meshes) in canvas screen space. */
export function hitTestLanyard(
  touch: { clientX: number; clientY: number },
  rect: { left: number; top: number; width: number; height: number },
  camera: THREE.Camera,
  targets: THREE.Object3D[],
  raycaster = new THREE.Raycaster()
): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;
  const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  if (x < -1 || x > 1 || y < -1 || y > 1) return false;

  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const hits = raycaster.intersectObjects(targets, true);
  return hits.length > 0;
}

function Band({ onGrab, onReady }: { onGrab?: () => void; onReady?: () => void }) {
  const { gl, camera } = useThree();
  const invalidate = useThree((s) => s.invalidate);
  const cardMesh = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.Mesh>(null);
  const ribbonBack = useRef<THREE.Mesh>(null);
  const sim = useMemo(() => {
    const created = new LanyardSim({
      anchor: [0, ANCHOR_Y, 0],
      strapLength: STRAP_LENGTH,
      segments: SEGMENTS,
      cardW: CARD_W,
      cardH: CARD_H,
      hangY: HANG_Y,
    });
    created.reset("swing-in"); // the card swings in on load
    return created;
  }, []);
  // `idle`: the last frame found the sim asleep, so the next frame's delta covers idle time and is not simulated.
  // `started`: the swing-in waits until the card is revealed (textures painted), so the entrance is seen in full.
  const clock = useRef({ acc: 0, dragZ: 0, idle: false, started: false });
  // Where and when the current press started, to tell a tap (flip the card) from a drag.
  const press = useRef<{ t: number; x: number; y: number } | null>(null);

  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !dragged, "grab", "auto");
  useCursor(!!dragged, "grabbing", "auto");

  const textures = useMemo(() => createCardTextures(gl.capabilities.getMaxAnisotropy()), [gl]);
  useEffect(() => () => textures.dispose(), [textures]);


  const geometries = useMemo(() => ({ face: faceGeometry(), body: bodyGeometry() }), []);
  useEffect(() => () => {
    geometries.face.dispose();
    geometries.body.dispose();
  }, [geometries]);

  const materials = useMemo(() => {
    const face = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        roughness: 0.32,
        metalness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        iridescence: 0.35,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [200, 600],
      });
    return {
      front: face(textures.front),
      back: face(textures.back),
      edge: new THREE.MeshPhysicalMaterial({ color: "#0A2240", roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2 }),
      metal: new THREE.MeshStandardMaterial({ color: "#DCE4EC", metalness: 1, roughness: 0.16 }),
      crimp: new THREE.MeshPhysicalMaterial({ color: "#B9C4CF", metalness: 1, roughness: 0.28, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
      strap: strapMaterial(textures.strap, THREE.FrontSide),
      // Printed on both sides: seen from behind, the print is mirrored across the width so it still reads right.
      strapBack: strapMaterial(mirroredAcross(textures.strap), THREE.BackSide),
    };
  }, [textures]);
  // The card stays hidden until it can be drawn without a hitch: textures painted, shaders compiled off the main
  // thread (compileAsync), then each texture uploaded on its own frame. Only then is it shown and the hero told.
  const getState = useThree((s) => s.get);
  const [prepared, setPrepared] = useState(false);
  useEffect(() => {
    let live = true;
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    void (async () => {
      await textures.ready;
      if (!live) return;
      const { scene, camera: threeCam } = getState();
      await gl.compileAsync(scene, threeCam).catch(() => undefined);
      for (const texture of [textures.front, textures.back, textures.strap, materials.strapBack.map]) {
        if (!live) return;
        if (texture) gl.initTexture(texture);
        await frame();
      }
      if (!live) return;
      setPrepared(true);
      await frame();
      await frame();
      if (!live) return;
      clock.current.started = true;
      invalidate();
      onReady?.();
    })();
    return () => {
      live = false;
    };
  }, [textures, materials, gl, getState, onReady, invalidate]);

  // The mirrored strap print shares the painted image but is its own texture, so re-upload it once painting is done.
  useEffect(() => {
    let live = true;
    void textures.ready.then(() => {
      const map = materials.strapBack.map;
      if (!live || !map) return;
      map.needsUpdate = true;
      invalidate();
    });
    return () => {
      live = false;
    };
  }, [textures, materials, invalidate]);
  useEffect(
    () => () => {
      materials.strapBack.map?.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [materials],
  );

  const ribbonGeo = useMemo(() => ribbonGeometry(), []);
  useEffect(() => () => ribbonGeo.dispose(), [ribbonGeo]);

  const curve = useMemo(() => {
    // Strap particles (anchor .. one above the hang point), then the strap end tucked into the crimp.
    const c = new THREE.CatmullRomCurve3(Array.from({ length: SEGMENTS + 1 }, () => new THREE.Vector3()));
    c.curveType = "centripetal";
    return c;
  }, []);
  const tmp = useMemo(
    () => ({
      vec: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      bl: new THREE.Vector3(),
      br: new THREE.Vector3(),
      hang: new THREE.Vector3(),
      ax: new THREE.Vector3(),
      ay: new THREE.Vector3(),
      az: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      point: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      side: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      drawn: new Float64Array(sim.count * 3),
      samples: Array.from({ length: RIBBON_SAMPLES }, () => new THREE.Vector3()),
      tangents: Array.from({ length: RIBBON_SAMPLES }, () => new THREE.Vector3()),
    }),
    [sim],
  );

  /** Ends a press. A quick tap without moving flips the card to its other side. */
  const release = useCallback(
    (e?: { clientX: number; clientY: number }) => {
      const p = press.current;
      press.current = null;
      if (!p) return;
      sim.endDrag();
      setDragged(false);
      if (e && performance.now() - p.t < 280 && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) sim.flip();
      invalidate();
    },
    [sim, invalidate],
  );

  // Native touch handling:
  // - Non-passive touchstart raycasts against card and strap. If hit, calls preventDefault so the mobile browser
  //   never initiates a page scroll/pan gesture for card touches.
  // - If touch starts anywhere else on the canvas, preventDefault is NOT called, allowing smooth vertical page scrolling.
  useEffect(() => {
    const el = gl.domElement;
    const raycaster = new THREE.Raycaster();

    const onTouchStart = (e: TouchEvent) => {
      if (!prepared || !cardMesh.current || !ribbon.current) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const targets = [cardMesh.current, ribbon.current, ribbonBack.current].filter(Boolean) as THREE.Object3D[];
      let isHit = false;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (hitTestLanyard({ clientX: touch.clientX, clientY: touch.clientY }, rect, camera, targets, raycaster)) {
          isHit = true;
          break;
        }
      }
      if (isHit && e.cancelable) {
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if ((dragged || press.current) && e.cancelable) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [gl, camera, prepared, dragged]);

  // Release the drag even if the pointer is let go outside the canvas.
  useEffect(() => {
    if (!dragged) return;
    const end = (e: Event) => {
      if (e instanceof PointerEvent || e instanceof MouseEvent) {
        release({ clientX: e.clientX, clientY: e.clientY });
      } else if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent && e.changedTouches?.[0]) {
        release({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY });
      } else {
        release();
      }
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      window.removeEventListener("blur", end);
    };
  }, [dragged, release]);

  useFrame((state, delta) => {
    const drawnCard = cardMesh.current;
    if (!drawnCard || !ribbon.current) return;
    const { vec, dir, bl, br, hang, ax, ay, az, basis, drawn } = tmp;

    if (sim.dragging) {
      // Pointer ray hits the plane the card was grabbed in.
      const cam = state.camera.position;
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(cam);
      const t = Math.abs(dir.z) > 1e-6 ? (clock.current.dragZ - cam.z) / dir.z : 0;
      sim.moveDrag(cam.x + dir.x * t, cam.y + dir.y * t, clock.current.dragZ);
    }

    // Fixed-rate physics, drawn interpolated so motion is smooth at any refresh rate.
    if (clock.current.started) clock.current.acc += clock.current.idle ? Math.min(delta, 1 / 60) : Math.min(delta, 0.1);
    while (clock.current.acc >= TICK) {
      sim.tick();
      clock.current.acc -= TICK;
    }
    sim.interpolate(clock.current.acc / TICK, drawn);
    // Render on demand: keep frames coming only while something moves.
    clock.current.idle = sim.sleeping && !sim.dragging;
    if (!clock.current.idle) state.invalidate();

    // Card pose from its three particles.
    const at = (i: number, v: THREE.Vector3) => v.set(drawn[i * 3], drawn[i * 3 + 1], drawn[i * 3 + 2]);
    at(sim.bl, bl);
    at(sim.br, br);
    at(sim.hang, hang);
    ax.subVectors(br, bl).normalize();
    bl.add(br).multiplyScalar(0.5); // bottom-edge midpoint
    ay.subVectors(hang, bl);
    ay.addScaledVector(ax, -ay.dot(ax)).normalize();
    az.crossVectors(ax, ay);
    basis.makeBasis(ax, ay, az);
    drawnCard.quaternion.setFromRotationMatrix(basis);
    drawnCard.position.copy(bl).addScaledVector(ay, CARD_H / 2);
    drawnCard.updateMatrixWorld();

    // Spline through the strap, ending inside the crimp.
    for (let i = 0; i < SEGMENTS; i++) at(i, curve.points[i]);
    drawnCard.localToWorld(curve.points[SEGMENTS].set(0, CRIMP_TOP - 0.02, 0));

    // Ribbon frame, carried up from the crimp by parallel transport: the strap starts flat across the card and
    // twists only as much as its path does, so it never flips however the card is held.
    const { point, tangent, side, normal, samples, tangents } = tmp;
    const geo = ribbon.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const nor = geo.attributes.normal as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    let pathLength = 0;
    for (let i = 0; i < RIBBON_SAMPLES; i++) {
      const u = i / (RIBBON_SAMPLES - 1);
      curve.getPoint(u, samples[i]);
      curve.getTangent(u, tangents[i]);
      if (i > 0) pathLength += samples[i].distanceTo(samples[i - 1]);
    }
    const strain = Math.max(0, Math.min(1, (pathLength / STRAP_LENGTH - 1) / stretchMax));
    const half = STRAP_W * (1 - strain * 0.06) / 2;
    side.copy(ax); // card's X at the crimp
    let along = 0;
    for (let i = RIBBON_SAMPLES - 1; i >= 0; i--) {
      if (i < RIBBON_SAMPLES - 1) along += samples[i].distanceTo(samples[i + 1]);
      tangent.copy(tangents[i]);
      side.addScaledVector(tangent, -side.dot(tangent));
      if (side.lengthSq() < 1e-8) side.set(1, 0, 0).addScaledVector(tangent, -tangent.x);
      side.normalize();
      normal.crossVectors(side, tangent).normalize();
      point.copy(samples[i]).addScaledVector(side, -half);
      pos.setXYZ(i * 2, point.x, point.y, point.z);
      point.copy(samples[i]).addScaledVector(side, half);
      pos.setXYZ(i * 2 + 1, point.x, point.y, point.z);
      nor.setXYZ(i * 2, normal.x, normal.y, normal.z);
      nor.setXYZ(i * 2 + 1, normal.x, normal.y, normal.z);
      // Measured from the crimp, so the print stays put where the strap is fixed to the hardware.
      uv.setXY(i * 2, along / STRAP_TILE, 1);
      uv.setXY(i * 2 + 1, along / STRAP_TILE, 0);
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    uv.needsUpdate = true;
    geo.computeBoundingSphere();
  });

  const grab = (e: ThreeEvent<PointerEvent>) => {
    if (!cardMesh.current) return;
    e.stopPropagation();
    capture(e, true);
    const local = cardMesh.current.worldToLocal(e.point.clone());
    clock.current.dragZ = e.point.z;
    press.current = { t: performance.now(), x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    sim.startDrag(local.x, local.y);
    setDragged(true);
    invalidate();
    onGrab?.();
  };

  return (
    <group visible={prepared}>
      <group
        ref={cardMesh}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={(e) => {
          capture(e, false);
          release(e.nativeEvent);
        }}
        onPointerDown={grab}
      >
        <mesh geometry={geometries.body} material={materials.edge} />
        <mesh geometry={geometries.face} material={materials.front} position={[0, 0, CARD_DEPTH / 2 + BEVEL + 0.0006]} />
        <mesh
          geometry={geometries.face}
          material={materials.back}
          position={[0, 0, -(CARD_DEPTH / 2 + BEVEL + 0.0006)]}
          rotation={[0, Math.PI, 0]}
        />
        {/* Split ring through the slot (turned so it reads as a ring from the front) */}
        <mesh material={materials.metal} position={[0, RING_Y, 0]} rotation={[0, Math.PI * 0.32, 0]}>
          <torusGeometry args={[RING_R, 0.017, 24, 72]} />
        </mesh>
        {/* Swivel eye, interlocked with the ring */}
        <mesh material={materials.metal} position={[0, EYE_Y, 0]} rotation={[0, -Math.PI * 0.18, 0]}>
          <torusGeometry args={[EYE_R, 0.013, 16, 48]} />
        </mesh>
        {/* Swivel barrel */}
        <mesh material={materials.metal} position={[0, BARREL_Y, 0]}>
          <cylinderGeometry args={[0.026, 0.036, BARREL_H, 32]} />
        </mesh>
        {/* Crimp: slim, pill-shaped profile pressed onto the strap end */}
        <RoundedBox
          args={[STRAP_W + 0.05, CRIMP_H, 0.06]}
          radius={0.028}
          smoothness={6}
          position={[0, CRIMP_Y, 0]}
          material={materials.crimp}
        />
      </group>
      <mesh
        ref={ribbon}
        geometry={ribbonGeo}
        material={materials.strap}
        frustumCulled={false}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={(e) => {
          capture(e, false);
          release(e.nativeEvent);
        }}
        onPointerDown={grab}
      />
      <mesh
        ref={ribbonBack}
        geometry={ribbonGeo}
        material={materials.strapBack}
        frustumCulled={false}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerUp={(e) => {
          capture(e, false);
          release(e.nativeEvent);
        }}
        onPointerDown={grab}
      />
    </group>
  );
}

/** Keeps the card at a similar share of the frame on phones and wide screens with generous swing margins. */
function CameraRig() {
  const get = useThree((s) => s.get);
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const camera = get().camera;
    const aspect = width / Math.max(1, height);
    // Smooth distance scaling: keeps the card centered and visually proportioned at rest,
    // while giving generous frustum width on mobile and wide screens to avoid clipping during drag.
    const targetZ = aspect < 1 ? 11.6 / Math.pow(aspect, 0.7) : 11.6;
    camera.position.z = THREE.MathUtils.clamp(targetZ, 10.0, 13.8);
    camera.updateProjectionMatrix();
  }, [get, width, height]);
  return null;
}

export function LanyardScene({ onCardGrab, onReady }: { onCardGrab?: () => void; onReady?: () => void }) {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={Math.PI * 0.55} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} />
      <Band onGrab={onCardGrab} onReady={onReady} />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={6} color="#9FD6FF" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </>
  );
}
