"use client";

import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
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
  metalness: 0.95,
  roughness: 0.15,
  envMapIntensity: 1.5,
});

// Dark Brushed Metal for Top Anchor
const darkMetalMaterial = new THREE.MeshStandardMaterial({
  color: "#1E293B",
  metalness: 0.8,
  roughness: 0.3,
});

// Card Rim Polycarbonate Material
const cardRimMaterial = new THREE.MeshPhysicalMaterial({
  color: "#07172F",
  roughness: 0.2,
  metalness: 0.1,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
});

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

  // Textures
  const frontTexData = useMemo(() => {
    const data = createCardFrontTexture();
    data.texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    return data;
  }, [gl]);

  const backTexData = useMemo(() => {
    const data = createCardBackTexture();
    data.texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    return data;
  }, [gl]);

  const strapTexData = useMemo(() => {
    const data = createLanyardStrapTexture();
    data.texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    return data;
  }, [gl]);

  useEffect(() => {
    return () => {
      frontTexData.cleanup();
      backTexData.cleanup();
      strapTexData.cleanup();
    };
  }, [frontTexData, backTexData, strapTexData]);

  // Perfectly Matched Joint Anchors (Zero initial drop snap)
  useSphericalJoint(anchorRef, j0Ref, [
    [0, 0, 0],
    [0, 0.2, 0],
  ]);
  useSphericalJoint(j0Ref, j1Ref, [
    [0, -0.2, 0],
    [0, 0.2, 0],
  ]);
  useSphericalJoint(j1Ref, j2Ref, [
    [0, -0.2, 0],
    [0, 0.2, 0],
  ]);
  useSphericalJoint(j2Ref, cardRef, [
    [0, -0.2, 0],
    [0, 0.76, 0],
  ]);

  // Extruded Card Core Shape
  const cardShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 2.4;
    const h = 1.514;
    const r = 0.12;
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
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 16,
    };
    const geo = new THREE.ExtrudeGeometry(cardShape, extrudeSettings);
    geo.center();
    return geo;
  }, [cardShape]);

  // MeshLine Strap Geometry & Material
  const lineGeo = useMemo(() => new MeshLineGeometry(), []);
  const lineMat = useMemo(() => {
    if (!strapTexData.texture) return null;
    const mat = new MeshLineMaterial({
      map: strapTexData.texture,
      useMap: 1,
      lineWidth: 0.16,
      color: new THREE.Color("#FFFFFF"),
      resolution: new THREE.Vector2(size.width, size.height),
    });
    mat.depthTest = true;
    mat.transparent = true;
    return mat;
  }, [strapTexData, size]);
  const strapMesh = useMemo(() => (lineMat ? new THREE.Mesh(lineGeo, lineMat) : null), [lineGeo, lineMat]);

  // Front & Back Physical Materials
  const frontMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: frontTexData.texture,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }, [frontTexData]);

  const backMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      map: backTexData.texture,
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      reflectivity: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }, [backTexData]);

  // Pointer Drag Handlers
  const handlePointerDown = useCallback(
    (e: {
      stopPropagation: () => void;
      target: EventTarget | null;
      pointerId: number;
      point: THREE.Vector3;
    }) => {
      e.stopPropagation();
      const el = e.target as HTMLElement | null;
      if (el?.setPointerCapture) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      setIsDragging(true);
      onCardGrab?.();
      document.body.style.cursor = "grabbing";

      if (cardRef.current) {
        const tCard = cardRef.current.translation();
        dragOffset.current.set(
          e.point.x - tCard.x,
          e.point.y - tCard.y,
          e.point.z - tCard.z
        );
        cardRef.current.wakeUp();
      }
    },
    [onCardGrab]
  );

  const handlePointerUp = useCallback(
    (e: { target: EventTarget | null; pointerId: number }) => {
      const el = e.target as HTMLElement | null;
      if (el?.releasePointerCapture) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      setIsDragging(false);
      document.body.style.cursor = isHovered ? "grab" : "auto";

      if (cardRef.current) {
        const vel = cardRef.current.linvel();
        cardRef.current.setLinvel(
          {
            x: THREE.MathUtils.clamp(vel.x * 0.4, -2, 2),
            y: THREE.MathUtils.clamp(vel.y * 0.4, -2, 2),
            z: THREE.MathUtils.clamp(vel.z * 0.4, -2, 2),
          },
          true
        );
        cardRef.current.wakeUp();
      }
    },
    [isHovered]
  );

  // Frame Loop
  useFrame((state) => {
    if (
      !anchorRef.current ||
      !j0Ref.current ||
      !j1Ref.current ||
      !j2Ref.current ||
      !cardRef.current
    ) {
      return;
    }

    const tAnchor = anchorRef.current.translation();
    const tj0 = j0Ref.current.translation();
    const tj1 = j1Ref.current.translation();
    const tj2 = j2Ref.current.translation();
    const tCard = cardRef.current.translation();
    const rCard = cardRef.current.rotation();

    // Compute top clip position on the card in world space
    const cardTopLocal = new THREE.Vector3(0, 0.76, 0);
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

    // Dragging physics
    if (isDragging) {
      state.raycaster.ray.intersectPlane(dragPlane, targetPoint.current);
      if (targetPoint.current) {
        const curr = cardRef.current.translation();
        const target = targetPoint.current.clone().sub(dragOffset.current);

        target.x = THREE.MathUtils.clamp(target.x, -2.2, 2.2);
        target.y = THREE.MathUtils.clamp(target.y, -1.4, 1.4);

        const diff = target.sub(curr);
        const speed = Math.min(diff.length() * 16, 18);
        const v = diff.normalize().multiplyScalar(speed);

        if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) {
          cardRef.current.setLinvel({ x: v.x, y: v.y, z: v.z }, true);
          cardRef.current.wakeUp();
        }
      }
    } else {
      // Natural settling torque: keep card resting facing forward with subtle organic idle sway
      const r = cardRef.current.rotation();
      const q = new THREE.Quaternion(r.x, r.y, r.z, r.w).normalize();
      const euler = new THREE.Euler().setFromQuaternion(q, "YXZ");
      const angvel = cardRef.current.angvel() || { x: 0, y: 0, z: 0 };
      const t = state.clock.getElapsedTime();
      const breeze = Math.sin(t * 1.5) * 0.005;

      const tx = -(Number.isFinite(euler.x) ? euler.x : 0) * 0.25 - (Number.isFinite(angvel.x) ? angvel.x : 0) * 0.08;
      const ty = -(Number.isFinite(euler.y) ? euler.y : 0) * 0.35 - (Number.isFinite(angvel.y) ? angvel.y : 0) * 0.08 + breeze;
      const tz = -(Number.isFinite(euler.z) ? euler.z : 0) * 0.25 - (Number.isFinite(angvel.z) ? angvel.z : 0) * 0.08;

      if (Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(tz)) {
        cardRef.current.applyTorqueImpulse({ x: tx, y: ty, z: tz }, true);
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

      {/* 2. Top Anchor Body (y = 2.2) */}
      <RigidBody ref={anchorRef} type="fixed" position={[0, 2.2, 0]} colliders={false}>
        <mesh material={darkMetalMaterial} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 20]} />
        </mesh>
        <mesh material={chromeMaterial} position={[0, -0.04, 0]}>
          <torusGeometry args={[0.08, 0.018, 16, 24]} />
        </mesh>
      </RigidBody>

      {/* 3. Rope Segment RigidBodies (y = 2.0, 1.6, 1.2) */}
      <RigidBody
        ref={j0Ref}
        position={[0, 2.0, 0]}
        mass={0.05}
        linearDamping={0.4}
        angularDamping={0.4}
        colliders={false}
      >
        <BallCollider args={[0.05]} />
      </RigidBody>

      <RigidBody
        ref={j1Ref}
        position={[0, 1.6, 0]}
        mass={0.05}
        linearDamping={0.4}
        angularDamping={0.4}
        colliders={false}
      >
        <BallCollider args={[0.05]} />
      </RigidBody>

      <RigidBody
        ref={j2Ref}
        position={[0, 1.2, 0]}
        mass={0.05}
        linearDamping={0.4}
        angularDamping={0.4}
        colliders={false}
      >
        <BallCollider args={[0.05]} />
      </RigidBody>

      {/* 4. Card RigidBody (y = 0.24) */}
      <RigidBody
        ref={cardRef}
        position={[0, 0.24, 0]}
        mass={1.4}
        linearDamping={1.2}
        angularDamping={1.5}
        restitution={0.08}
        colliders={false}
      >
        <CuboidCollider args={[1.2, 0.76, 0.02]} />

        {/* Group containing card meshes and clip */}
        <group
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
            <planeGeometry args={[2.4, 1.514]} />
          </mesh>

          {/* Back Face Plane */}
          <mesh
            position={[0, 0, -0.02]}
            rotation={[0, Math.PI, 0]}
            material={backMaterial}
          >
            <planeGeometry args={[2.4, 1.514]} />
          </mesh>

          {/* Metal Clip & Loop attached to top of card */}
          <group position={[0, 0.76, 0]}>
            {/* Top Clasp / Clamp */}
            <mesh material={chromeMaterial} position={[0, 0.01, 0]} castShadow>
              <boxGeometry args={[0.32, 0.12, 0.05]} />
            </mesh>
            {/* Connecting Steel Ring */}
            <mesh
              material={chromeMaterial}
              position={[0, 0.1, 0]}
              rotation={[0, 0, 0]}
              castShadow
            >
              <torusGeometry args={[0.08, 0.018, 16, 24]} />
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
    // Dynamically adjust camera z based on viewport width for optimal framing
    if (size.width < 480) {
      camera.position.set(0, 0.1, 7.2);
    } else if (size.width < 768) {
      camera.position.set(0, 0.05, 6.6);
    } else {
      camera.position.set(0, 0, 6.0);
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return (
    <>
      {/* Dynamic Studio Lighting */}
      <ambientLight intensity={1.1} />
      <directionalLight
        position={[5, 8, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, -3, 4]} intensity={0.5} color="#8FB8E8" />
      <directionalLight position={[0, -4, 3]} intensity={0.3} color="#FFFFFF" />

      {/* Code-generated Environment & Lightformers */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3.5}
          scale={[12, 6, 1]}
          position={[0, 6, -8]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          color="#018BCE"
          intensity={4.5}
          scale={[6, 10, 1]}
          position={[-8, 0, -2]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={2.5}
          scale={5}
          position={[0, 0, 8]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          color="#0F548D"
          intensity={3.0}
          scale={6}
          position={[6, 3, -4]}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* Ground Depth Contact Shadows */}
      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.55}
        scale={7}
        blur={2.0}
        far={4.0}
        color="#05101E"
      />

      {/* Rapier Physics World */}
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} interpolate>
        <LanyardPhysicsCard onCardGrab={onCardGrab} />
      </Physics>
    </>
  );
}
