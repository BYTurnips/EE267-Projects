
export function fShaderRaycast() {
    return `
    varying vec2 textureCoords;

    uniform float time;
    uniform vec3 testcolor;

    // Focus vector passed in and interpolated from vertex shader
    varying vec3 focusVector;
    // Virtual scene vertices for ray cast collision detection
    uniform sampler2D sceneVertices;
    // Camera position in world space
    uniform vec3 cameraPos;

    void main() {
        vec3 colorsc = testcolor * textureCoords.x;
        gl_FragColor = vec4(colorsc, time);
    }
    `
}
