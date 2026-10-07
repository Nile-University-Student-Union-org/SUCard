"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useBeforePhysicsStep,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { Environment, Lightformer, RoundedBox, useCursor } from "@react-three/drei";
import { CARD_TEX_H, CARD_TEX_W, SLOT, STRAP_TEX_H, STRAP_TEX_W, createCardTextures } from "./card-textures";

// Card in world units (ISO ID-1 proportions).
const CARD_W = 3.2;
const CARD_H = (CARD_W * CARD_TEX_H) / CARD_TEX_W;
const CARD_R = 0.17;
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

const SEGMENTS = 4;
const SEGMENT = 0.72;
const ANCHOR_Y = 4.0;
const ANCHOR = new THREE.Vector3(0, ANCHOR_Y, 0);

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

const segmentProps: RigidBodyProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 4,
  linearDamping: 4,
};

function Band({ onGrab, onReady }: { onGrab?: () => void; onReady?: () => void }) {
  const { gl } = useThree();
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const j4 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const cardMesh = useRef<THREE.Group>(null);
  // Drawn (interpolated) positions of the rope bodies, so the strap moves as smoothly as the card.
  const g1 = useRef<THREE.Group>(null);
  const g2 = useRef<THREE.Group>(null);
  const g3 = useRef<THREE.Group>(null);

  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !dragged, "grab", "auto");
  useCursor(!!dragged, "grabbing", "auto");

  const textures = useMemo(() => createCardTextures(gl.capabilities.getMaxAnisotropy()), [gl]);
  useEffect(() => () => textures.dispose(), [textures]);

  // Physics and textures are in: tell the hero after a couple of frames so the first paint is the real card.
  useEffect(() => {
    let live = true;
    void textures.ready.then(() =>
      requestAnimationFrame(() => requestAnimationFrame(() => live && onReady?.())),
    );
    return () => {
      live = false;
    };
  }, [textures, onReady]);

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
      strap: new THREE.MeshPhysicalMaterial({
        map: textures.strap,
        side: THREE.DoubleSide,
        roughness: 0.78,
        metalness: 0,
        sheen: 0.25,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color("#3A6EA5"),
      }),
    };
  }, [textures]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  const ribbonGeo = useMemo(() => ribbonGeometry(), []);
  useEffect(() => () => ribbonGeo.dispose(), [ribbonGeo]);
  const ribbon = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(Array.from({ length: 6 }, () => new THREE.Vector3()));
    c.curveType = "centripetal";
    return c;
  }, []);
  const tmp = useMemo(
    () => ({
      vec: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      ang: new THREE.Vector3(),
      rot: new THREE.Vector3(),
      point: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      side: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      cardQuat: new THREE.Quaternion(),
      twist: new THREE.Quaternion(),
      identity: new THREE.Quaternion(),
      samples: Array.from({ length: RIBBON_SAMPLES }, () => new THREE.Vector3()),
    }),
    [],
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j3, j4, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useSphericalJoint(j4, card, [[0, 0, 0], [0, HANG_Y, 0]]);

  // Per physics step (not per rendered frame): gently turn the card back to face the viewer.
  useBeforePhysicsStep(() => {
    const body = card.current;
    if (!body || dragged) return;
    const { ang, rot } = tmp;
    ang.copy(body.angvel() as THREE.Vector3);
    rot.copy(body.rotation() as unknown as THREE.Vector3);
    body.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, false);
  });

  // Release the drag even if the pointer is let go outside the canvas.
  useEffect(() => {
    if (!dragged) return;
    const end = () => setDragged(false);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
  }, [dragged]);

  // While dragging on touch screens, stop the page from scrolling.
  useEffect(() => {
    if (!dragged) return;
    const el = gl.domElement;
    const block = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", block, { passive: false });
    return () => el.removeEventListener("touchmove", block);
  }, [dragged, gl]);

  useFrame((state) => {
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !j4.current || !card.current) return;
    const { vec, dir, point, tangent, side, normal, cardQuat, twist, identity, samples } = tmp;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, j4, fixed].forEach((r) => r.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    // Safety net: anything non-finite or far away -> put the card back.
    const t = card.current.translation();
    if (!Number.isFinite(t.x + t.y + t.z) || Math.abs(t.x) > 30 || Math.abs(t.y) > 30 || Math.abs(t.z) > 30) {
      const reset = (r: RapierRigidBody, y: number) => {
        r.setTranslation({ x: 0, y, z: 0 }, true);
        r.setLinvel({ x: 0, y: 0, z: 0 }, true);
        r.setAngvel({ x: 0, y: 0, z: 0 }, true);
      };
      [j1, j2, j3, j4].forEach((r, i) => reset(r.current, ANCHOR_Y - SEGMENT * (i + 1)));
      reset(card.current, ANCHOR_Y - SEGMENT * SEGMENTS - HANG_Y);
      card.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      return;
    }

    // Spline through the drawn (interpolated) rope, ending straight out of the crimp.
    const drawn = cardMesh.current;
    if (!drawn || !g1.current || !g2.current || !g3.current) return;
    drawn.updateWorldMatrix(true, false);
    curve.points[0].copy(ANCHOR);
    g1.current.getWorldPosition(curve.points[1]);
    g2.current.getWorldPosition(curve.points[2]);
    g3.current.getWorldPosition(curve.points[3]);
    drawn.localToWorld(curve.points[4].set(0, CRIMP_TOP + 0.22, 0));
    drawn.localToWorld(curve.points[5].set(0, CRIMP_TOP - 0.02, 0));

    // Ribbon frame: flat side follows world X at the top and the card's X at the crimp, so it twists.
    drawn.getWorldQuaternion(cardQuat);
    if (!ribbon.current) return;
    const geo = ribbon.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const nor = geo.attributes.normal as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const half = STRAP_W / 2;
    let length = 0;
    for (let i = 0; i < RIBBON_SAMPLES; i++) {
      curve.getPoint(i / (RIBBON_SAMPLES - 1), samples[i]);
      if (i > 0) length += samples[i].distanceTo(samples[i - 1]);
    }
    let along = length;
    for (let i = 0; i < RIBBON_SAMPLES; i++) {
      const u = i / (RIBBON_SAMPLES - 1);
      if (i > 0) along -= samples[i].distanceTo(samples[i - 1]);
      curve.getTangent(u, tangent);
      twist.slerpQuaternions(identity, cardQuat, u * u * (3 - 2 * u));
      side.set(1, 0, 0).applyQuaternion(twist);
      side.addScaledVector(tangent, -side.dot(tangent)).normalize();
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
  });

  const grab = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = card.current.translation();
    setDragged(new THREE.Vector3().copy(e.point).sub(new THREE.Vector3(p.x, p.y, p.z)));
    onGrab?.();
  };

  return (
    <>
      <group position={[0, ANCHOR_Y, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
          <group ref={g1} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
          <group ref={g2} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
          <group ref={g3} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={j4} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2.5, -HANG_Y, 0]}
          ref={card}
          {...segmentProps}
          angularDamping={2.5}
          linearDamping={2.5}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[CARD_W / 2, CARD_H / 2, 0.02]} />
          <group
            ref={cardMesh}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture?.(e.pointerId);
              setDragged(false);
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
        </RigidBody>
      </group>
      <mesh ref={ribbon} geometry={ribbonGeo} material={materials.strap} frustumCulled={false} />
    </>
  );
}

/** Keeps the card at a similar share of the frame on phones and wide screens. */
function CameraRig() {
  const get = useThree((s) => s.get);
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const camera = get().camera;
    const aspect = width / Math.max(1, height);
    camera.position.z = THREE.MathUtils.clamp(11.6 / aspect, 9.5, 14);
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
      <Physics gravity={[0, -40, 0]} timeStep={1 / 60} interpolate updatePriority={-50} numSolverIterations={8}>
        <Band onGrab={onCardGrab} onReady={onReady} />
      </Physics>
      <Environment resolution={512} frames={1}>
        <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
        <Lightformer intensity={6} color="#9FD6FF" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
      </Environment>
    </>
  );
}
