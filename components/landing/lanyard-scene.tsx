"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { Environment, Lightformer, RoundedBox, useCursor } from "@react-three/drei";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { CARD_TEX_H, CARD_TEX_W, SLOT, createCardTextures } from "./card-textures";

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
// Hardware stack, bottom to top: split ring through the slot → swivel eye → barrel → strap end cap.
const STRAP_W = 0.6;
const RING_R = 0.15;
const RING_Y = SLOT_Y + RING_R;
const EYE_R = 0.055;
const EYE_Y = SLOT_Y + RING_R * 2 + 0.028;
const BARREL_H = 0.13;
const BARREL_Y = EYE_Y + EYE_R + BARREL_H / 2 - 0.008;
const CAP_H = 0.2;
const CAP_Y = BARREL_Y + BARREL_H / 2 + CAP_H / 2 - 0.01;
const HANG_Y = CAP_Y + CAP_H / 2 - 0.03; // where the strap attaches, in card space

export const CAMERA_FOV = 25;

const SEGMENT = 0.95;
const ANCHOR_Y = 4.5;

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

const segmentProps: RigidBodyProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 4,
  linearDamping: 4,
};

type Lerped = { current: THREE.Vector3 | null };

function Band({ onGrab }: { onGrab?: () => void }) {
  const { gl, size } = useThree();
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const cardMesh = useRef<THREE.Group>(null);
  const lerp1 = useRef<Lerped["current"]>(null);
  const lerp2 = useRef<Lerped["current"]>(null);

  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
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
      metal: new THREE.MeshStandardMaterial({ color: "#DCE4EC", metalness: 1, roughness: 0.18 }),
      cap: new THREE.MeshPhysicalMaterial({ color: "#C7D1DB", metalness: 1, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
      capLine: new THREE.MeshStandardMaterial({ color: "#7D8A98", metalness: 1, roughness: 0.4 }),
    };
  }, [textures]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  const band = useMemo(() => {
    const geometry = new MeshLineGeometry();
    const material = new MeshLineMaterial({
      map: textures.strap,
      useMap: 1,
      repeat: new THREE.Vector2(-1.75, 1),
      // meshline widths are in clip space: world width = lineWidth * tan(fov / 2).
      lineWidth: STRAP_W / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2)),
      color: new THREE.Color("#FFFFFF"),
      resolution: new THREE.Vector2(1, 1),
    });
    return new THREE.Mesh(geometry, material);
  }, [textures]);
  useEffect(() => () => {
    band.geometry.dispose();
    (band.material as THREE.Material).dispose();
  }, [band]);
  useEffect(() => {
    (band.material as MeshLineMaterial).resolution.set(size.width, size.height);
  }, [band, size]);

  const curve = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(Array.from({ length: 5 }, () => new THREE.Vector3()));
    c.curveType = "chordal";
    return c;
  }, []);
  const tmp = useMemo(
    () => ({
      vec: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      ang: new THREE.Vector3(),
      rot: new THREE.Vector3(),
    }),
    [],
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, HANG_Y, 0]]);

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

  useFrame((state, delta) => {
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) return;
    const dt = Math.min(delta, 1 / 20);
    const { vec, dir, ang, rot } = tmp;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((r) => r.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    // Safety net: anything non-finite or far away → put the card back.
    const t = card.current.translation();
    if (!Number.isFinite(t.x + t.y + t.z) || Math.abs(t.x) > 30 || Math.abs(t.y) > 30 || Math.abs(t.z) > 30) {
      const reset = (r: RapierRigidBody, y: number) => {
        r.setTranslation({ x: 0, y, z: 0 }, true);
        r.setLinvel({ x: 0, y: 0, z: 0 }, true);
        r.setAngvel({ x: 0, y: 0, z: 0 }, true);
      };
      reset(j1.current, ANCHOR_Y - SEGMENT);
      reset(j2.current, ANCHOR_Y - SEGMENT * 2);
      reset(j3.current, ANCHOR_Y - SEGMENT * 3);
      reset(card.current, ANCHOR_Y - SEGMENT * 3 - HANG_Y);
      card.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      lerp1.current = null;
      lerp2.current = null;
      return;
    }

    // Smooth the two middle points so the strap doesn't jitter.
    const smooth = (ref: Lerped, body: RapierRigidBody) => {
      const p = body.translation();
      if (!ref.current) ref.current = new THREE.Vector3(p.x, p.y, p.z);
      const dist = Math.max(0.1, Math.min(1, ref.current.distanceTo(p as THREE.Vector3)));
      ref.current.lerp(p as THREE.Vector3, Math.min(1, dt * (10 + dist * 40)));
      return ref.current;
    };
    // The strap leaves the top of the cap straight along the card's up axis, using the card exactly
    // as it is drawn this frame (interpolated) rather than the raw physics pose.
    const drawn = cardMesh.current;
    if (!drawn) return;
    drawn.updateWorldMatrix(true, false);
    drawn.localToWorld(curve.points[0].set(0, CAP_Y + CAP_H / 2 - 0.004, 0));
    drawn.localToWorld(curve.points[1].set(0, CAP_Y + CAP_H / 2 + 0.16, 0));
    curve.points[2].copy(smooth(lerp2, j2.current));
    curve.points[3].copy(smooth(lerp1, j1.current));
    curve.points[4].copy(fixed.current.translation() as THREE.Vector3);
    (band.geometry as MeshLineGeometry).setPoints(curve.getPoints(64));

    // Gently turn the card back to face the viewer.
    ang.copy(card.current.angvel() as THREE.Vector3);
    rot.copy(card.current.rotation() as unknown as THREE.Vector3);
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
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
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, -HANG_Y, 0]}
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
              <torusGeometry args={[RING_R, 0.019, 24, 64]} />
            </mesh>
            {/* Swivel eye, interlocked with the ring */}
            <mesh material={materials.metal} position={[0, EYE_Y, 0]} rotation={[0, -Math.PI * 0.18, 0]}>
              <torusGeometry args={[EYE_R, 0.014, 16, 40]} />
            </mesh>
            {/* Swivel barrel */}
            <mesh material={materials.metal} position={[0, BARREL_Y, 0]}>
              <cylinderGeometry args={[0.032, 0.042, BARREL_H, 32]} />
            </mesh>
            <mesh material={materials.metal} position={[0, BARREL_Y - BARREL_H / 2 + 0.012, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.024, 32]} />
            </mesh>
            {/* End cap crimped onto the strap */}
            <RoundedBox args={[STRAP_W + 0.1, CAP_H, 0.08]} radius={0.03} smoothness={5} position={[0, CAP_Y, 0]} material={materials.cap} />
            <mesh material={materials.capLine} position={[0, CAP_Y - CAP_H * 0.28, 0]}>
              <boxGeometry args={[STRAP_W + 0.118, 0.016, 0.098]} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <primitive object={band} />
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

export function LanyardScene({ onCardGrab }: { onCardGrab?: () => void }) {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={Math.PI * 0.55} />
      <directionalLight position={[3, 5, 6]} intensity={1.2} />
      <Physics gravity={[0, -40, 0]} timeStep={1 / 60} interpolate updatePriority={-50}>
        <Band onGrab={onCardGrab} />
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
