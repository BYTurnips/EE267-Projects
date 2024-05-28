
export function fShaderRaycast() {
    return `
    varying vec2 textureCoords;
    // uniform float time;
    uniform vec3 testcolor;

    // Focus vector passed in and interpolated from vertex shader
    varying vec3 focusVector;
    // Virtual scene vertices for ray cast collision detection
    uniform sampler2D sceneVertices;

    void main() {
        vec3 colorsc = testcolor * textureCoords.x;
        // colorsc.x = mod(colorsc.x + time, 1.0);
        // colorsc.x = mod(colorsc.y + time, 1.0);
        // colorsc.x = mod(colorsc.z + time, 1.0);
        gl_FragColor = vec4(colorsc, 1.0);
    }
    `
}
