"use client";

import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  BallCollider,
  CuboidCollider,
} from "@react-three/rapier";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import {
  createCardFrontTexture,
  createCardBackTexture,
  createLanyardStrapTexture,
} from "./card-textures";

// Chrome / Stainless Steel Material for Clip & Rings
const chromeMaterial = new THREE.MeshStandardMaterial({
  color: "#E2E8F0",
  metalness: 0.92,
  roughness: 0.2,
  envMapIntensity: 1.2,
});

// Card Rim Polycarbonate Material (Deep navy)
const cardRimMaterial = new THREE.MeshPhysicalMaterial({
  color: "#081E38",
  roughness: 0.3,
  metalness: 0.05,
  clearcoat: 0.3,
  clearcoatRoughness: 0.2,
});

// Rest positions for all bodies (Exact mathematical zero-strain equilibrium)
const REST_ANCHOR: [number, number, number] = [0, 2.70, 0];
const REST_J0: [number, number, number] = [0, 2.30, 0];
const REST_J1: [number, number, number] = [0, 1.80, 0];
const REST_J2: [number, number, number] = [0, 1.30, 0];
const REST_CARD: [number, number, number] = [0, 0.23, 0];

function LanyardPhysicsCard({ onCardGrab }: { onCardGrab?: () => void }) {
  const { gl, size } = useThree();

  // Rigid Body References
  const anchorRef = useRef<RapierRigidBody>(null!);
  const j0Ref = useRef<RapierRigidBody>(null!);
  const j1Ref = useRef<RapierRigidBody>(null!);
  const j2Ref = useRef<RapierRigidBody>(null!);
  const cardRef = useRef<RapierRigidBody>(null!);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragOffset = useRef(new THREE.Vector3());
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const targetPoint = useRef(new THREE.Vector3());
  const smoothedTarget = useRef(new THREE.Vector3(...REST_CARD));

  // Textures
  const frontTexData = useMemo(() => {
    const data = createCardFrontTexture();
    data.texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return data;
  }, [gl]);

  const backTexData = useMemo(() => {
    const data = createCardBackTexture();
    data.texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return data;
  }, [gl]);

  const strapTexData = useMemo(() => {
    const data = createLanyardStrapTexture();
    data.texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return data;
  }, [gl]);

  useEffect(() => {
    return () => {
      frontTexData.cleanup();
      backTexData.cleanup();
      strapTexData.cleanup();
    };
  }, [frontTexData, backTexData, strapTexData]);

  // Rope Joints linking segments (fixed max distance constraint)
  useRopeJoint(anchorRef, j0Ref, [
    [0, 0, 0],
    [0, 0.12, 0],
    0.28,
  ]);
  useRopeJoint(j0Ref, j1Ref, [
    [0, -0.12, 0],
    [0, 0.12, 0],
    0.28,
  ]);
  useRopeJoint(j1Ref, j2Ref, [
    [0, -0.12, 0],
    [0, 0.12, 0],
    0.28,
  ]);

  // Last segment linked to top clip of card with spherical joint
  useSphericalJoint(j2Ref, cardRef, [
    [0, -0.12, 0],
    [0, 0.95, 0],
  ]);

  // Extruded Card Core Shape (ISO ID-1 proportions, enlarged for hero presentation: 3.0 x 1.892)
  const cardShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 3.0;
    const h = 1.892;
    const r = 0.14;
    const x = -w / 2;
    const y = -h / 2;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }, []);

  const cardCoreGeometry = useMemo(() => {
    const extrudeSettings = {
      steps: 1,
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 3,
      curveSegments: 16,
    };
    const geo = new THREE.ExtrudeGeometry(cardShape, extrudeSettings);
    geo.center();
    return geo;
  }, [cardShape]);

  // MeshLine Strap Geometry & Material (Wide realistic woven lanyard strap)
  const lineGeo = useMemo(() => new MeshLineGeometry(), []);
  const lineMat = useMemo(() => {
    if (!strapTexData.texture) return null;
    const mat = new MeshLineMaterial({
      map: strapTexData.texture,
      useMap: 1,
      lineWidth: 0.32,
      color: new THREE.Color("#FFFFFF"),
      resolution: new THREE.Vector2(size.width, size.height),
    });
    mat.depthTest = true;
    mat.transparent = true;
    return mat;
  }, [strapTexData, size]);
  const strapMesh = useMemo(() => (lineMat ? new THREE.Mesh(lineGeo, lineMat) : null), [lineGeo, lineMat]);

  // Front & Back Physical Materials (Tuned to avoid washing out, rich deep navy contrast)
  const frontMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: frontTexData.texture,
      roughness: 0.35,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.25,
      reflectivity: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }, [frontTexData]);

  const backMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: backTexData.texture,
      roughness: 0.4,
      metalness: 0.0,
      clearcoat: 0.25,
      clearcoatRoughness: 0.25,
      reflectivity: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }, [backTexData]);

  // Reset safety net helper
  const resetToRestPose = useCallback(() => {
    if (!cardRef.current || !j0Ref.current || !j1Ref.current || !j2Ref.current) return;
    try {
      j0Ref.current.setTranslation({ x: REST_J0[0], y: REST_J0[1], z: REST_J0[2] }, true);
      j0Ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      j0Ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      j1Ref.current.setTranslation({ x: REST_J1[0], y: REST_J1[1], z: REST_J1[2] }, true);
      j1Ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      j1Ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      j2Ref.current.setTranslation({ x: REST_J2[0], y: REST_J2[1], z: REST_J2[2] }, true);
      j2Ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      j2Ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      cardRef.current.setBodyType(0, true); // Dynamic
      cardRef.current.setTranslation({ x: REST_CARD[0], y: REST_CARD[1], z: REST_CARD[2] }, true);
      cardRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      cardRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      cardRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      smoothedTarget.current.set(...REST_CARD);
    } catch {
      // ignore
    }
  }, []);

  // Pointer Drag Handlers: switch to kinematicPosition during drag
  const handlePointerDown = useCallback(
    (e: {
      stopPropagation: () => void;
      target: EventTarget | null;
      pointerId: number;
      point: THREE.Vector3;
    }) => {
      e.stopPropagation();
      setIsDragging(true);
      onCardGrab?.();
      document.body.style.cursor = "grabbing";

      if (cardRef.current) {
        // Switch to KinematicPositionBased (type 2) so card follows pointer cleanly
        cardRef.current.setBodyType(2, true);

        const tCard = cardRef.current.translation();
        dragOffset.current.set(
          e.point.x - tCard.x,
          e.point.y - tCard.y,
          0
        );
        smoothedTarget.current.set(tCard.x, tCard.y, tCard.z);
      }
    },
    [onCardGrab]
  );

  const endDrag = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = isHovered ? "grab" : "auto";

    if (cardRef.current) {
      // Switch back to Dynamic (type 0)
      cardRef.current.setBodyType(0, true);

      // Clamp release velocities for a clean physical drop & swing
      const lv = cardRef.current.linvel();
      cardRef.current.setLinvel(
        {
          x: THREE.MathUtils.clamp(lv.x * 0.5, -4, 4),
          y: THREE.MathUtils.clamp(lv.y * 0.5, -4, 4),
          z: THREE.MathUtils.clamp(lv.z * 0.5, -3, 3),
        },
        true
      );
      cardRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      cardRef.current.wakeUp();
    }
  }, [isHovered]);

  // Global window listener for pointer up/cancel to handle fast drags outside the canvas
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        endDrag();
      }
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [isDragging, endDrag]);

  // Frame Loop
  useFrame((state, delta) => {
    if (
      !anchorRef.current ||
      !j0Ref.current ||
      !j1Ref.current ||
      !j2Ref.current ||
      !cardRef.current
    ) {
      return;
    }

    // Safety check: Clamp dt to prevent explosion after tab background pause
    const dt = Math.min(delta, 1 / 30);

    const tAnchor = anchorRef.current.translation();
    const tj0 = j0Ref.current.translation();
    const tj1 = j1Ref.current.translation();
    const tj2 = j2Ref.current.translation();
    const tCard = cardRef.current.translation();
    const rCard = cardRef.current.rotation();

    // SAFETY NET: Check for NaN or runaway bodies
    if (
      !Number.isFinite(tCard.x) ||
      !Number.isFinite(tCard.y) ||
      !Number.isFinite(tCard.z) ||
      Math.abs(tCard.x) > 6 ||
      Math.abs(tCard.y) > 6 ||
      Math.abs(tCard.z) > 4
    ) {
      resetToRestPose();
      return;
    }

    // Compute top clip position on the card in world space
    const cardTopLocal = new THREE.Vector3(0, 0.95, 0);
    const cardQuat = new THREE.Quaternion(rCard.x, rCard.y, rCard.z, rCard.w).normalize();
    const cardTopWorld = cardTopLocal.applyQuaternion(cardQuat).add(tCard);

    // Update CatmullRom curve points for the lanyard strap
    if (
      Number.isFinite(tAnchor.x) &&
      Number.isFinite(tj0.x) &&
      Number.isFinite(tj1.x) &&
      Number.isFinite(tj2.x) &&
      Number.isFinite(cardTopWorld.x)
    ) {
      const curvePoints = [
        new THREE.Vector3(tAnchor.x, tAnchor.y, tAnchor.z),
        new THREE.Vector3(tj0.x, tj0.y, tj0.z),
        new THREE.Vector3(tj1.x, tj1.y, tj1.z),
        new THREE.Vector3(tj2.x, tj2.y, tj2.z),
        cardTopWorld,
      ];

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const sampledPoints = curve.getPoints(32);
      lineGeo.setPoints(sampledPoints);
    }

    if (lineMat) {
      lineMat.resolution.set(state.size.width, state.size.height);
    }

    // DRAGGING (Kinematic translation update toward pointer)
    if (isDragging) {
      state.raycaster.ray.intersectPlane(dragPlane, targetPoint.current);
      if (targetPoint.current) {
        const rawTargetX = targetPoint.current.x - dragOffset.current.x;
        const rawTargetY = targetPoint.current.y - dragOffset.current.y;

        // Clamp drag reach to avoid pulling beyond anchor limit
        const clampedTarget = new THREE.Vector3(
          THREE.MathUtils.clamp(rawTargetX, -2.4, 2.4),
          THREE.MathUtils.clamp(rawTargetY, -1.5, 2.0),
          0
        );

        // Smooth lerp to target
        smoothedTarget.current.lerp(clampedTarget, Math.min(1.0, 18 * dt));

        cardRef.current.setNextKinematicTranslation({
          x: smoothedTarget.current.x,
          y: smoothedTarget.current.y,
          z: smoothedTarget.current.z,
        });

        // Tilt card based on drag direction
        const tiltZ = -(clampedTarget.x - tCard.x) * 0.4;
        const tiltQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tiltZ));
        cardRef.current.setNextKinematicRotation(tiltQuat);

        // Wake up joints so they follow kinematic movement
        j0Ref.current.wakeUp();
        j1Ref.current.wakeUp();
        j2Ref.current.wakeUp();
      }
    } else {
      // NATURAL SETTLING (Dynamic): PD controller restoring torque to keep card facing forward
      const q = new THREE.Quaternion(rCard.x, rCard.y, rCard.z, rCard.w).normalize();
      const euler = new THREE.Euler().setFromQuaternion(q, "YXZ");
      const angvel = cardRef.current.angvel() || { x: 0, y: 0, z: 0 };
      const t = state.clock.getElapsedTime();
      const breeze = Math.sin(t * 1.6) * 0.004;

      const tx = -(Number.isFinite(euler.x) ? euler.x : 0) * 0.35 - (Number.isFinite(angvel.x) ? angvel.x : 0) * 0.1;
      const ty = -(Number.isFinite(euler.y) ? euler.y : 0) * 0.45 - (Number.isFinite(angvel.y) ? angvel.y : 0) * 0.1 + breeze;
      const tz = -(Number.isFinite(euler.z) ? euler.z : 0) * 0.35 - (Number.isFinite(angvel.z) ? angvel.z : 0) * 0.1;

      if (Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(tz)) {
        cardRef.current.applyTorqueImpulse({ x: tx, y: ty, z: tz }, true);
      }

      // Clamp velocities to prevent physics tunneling
      const lv = cardRef.current.linvel();
      if (lv) {
        const speed = Math.sqrt(lv.x * lv.x + lv.y * lv.y + lv.z * lv.z);
        if (speed > 12) {
          const scale = 12 / speed;
          cardRef.current.setLinvel({ x: lv.x * scale, y: lv.y * scale, z: lv.z * scale }, true);
        }
      }
    }
  });

  return (
    <>
      {/* 1. Strap Mesh */}
      {strapMesh && (
        <primitive
          object={strapMesh}
          renderOrder={1}
        />
      )}

      {/* 2. Top Anchor Body (y = 3.2, above top edge of canvas out of view) */}
      <RigidBody ref={anchorRef} type="fixed" position={REST_ANCHOR} colliders={false}>
        <mesh material={chromeMaterial} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
        </mesh>
      </RigidBody>

      {/* 3. Rope Segment RigidBodies with balanced masses and high damping */}
      <RigidBody
        ref={j0Ref}
        position={REST_J0}
        mass={0.5}
        linearDamping={2.5}
        angularDamping={2.5}
        colliders={false}
      >
        <BallCollider args={[0.06]} />
      </RigidBody>

      <RigidBody
        ref={j1Ref}
        position={REST_J1}
        mass={0.5}
        linearDamping={2.5}
        angularDamping={2.5}
        colliders={false}
      >
        <BallCollider args={[0.06]} />
      </RigidBody>

      <RigidBody
        ref={j2Ref}
        position={REST_J2}
        mass={0.5}
        linearDamping={2.5}
        angularDamping={2.5}
        colliders={false}
      >
        <BallCollider args={[0.06]} />
      </RigidBody>

      {/* 4. Card RigidBody */}
      <RigidBody
        ref={cardRef}
        position={REST_CARD}
        mass={1.4}
        linearDamping={2.5}
        angularDamping={3.0}
        restitution={0.05}
        colliders={false}
      >
        <CuboidCollider args={[1.5, 0.946, 0.02]} />

        {/* Group containing card meshes and clip */}
        <group
          onPointerDown={handlePointerDown}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerOver={() => {
            setIsHovered(true);
            if (!isDragging) document.body.style.cursor = "grab";
          }}
          onPointerOut={() => {
            setIsHovered(false);
            if (!isDragging) document.body.style.cursor = "auto";
          }}
        >
          {/* Card Extruded Beveled Rim Core */}
          <mesh geometry={cardCoreGeometry} material={cardRimMaterial} castShadow />

          {/* Front Face Plane */}
          <mesh position={[0, 0, 0.02]} material={frontMaterial}>
            <planeGeometry args={[3.0, 1.892]} />
          </mesh>

          {/* Back Face Plane */}
          <mesh
            position={[0, 0, -0.02]}
            rotation={[0, Math.PI, 0]}
            material={backMaterial}
          >
            <planeGeometry args={[3.0, 1.892]} />
          </mesh>

          {/* Metal Clip & Loop attached to top of card */}
          <group position={[0, 0.95, 0]}>
            {/* Top Stainless Steel Clasp */}
            <mesh material={chromeMaterial} position={[0, 0.02, 0]} castShadow>
              <boxGeometry args={[0.42, 0.14, 0.06]} />
            </mesh>
            {/* Connecting Steel Ring */}
            <mesh
              material={chromeMaterial}
              position={[0, 0.12, 0]}
              rotation={[0, 0, 0]}
              castShadow
            >
              <torusGeometry args={[0.1, 0.022, 16, 24]} />
            </mesh>
          </group>
        </group>
      </RigidBody>
    </>
  );
}

export function LanyardScene({ onCardGrab }: { onCardGrab?: () => void }) {
  const { size, camera } = useThree();

  useEffect(() => {
    // Responsive camera framing: card is prominent (~70% width on mobile, hero product on desktop)
    if (size.width < 480) {
      camera.position.set(0, 0.25, 5.2);
    } else if (size.width < 768) {
      camera.position.set(0, 0.25, 4.8);
    } else {
      camera.position.set(0, 0.25, 4.6);
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return (
    <>
      {/* Studio Lighting tuned for rich deep navy contrast (No washing out) */}
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-4, -2, 3]} intensity={0.4} color="#8FB8E8" />
      <directionalLight position={[0, -4, 2]} intensity={0.2} color="#FFFFFF" />

      {/* Code-generated Soft Environment & Lightformers (No direct front white glare) */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.0}
          scale={[10, 5, 1]}
          position={[0, 5, -6]}
          color="#FFFFFF"
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          color="#018BCE"
          intensity={2.5}
          scale={[5, 8, 1]}
          position={[-6, 0, -2]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          color="#0F548D"
          intensity={1.8}
          scale={5}
          position={[6, 2, -3]}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* Ground Depth Contact Shadows */}
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.45}
        scale={6}
        blur={2.0}
        far={3.5}
        color="#05101E"
      />

      {/* Rapier Physics World with fixed timestep & gravity [0, -40, 0] */}
      <Physics gravity={[0, -40, 0]} timeStep={1 / 60} interpolate>
        <LanyardPhysicsCard onCardGrab={onCardGrab} />
      </Physics>
    </>
  );
}
