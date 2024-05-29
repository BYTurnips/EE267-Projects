/*
 *  Generates the virtual scene features.
 */
import * as THREE from 'three';

let theta = 0;      // Current angle of virtualCamera on orbit
const rad = 400;      // Radius of orbit of virtualCamera

export class VirtualWorld {
    // Scene variable
    scene = null;
    bgcolor = new THREE.Color("black");

    // Camera variable
    camera = null;

    // Data and DataTextures representing the scene (must be updated manually)
    numMeshes = 0;
    numTriangles = 0;
    triangleData = [];
    triangleDataTexture = null;

    constructor() {
        /******** Build the Scene *******/
        // this.makeRandomBoxScene(10)
        this.makeBasicBoxScene(0, 0, 0, 100)

        /******** Place the Camera *******/
        this.initCamera(window.innerWidth / window.innerHeight)
        this.translateCamera(0, 0, 400)

        /******** Update the Scene Buffers *******/
        this.updateSceneData()

        this.debug()
    }

    debug() {
        const D = this.triangleData
        for (let i = 0; i < D.length; i += 16) {
            console.log(
                "V1: ", D[i], D[i + 1], D[i + 2],
                "V2: ", D[i + 4], D[i + 5], D[i + 6],
                "V3: ", D[i + 8], D[i + 9], D[i + 10]
            )
        }
    }

    initCamera(aspect) {
        this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 1000);
    }

    translateCamera(x, y, z) {
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;
    }

    orbitCamera() {
        theta += 0.5;
        const cam = this.camera
        cam.position.x = rad * Math.sin(THREE.MathUtils.degToRad(theta));
        cam.position.y = rad * Math.sin(THREE.MathUtils.degToRad(theta));
        cam.position.z = rad * Math.cos(THREE.MathUtils.degToRad(theta));
        cam.lookAt(this.scene.position);
    }

    // Populate the scene with random boxes
    makeRandomBoxScene(numBoxes) {
        this.scene = new THREE.Scene();
        this.scene.background = this.bgcolor;

        const boxgeo = new THREE.BoxGeometry();

        for (let i = 0; i < numBoxes; i++) {
            const object = new THREE.Mesh(boxgeo, this.makeBoxMaterials());

            object.position.x = Math.random() * 20 - 10;
            object.position.y = Math.random() * 20 - 10;
            object.position.z = Math.random() * 40 - 20;

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;

            object.scale.x = Math.random() * 2 + 1;
            object.scale.y = Math.random() * 2 + 1;
            object.scale.z = Math.random() * 2 + 1;

            this.scene.add(object);
        }
    }

    // Add single box for debug
    makeBasicBoxScene(x, y, z, scale) {
        this.scene = new THREE.Scene();
        this.scene.background = this.bgcolor;

        const boxgeo = new THREE.BoxGeometry(scale, scale, scale, 1, 1, 1);

        const debugobj = new THREE.Mesh(boxgeo, this.makeBoxMaterials() );
        debugobj.position.x = x;
        debugobj.position.y = y;
        debugobj.position.z = z;

        this.scene.add(debugobj);
    }

    // Make box materials
    makeBoxMaterials() {
        const mats = []
        for (let i = 0; i < 6; i++) {
            const facecolor = Math.random() * 0xffffff;
            mats.push(new THREE.MeshBasicMaterial({ color: facecolor }))
        }
        return mats;
    }

    updateSceneData() {
        this.numMeshes = 0;
        this.numTriangles = 0;

        // Collect data about all mesh triangles in the scene
        this.scene.traverse((obj) => {
            if (obj.isMesh & obj.geometry instanceof THREE.BufferGeometry) {
                this.numMeshes += 1;

                const positions = obj.geometry.getAttribute('position');
                const geoindex = obj.geometry.index
                const materials = obj.material

                let v1 = new THREE.Vector3();
                let v2 = new THREE.Vector3();
                let v3 = new THREE.Vector3();
                // Traverse each face group to get the correct material for each triangle
                obj.geometry.groups.forEach(group => {
                    const start = group.start;
                    const count = group.count;
                    const materialIndex = group.materialIndex;
                    const material = Array.isArray(materials) ?
                        materials[materialIndex] : materials;
                    const color = material.color;

                    for (let i = start; i < start + count; i += 3) {
                        this.numTriangles += 1;

                        v1.fromBufferAttribute(positions, geoindex.getX(i + 0));
                        const v1w = obj.localToWorld(v1.clone());

                        v2.fromBufferAttribute(positions, geoindex.getX(i + 1));
                        const v2w = obj.localToWorld(v2.clone());

                        v3.fromBufferAttribute(positions, geoindex.getX(i + 2));
                        const v3w = obj.localToWorld(v3.clone());

                        // Push vertices
                        this.triangleData.push(v1w.x, v1w.y, v1w.z, 1.0);
                        this.triangleData.push(v2w.x, v2w.y, v2w.z, 1.0);
                        this.triangleData.push(v3w.x, v3w.y, v3w.z, 1.0);

                        // Push color
                        this.triangleData.push(color.r, color.g, color.b, 1.0);
                    }
                })
            }
        });

        // Pack triangle data into a DataTexture
        this.triangleDataTexture = new THREE.DataTexture(
            new Float32Array(this.triangleData),
            4,  // 0, 1, 2 = Vertices; 3 = Color
            this.numTriangles,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        this.triangleDataTexture.needsUpdate = true;
    }
}
