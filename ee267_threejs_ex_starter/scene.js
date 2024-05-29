/*
 *  Generates the virtual scene features.
 */
import * as THREE from 'three';

const numBoxes = 100
let theta = 0;      // Current angle of virtualCamera on orbit
const rad = 5;      // Radius of orbit of virtualCamera

export class VirtualWorld {
    // Scene variable
    scene = null;

    // Camera variable
    camera = null;

    // Data and DataTextures representing the scene (must be updated manually)
    numMeshes = 0;
    numTriangles = 0;
    triangleData = [];
    triangleDataTexture = null;

    constructor() {
        /******** Build the Scene *******/
        // this.makeRandomBoxScene()
        this.makeBasicBoxScene(0, 0, -400, 200)

        /******** Place the Camera *******/
        this.initCamera(window.innerWidth / window.innerHeight)
        this.placeCamera(0, 0, 0)

        /******** Update the Scene Buffers *******/
        this.updateSceneData()
    }

    debug() {
        // Create a box geometry
        let a = new THREE.Vector3();
        let b = new THREE.Vector3();
        let c = new THREE.Vector3();
        const boxGeometry = new THREE.BoxGeometry();
        let pos = boxGeometry.attributes.position;
        let idx = boxGeometry.index;
        let faces = idx.count / 3;
        let ct = 0;
        for (let i = 0; i < faces; i++) {
            a.fromBufferAttribute(pos, idx.getX(i * 3 + 0));
            b.fromBufferAttribute(pos, idx.getX(i * 3 + 1));
            c.fromBufferAttribute(pos, idx.getX(i * 3 + 2));
            console.log(a)
            console.log(b)
            console.log(c)
            ct += 3
        }
        console.log("This many points:", ct)
    }

    initCamera(aspect) {
        this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 1000);
    }

    placeCamera(x, y, z) {
        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;
        this.camera.lookAt(this.scene.position);
    }

    orbitCamera() {
        theta += 0.1;
        const cam = this.camera
        cam.position.x = rad * Math.sin(THREE.MathUtils.degToRad(theta));
        cam.position.y = rad * Math.sin(THREE.MathUtils.degToRad(theta));
        cam.position.z = rad * Math.cos(THREE.MathUtils.degToRad(theta));
        cam.lookAt(this.scene.position);
    }

    // Populate the scene with random boxes
    makeRandomBoxScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        const boxgeo = new THREE.BoxGeometry();

        for (let i = 0; i < numBoxes; i++) {
            const matcolor = Math.random() * 0xffffff
            const object = new THREE.Mesh(boxgeo,
                new THREE.MeshBasicMaterial({ color: matcolor }));

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
        this.scene.background = new THREE.Color(0x000000);

        const boxgeo = new THREE.BoxGeometry(scale, scale, scale, 1, 1, 1);

        const debugobj = new THREE.Mesh(boxgeo,
            new THREE.MeshBasicMaterial({ color: 0xC00C80 }));
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
                
                let v1 = new THREE.Vector3();
                let v2 = new THREE.Vector3();
                let v3 = new THREE.Vector3();
                for (let i = 0; i < geoindex.count; i += 3) {
                    this.numTriangles += 1;

                    const color = obj.material.color;

                    v1.fromBufferAttribute(positions, geoindex.getX(i + 0))
                    const v1w = obj.localToWorld(v1)

                    v2.fromBufferAttribute(positions, geoindex.getX(i + 1))
                    const v2w = obj.localToWorld(v2)

                    v3.fromBufferAttribute(positions, geoindex.getX(i + 2))
                    const v3w = obj.localToWorld(v3)

                    // Push vertices
                    this.triangleData.push(v1w.x, v1w.y, v1w.z, 1.0);
                    this.triangleData.push(v2w.x, v2w.y, v2w.z, 1.0);
                    this.triangleData.push(v3w.x, v3w.y, v3w.z, 1.0);

                    // Push color
                    this.triangleData.push(color.r, color.g, color.b, 1.0);
                }
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
