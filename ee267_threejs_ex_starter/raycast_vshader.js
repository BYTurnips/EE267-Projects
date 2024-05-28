
export function vShaderRaycast() {
    return `
    /**
    * varying qualifier is used for passing variables from a vertex shader
    * to a fragment shader. In the fragment shader, these variables are
    * linearly interpolated between neighboring vertexes.
    */
    varying vec2 textureCoords;

    // Four texture coordinates of the rectangle:
    // (0,1), (1,1), (0,0), (1,0)
    // attribute vec2 uv;

    // Uniforms determine camera DoF
    uniform vec3 cameraPosition;        // Camera Position
    uniform vec3 cameraLook;            // Camera Looking Vector
    uniform vec3 cameraUp;              // Camera Up Vector

    uniform float quadDepth;            // Virtual Depth of Quad
    uniform float quadHeight;           // Virtual Height of Quad
    uniform float quadWidth;            // Virtual Width of Quad

    /* 
     * Focus vector represents the initial direction from the camera
     * to the given vertex on the viewport.
     */
    varying vec3 focusVector;
    
    void calculateFocus() {
        // Probably will use uv, cameraPosition, cameraLook, cameraUp
        // Keep in mind it's stereo view, so uv maps to half the viewport

        // hi pino
    }

    void main() {
        textureCoords = uv;
        focusVector = calculateFocus();
        gl_Position = vec4( position, 1.0 );
    }
    `
}
