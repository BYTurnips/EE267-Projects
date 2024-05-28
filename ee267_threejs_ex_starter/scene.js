/*
 *  Generates the virtual scene and camera features.
 *  Contains both constants (meshes) and changing values (camera angle)
 *  Is designed to export two materials for shading Left and Right
 *  Fullscreen Quads for stereo raycasting.
 */
import * as THREE from 'three';

export class VirtualScene {
    // Interpupillary distance for stereo rendering
    ipd = 64

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
        const vertices = [];

        scene.traverse((object) => {
            if (object.isMesh) {
                const geometry = object.geometry;
                const positions = geometry.getAttribute('position');

                for (let i = 0; i < positions.count; i += 3) {
                    const v1 = new THREE.Vector3().fromBufferAttribute(positions, i);
                    const v2 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
                    const v3 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

                    vertices.push(v1.x, v1.y, v1.z);
                    vertices.push(v2.x, v2.y, v2.z);
                    vertices.push(v3.x, v3.y, v3.z);
                }
            }
        });

        return vertices;
    }

    updateSceneBuffer() {
        this.triangleData = this.collectTriangleData(this.scene)

        // 9 coordinates per triangle
        const numTriangles = this.triangleData.length / 9;

        // RGB format
        const data = new Float32Array(this.triangleData.length);
        data.set(this.triangleData);
    
        const texture = new THREE.DataTexture(
            data, 9, numTriangles, THREE.RGBFormat, THREE.FloatType);
        texture.needsUpdate = true;
    }
}
