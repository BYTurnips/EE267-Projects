
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
    uniform vec3 cameraPos;        // Camera Position
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
    
    vec3 calculateFocus() {
        vec3 cameraRight = cross(cameraLook, cameraUp);
        
        vec3 focusVector = cameraLook * quadDepth + 
            (uv[0] - 0.5) * quadWidth * cameraRight + 
            (uv[1] - 0.5) * quadHeight * cameraUp;
        return focusVector;
    }

    void main() {
        textureCoords = uv;
        focusVector = calculateFocus();
        gl_Position = vec4( position, 1.0 );
    }
    `
}

/*
 * Unit tests in fshader:
 *  1. Animated test shader
 *  2. Check if focusVector is normalized
 *  3. Check if focusVector is within a certain angle of Look Direction
 *  4. Check if focusVector is within a certain angle of the camera in 
 *      world coordinates (by inspection)
 *  5. Check for camera position
 *  Linear ray collision with a hardcoded triangle in space
 *      6. Check for presence with the cameraLook
 *      7. Check for presence with the focusVector
 *      8. Check for distance with the focusVector
 *  - Linear ray collision with first triangle in mesh 
 *      (make sure it's facing the camera)
 *  - Linear ray collision with all triangles in mesh
 *  - Iterative ray casting produces distance map (should be radial gradient)
 *  - Iterative non-linear ray casting produces resulting distance map
 *  - Iterative linear ray casting with a hardcoded triangle in space
 *  - Iterative linear ray casting with all triangles in mesh
 *  - Custom ray casting function with all triangles in mesh
 */