/*
 *  Generates the virtual scene features.
 */
import * as THREE from 'three';

export class VirtualScene {
    // Scene variable
    scene = null;

    // Data Texture Construction for the meshes in the scene
    triangleData = null;
    triangleDataTexture = null;

    constructor(numBoxes) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Populate the scene with random boxes
        const geometry = new THREE.BoxGeometry();

        for (let i = 0; i < numBoxes; i++) {
            const object = new THREE.Mesh(geometry, this.makeBoxMaterials());

            object.position.x = Math.random() * 40 - 20;
            object.position.y = Math.random() * 40 - 20;
            object.position.z = Math.random() * 40 - 20;

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;

            object.scale.x = Math.random() + 0.5;
            object.scale.y = Math.random() + 0.5;
            object.scale.z = Math.random() + 0.5;

            this.scene.add(object);
        }
        this.updateSceneBuffer();
        return this;
    }

    makeBoxMaterials() {
        const mats = []
        for (let i = 0; i < 6; i++) {
            const facecolor = Math.random() * 0xffffff;
            mats.push(new THREE.MeshBasicMaterial({ color: facecolor }))
        }
        return mats;
    }

    collectTriangleData(scene) {
        const data = [];

        scene.traverse((object) => {
            if (object.isMesh) {
                const geometry = object.geometry;
                if (geometry instanceof THREE.BufferGeometry) {
                    const materials = object.material; // Array of materials
                    const positions = geometry.getAttribute('position');
                    const indexAttribute = geometry.getIndex();

                    // Iterate through face groups
                    for (let i = 0; i < geometry.groups.length; i++) {
                        const group = geometry.groups[i];
                        const material = Array.isArray(materials) 
                            ? materials[group.materialIndex] : materials;
                        const color = material.color;

                        // Iterate through each triangle in the group
                        for (let j = group.start; j < group.start + group.count; j += 3) {
                            const v1Index = indexAttribute.getX(j);
                            const v2Index = indexAttribute.getX(j + 1);
                            const v3Index = indexAttribute.getX(j + 2);

                            const v1 = new THREE.Vector3().fromBufferAttribute(positions, v1Index);
                            const v2 = new THREE.Vector3().fromBufferAttribute(positions, v2Index);
                            const v3 = new THREE.Vector3().fromBufferAttribute(positions, v3Index);

                            // Push vertices
                            data.push(v1.x, v1.y, v1.z, 1.0);
                            data.push(v2.x, v2.y, v2.z, 1.0);
                            data.push(v3.x, v3.y, v3.z, 1.0);

                            // Push color of triangle
                            data.push(color.r, color.g, color.b, 1.0); // RGBA
                        }
                    }
                }
            }
        });
        return data;
    }

    updateSceneBuffer() {
        this.triangleData = this.collectTriangleData(this.scene)

        // 4 * 4 coordinates per triangle
        const numTriangles = this.triangleData.length / 16;

        // RGBA format
        const data = new Float32Array(this.triangleData.length);
        data.set(this.triangleData);

        const texture = new THREE.DataTexture(
            data, 16, numTriangles, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;
    }
}
