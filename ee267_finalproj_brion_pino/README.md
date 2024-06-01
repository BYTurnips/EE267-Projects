# Final Project for EE 267 Spring 2024
### Written by Brion Ye (brionqiye@gmail.com) and Pino Cholsaipant (pschol@stanford.edu)

## What it does
This project aims to create a custom iterative ray casting engine for the purposes of exploring the consequences of exploring non-linear light rays.
It is written purely using THREE.js and GLSL libraries. Take a look at our report for more information!

## Repository Anatomy
This code was created from scratch without following any predefined template.
Below are the important files that contribute to the graphics pipeline:
 - `index.html` is the HTML code that embeds the graphics script into the browser to use WebGL
 - `main.js` is the main driver script that initializes the real scene (stereo full screen quads) and connects textures and event listeners
 - `scene.js` is where the virtual scene is generated (i.e what we should see in the scene from a single camera)
 - `raycast_vshader.js` contains the text for the GLSL vertex shader. This shader computes the "focusVector", the vector between the camera point and a given pixel on the virtual screen.
 - `raycast_fshader.js` contains the text for the GLSL fragment shader. This shader is where the majority of the computation happens: given a focusVector and cameraPosition, the ray is iteratively stepped through its journey, updating its position and velocity each time based on the provided (possibly non-linear) transformation function.

## How to run
Follow the package installation on this page to install the required libraries: [text](https://threejs.org/docs/#manual/en/introduction/Installation)

Specifically:
 - Make sure Node.js is installed
 - Navigate to this project's root directory
 - `npm install --save three`
 - `npm install --save-dev vite`
 - `npx vite`
 - Follow the hosting link (likely localhost:5173)

 Have fun!
