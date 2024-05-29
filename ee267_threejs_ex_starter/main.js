/*
 *  Primary driver file for the application.
 */

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { VirtualWorld } from './scene.js'
import { vShaderRaycast } from './raycast_vshader.js';
import { fShaderRaycast } from './raycast_fshader.js';


// Display Parameters (and based on lecture)
const virtualD = Math.abs(1. / (1. / 40. - 1 / 18.))
const mag = 40. / (40. - 18.) 
const virtualH = 74.5 * mag
// Divided by 2 because we only get half the viewport
const virtualW = 132.5 * mag / 2
const ipd = 64


// Three.js stats object
let stats;

// Virtual scene variables
let virtualWorld;
let theta = 0;      // Current angle of virtualCamera on orbit
const rad = 5;      // Radius of orbit of virtualCamera

// let vCamPosition;   // Position of virtual camera
// let vCamLook;       // Looking direction of virtual camera
// let vCamUp;         // Up direction of virtual camera

// Static real scene variables (essentially setting up two TVs)
let renderer;  // Render object
let fullQuadL, fullQuadR;      // Fullscreen quads for stereo shaders
let realCameraL, realCameraR;  // Stereo for viewing quads
let realSceneL, realSceneR;    // Scenes for placing quads

// Dyanmic real scene material (must change uniforms to recompute)
let matQuadL, matQuadR;

init();
animate();

function init() {
    // Add Stats
    stats = new Stats();
    document.body.appendChild(stats.dom);

    // Initial Virtual Scene
    virtualWorld = new VirtualWorld();

    // Create Real Scene
    realSceneL = new THREE.Scene();
    realSceneR = new THREE.Scene();
    realCameraL = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight, 0.1, 1000);
    realCameraR = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const matQuad = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 1 },
            testcolor: { value: new THREE.Color(0xff0000) },
            cameraPos: { value: new THREE.Vector3() },
            cameraLook: { value: new THREE.Vector3() },
            cameraUp: { value: new THREE.Vector3() },
            quadDepth: { value: virtualD },
            quadHeight: { value: virtualH },
            quadWidth: { value: virtualW },
            sceneVertices: { value: virtualWorld.triangleDataTexture }
        },
        vertexShader: vShaderRaycast(),
        fragmentShader: fShaderRaycast(),
    });

    matQuadL = matQuad.clone();
    matQuadR = matQuad.clone();

    fullQuadL = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matQuadL);
    fullQuadR = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matQuadR);

    realSceneL.add(fullQuadL);
    realSceneR.add(fullQuadR);

    realCameraL.position.z = 1;
    realCameraR.position.z = 1;
    realCameraL.aspect = window.innerWidth / 2 / window.innerHeight;
    realCameraL.updateProjectionMatrix();
    realCameraR.aspect = window.innerWidth / 2 / window.innerHeight;
    realCameraR.updateProjectionMatrix();

    // Add listeners
    window.addEventListener('resize', onWindowResize);
}

function updateQuadUniforms() {
    const cameraLook = new THREE.Vector3(); 
    virtualWorld.camera.getWorldDirection(cameraLook);
    const cameraUp = virtualWorld.camera.up.clone();
    const cameraRight = new THREE.Vector3().crossVectors(cameraLook, cameraUp);

    const cameraPosL = virtualWorld.camera.position.clone();
    cameraPosL.sub(cameraRight.clone().multiplyScalar(ipd / 2))
    const cameraPosR = virtualWorld.camera.position.clone();
    cameraPosR.add(cameraRight.clone().multiplyScalar(ipd / 2))
    
    fullQuadL.material.uniforms.cameraPos.value = cameraPosL;
    fullQuadL.material.uniforms.cameraLook.value = cameraLook;
    fullQuadL.material.uniforms.cameraUp.value = cameraUp;

    fullQuadR.material.uniforms.cameraPos.value = cameraPosR;
    fullQuadR.material.uniforms.cameraLook.value = cameraLook;
    fullQuadR.material.uniforms.cameraUp.value = cameraUp;

    fullQuadL.material.uniforms.time.value += 0.002
    if (fullQuadL.material.uniforms.time.value >= 1)
        fullQuadL.material.uniforms.time.value = 0
}

function onWindowResize() {
    realCameraL.aspect = window.innerWidth / 2 / window.innerHeight;
    realCameraL.updateProjectionMatrix();
    realCameraR.aspect = window.innerWidth / 2 / window.innerHeight;
    realCameraR.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    stats.update();

    /******** Virtual Scene Transformations ********/
    // virtualWorld.orbitCamera();
    updateQuadUniforms();

    /**************** Scene Render ****************/
    render('real')
}

function render(scenetype) {
    if (scenetype == 'real') {
        renderer.setScissorTest(true);

        const stereoW = window.innerWidth / 2
        const stereoH = window.innerHeight
    
        renderer.setViewport(0, 0, stereoW, stereoH);
        renderer.setScissor(0, 0, stereoW, stereoH);
        renderer.render(realSceneL, realCameraL);
    
        renderer.setViewport(stereoW, 0, stereoW, stereoH);
        renderer.setScissor(stereoW, 0, stereoW, stereoH);
        renderer.render(realSceneR, realCameraR);
    
        renderer.setScissorTest(false);
    }
    else if (scenetype == 'virtual') {
        renderer.render(virtualWorld.scene, virtualWorld.camera)
    }
}
