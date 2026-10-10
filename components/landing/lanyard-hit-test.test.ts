import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { hitTestLanyard } from "./lanyard-scene";

describe("hitTestLanyard (Touch raycast hit testing)", () => {
  const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
  camera.position.set(0, 0, 12);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const boxGeo = new THREE.BoxGeometry(3.2, 2.0, 0.1);
  const mat = new THREE.MeshBasicMaterial();
  const cardMesh = new THREE.Mesh(boxGeo, mat);
  cardMesh.position.set(0, 0, 0);
  cardMesh.updateMatrixWorld();

  const rect = { left: 100, top: 100, width: 400, height: 400 };

  it("returns true when touch client coordinates hit the card mesh", () => {
    // Touch directly in the center of the canvas: (300, 300)
    const touch = { clientX: 300, clientY: 300 };
    const hit = hitTestLanyard(touch, rect, camera, [cardMesh]);
    expect(hit).toBe(true);
  });

  it("returns false when touch client coordinates are on empty canvas space", () => {
    // Touch in the top-left corner of canvas: (110, 110)
    const touch = { clientX: 110, clientY: 110 };
    const hit = hitTestLanyard(touch, rect, camera, [cardMesh]);
    expect(hit).toBe(false);
  });

  it("returns false when touch coordinates are outside rect bounds", () => {
    const touchOutside = { clientX: 50, clientY: 50 };
    const hit = hitTestLanyard(touchOutside, rect, camera, [cardMesh]);
    expect(hit).toBe(false);
  });

  it("returns false when rect has zero or negative dimensions", () => {
    const touch = { clientX: 300, clientY: 300 };
    expect(hitTestLanyard(touch, { left: 0, top: 0, width: 0, height: 400 }, camera, [cardMesh])).toBe(false);
    expect(hitTestLanyard(touch, { left: 0, top: 0, width: 400, height: 0 }, camera, [cardMesh])).toBe(false);
  });

  it("hits nested children inside a Group (e.g. card face and hardware meshes)", () => {
    const group = new THREE.Group();
    const child = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1), mat);
    child.position.set(0, 1, 0);
    group.add(child);
    group.updateMatrixWorld(true);

    // Touch center-upper where child is positioned
    const touch = { clientX: 300, clientY: 260 };
    const hit = hitTestLanyard(touch, rect, camera, [group]);
    expect(hit).toBe(true);
  });
});
