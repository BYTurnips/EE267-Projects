/*
 *  Primary driver file for the application.
 */

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import { VirtualScene } from './scene.js'
import { vShaderRaycast } from './raycast_vshader.js';
import { fShaderRaycast } from './raycast_fshader.js';

// Three.js stats object
let stats;

// Virtual scene variables
let virtualScene;
let virtualCamera;
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
    virtualScene = new VirtualScene(100);
    virtualCamera = new THREE.PerspectiveCamera(
        70, window.innerWidth / window.innerHeight, 0.1, 1000);

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

    matQuadL = new THREE.ShaderMaterial({
        uniforms: {
            time: 0,
            testcolor: { value: new THREE.Color(0xff0000) },
        },
        vertexShader: vShaderRaycast(),
        fragmentShader: fShaderRaycast(),
    });

    matQuadR = new THREE.ShaderMaterial({
        uniforms: {
            time: 0,
            testcolor: { value: new THREE.Color(0x0000ff) },
        },
        vertexShader: vShaderRaycast(),
        fragmentShader: fShaderRaycast(),
    });

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
    matQuadR = new THREE.ShaderMaterial({
        uniforms: {
            time: 0,
            testcolor: { value: new THREE.Color(0x0000ff) },
        },
        vertexShader: vShaderRaycast(),
        fragmentShader: fShaderRaycast(),
    });
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

    /***************** Virtual Scene Transformations **************/
    theta += 0.1;
    virtualCamera.position.x = rad * Math.sin(THREE.MathUtils.degToRad(theta));
    virtualCamera.position.y = rad * Math.sin(THREE.MathUtils.degToRad(theta));
    virtualCamera.position.z = rad * Math.cos(THREE.MathUtils.degToRad(theta));
    virtualCamera.lookAt(virtualScene.scene.position);

    /**************** Real Scene Stereo Render ****************/
    // renderer.setScissorTest(true);

    // const stereoW = window.innerWidth / 2
    // const stereoH = window.innerHeight

    // renderer.setViewport(0, 0, stereoW, stereoH);
    // renderer.setScissor(0, 0, stereoW, stereoH);
    // renderer.render(realSceneL, realCameraL);

    // renderer.setViewport(stereoW, 0, stereoW, stereoH);
    // renderer.setScissor(stereoW, 0, stereoW, stereoH);
    // renderer.render(realSceneR, realCameraR);

    // renderer.setScissorTest(false);

    renderer.render(virtualScene.scene, virtualCamera)
}
