
export function fShaderRaycast() {
    return `

    /****** Uniforms and input parameters ******/

    // Debug parameters
    varying vec2 textureCoords;
    uniform float time;
    uniform vec3 testcolor;

    // Focus vector passed in and interpolated from vertex shader
    varying vec3 focusVector;

    // Virtual scene parameters
    uniform sampler2D sceneVertices;
    uniform vec3 sceneBackground;

    // Virtual camera DoF parameters
    uniform vec3 cameraPos;  // Camera position in world space
    uniform vec3 cameraLook; // Camera looking direction
    uniform vec3 camearUp;   // Camera up direction

    // Performance parameters
    uniform float maxIterations;
    uniform float maxRayDistance;

    /****** Unit test prototypes ******/
    vec4 T1testColorTime();
    vec4 T2focusVectorNormalized();
    vec4 T3angleFromLookAt();
    vec4 T4angleFromNegativeZ();
    vec4 T5cameraPosTest();
    vec4 T6linearRayCollisionWithHardcodedTriangle();
    vec4 T7linearRayCollisionWithOneTriangle();
    vec4 T8linearRayCollisionWithAllTriangles();
    vec4 T9linearRayPaintingWithAllTriangles();
    vec4 T10iterRayDistanceMap();
    vec4 T11nonLinearIterRayDistanceMap();
    vec4 T12iterRayHardcodedTriangle();
    vec4 T13iterRayAllTriangles();


    /****** Raycast transformation functions ******/
    
    // Straight line rays
    vec3[2] expMap(vec3 p, vec3 v, float deltaT) {
        return vec3[2](p + v * deltaT, v);
    }

    // Flow along zero curvature curves of S^1 x RR (cylinder)
    vec3[2] expMapCircle(vec3 p, vec3 v, float deltaT) {
        float R = 600.;
        vec2 r = normalize(vec2(-v.y, v.x)) * R;

        vec2 new_r = normalize(r + R * tan(deltaT * length(v.xy) / R) * normalize(v.xy) ) * R;
        // vec2 new_r = normalize(r + v.xy * deltaT) * R;
        vec2 move = new_r - r;
        vec2 new_pxy = p.xy + move;
        vec3 new_pxyz = vec3(new_pxy.x, new_pxy.y, p.z + v.z * deltaT);

        vec2 new_vxy = -normalize(vec2(-new_r.y, new_r.x)) * length(v.xy);
        vec3 new_vxyz = vec3(new_vxy, v.z);

        return vec3[2](new_pxyz, new_vxyz);
    }

    // Curves follow a hyperbolic space H^1 x RR
    vec3[2] expMapPoincareHalf(vec3 p, vec3 v, float deltaT) {
        vec2 pHyper = p.xy;
        vec2 vHyper = v.xy;
        vec2 y = vec2(0, 1);
        vec2 origin = cameraPos.xy - vec2(50., 50.);
        vec2 n = vec2(-vHyper.y, vHyper.x);

        vec3 newV;
        vec3 newP;
        if (dot(n, y) != 0.) {
            float lambda = (dot(origin, y) - dot(pHyper, y)) / dot(n, y);
            vec2 r = -lambda * n;
            float R = length(r);
            vec2 newR = normalize(r + R * tan(deltaT * length(vHyper) / R) * normalize(vHyper) ) * R;
            vec2 newPHyper = pHyper + newR - r;
            newP = vec3(newPHyper.x, newPHyper.y, p.z + v.z * deltaT);

            vec2 newVHyper = normalize(vec2(newR.y, -newR.x)) * length(vHyper);
            newV = vec3(newVHyper, v.z);
        }
        else {
            newV = v;
            newP = vec3(pHyper + vHyper * deltaT, p.z + v.z * deltaT);
        }

        return vec3[2](newP, newV);
    }

    // Light slows down over time
    vec3[2] decayMap(vec3 p, vec3 v, float deltaT) {
        vec3 newV = v * 0.99;
        return vec3[2](p + v * deltaT, newV);
    }

    // Drift rays in world XY direction
    vec3[2] driftMapXY(vec3 p, vec3 v, float deltaT) {
        vec3 newV = v;
        newV.x += 0.1;
        newV.y += 0.1;
        newV = normalize(newV);
        return vec3[2](p + v * deltaT, newV);
    }

    // Drift rays in world Z direction
    vec3[2] driftMapZ(vec3 p, vec3 v, float deltaT) {
        vec3 newV = v;
        newV.z += 0.1;
        newV = normalize(newV);
        return vec3[2](p + v * deltaT, newV);
    }

    // Drift rays along look vector
    vec3[2] driftMapLookTowards(vec3 p, vec3 v, float deltaT) {
        vec3 newV = normalize(v + 0.003 * deltaT * cameraLook);
        return vec3[2](p + v * deltaT, newV);
    }

    // Drift rays away from look vector
    vec3[2] driftMapLookAway(vec3 p, vec3 v, float deltaT) {
        vec3 newV = normalize(v - 0.003 * deltaT * cameraLook);
        return vec3[2](p + v * deltaT, newV);
    }

    // Wrapper function for all the ray transform functions.
    // Try replacing the return function with one of the other ones above!
    vec3[2] rayTransform(vec3 p, vec3 v, float deltaT) {
        return expMapCircle(p, v, deltaT);
    }

    /****** Primary raycast functions ******/

    // Checks if a (linear) ray hits a triangle, and returns its distance
    // Faster algorithm found at https://github.com/niklaskorz/linon/tree/main/src
    // Original algorithm inspired by https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution.html
    float rayTriIntersect(vec3 trig[3], vec3 point, vec3 dir) {
        vec3 e1 = trig[1] - trig[0];
        vec3 e2 = trig[2] - trig[0];
        vec3 h = cross(dir, e2);
        float a = dot(e1, h);

        // Ray is parallel
        if ( abs(a) < 0.0001 ) return -1.;

        float f = 1. / a;
        vec3 s = point - trig[0];
        float u = f * dot(s, h);

        // Ray is away from triangle
        if (u < 0. || u > 1.) return -0.7;
        vec3 q = cross(s, e1);
        float v = f * dot(dir, q);

        // Ray is away from triangle
        if (v < 0. || (u + v > 1.)) return -0.3;
        
        float dist = f * dot(e2, q);
        if (dist > 0.0001) return dist;

        // Distance is negative
        return -1.;

        // /****** Get triangles' plane and determine ray intersection ******/
        // vec3 plane_norm = cross(trig[1] - trig[0], trig[2] - trig[0]);
        // float normDotRay = dot(plane_norm, dir);
        // if ( abs(normDotRay) < 0.00001) return -1.;
        // float plane_offset = -dot(plane_norm, trig[0]);
        // float ray_dist = -(dot(point, plane_norm) + plane_offset) / normDotRay;
        // if (ray_dist < 0.) return -1.;
        // vec3 plane_pt = point + ray_dist * dir;
    
        // /***** Given point on plane, perform triangle test *****/
        // vec3 crossE0P = cross(trig[1] - trig[0], plane_pt - trig[0]);
        // bool side0 = dot(plane_norm, crossE0P) < 0.;
        // vec3 crossE1P = cross(trig[2] - trig[1], plane_pt - trig[1]);
        // bool side1 = dot(plane_norm, crossE1P) < 0.;
        // vec3 crossE2P = cross(trig[0] - trig[2], plane_pt - trig[2]);
        // bool side2 = dot(plane_norm, crossE2P) < 0.;
        // if ((side0 && side1&& side2) || (!side0 && !side1 && !side2))
        //     return ray_dist;
        // else return -1.;
    }

    // Helper function to read the DataTexture properly
    vec4 getSceneData(int columnID, int triangleID) {
        float tX = float(columnID) / float(textureSize(sceneVertices, 0).x);
        float tY = float(triangleID) / float(textureSize(sceneVertices, 0).y);
        return texture2D(sceneVertices, vec2(tX, tY));
    }

    // Find closest front collision with a triangular mesh and get its color
    vec4 colorOnHit(vec3 point, vec3 dir) {
        float minDist = maxRayDistance / maxIterations;
        int best_i = -1;

        // For each triangle, update the distance if the ray hits.
        for (int i = 0; i < textureSize(sceneVertices, 0).y; i++) {
            // Load triangle
            vec3 v1 = getSceneData(0, i).xyz;
            vec3 v2 = getSceneData(1, i).xyz;
            vec3 v3 = getSceneData(2, i).xyz;
            vec3 triangle[3] = vec3[3](v1, v2, v3);

            // Update best triangle based on rayTriIntersect
            float dist = rayTriIntersect(triangle, point, dir);
            if (dist > 0. && dist < minDist) {
                minDist = dist;
                best_i = i;
            }
        }

        // If a triangle was hit, closest triangle color is shown
        if (minDist < maxRayDistance / maxIterations) 
            return getSceneData(3, best_i);

        // If no triangles were hit, return the background color
        return vec4(sceneBackground, 1.);
    }

    // Run the non-linear ray iteratively
    vec4 nonLinearRayCast() {
        float t = 0.;
        vec4 color = vec4(sceneBackground, 1.);

        // Initialize ray to cameraPos and focusVector
        vec3 curP = cameraPos;
        vec3 curV = normalize(focusVector);

        for (float i = 0.; i < maxIterations; i++) {
            // Transform Ray
            vec3 newPV[2] = rayTransform(
                curP, curV, maxRayDistance / maxIterations);
            curP = newPV[0];
            curV = newPV[1];

            // Shoot a linear ray to check for collision
            color = colorOnHit(curP, curV);
            if (color != vec4(sceneBackground, 1.)) break;
        }
        return color;
    }

    void main() {
        gl_FragColor = nonLinearRayCast();
    }

    /**** Unit test functions ****/
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

    vec4 displayError(int code) {
        if (code == 1) return vec4(1.0, 0.0, 0.0, 1.0);
        if (code == 2) return vec4(0.0, 1.0, 0.0, 1.0);
        if (code == 3) return vec4(0.0, 0.0, 1.0, 1.0);
    }

    vec4 displayScalar(float s) {
        return vec4(s, s, s, 1.0);
    }
    
    vec4 displayTriple(vec3 v) {
        return vec4(v.x, v.y, v.z, 1.0);
    }

    // Verifies animatable stereo vision
    vec4 T1testColorTime() {
        vec3 colorsc = testcolor * textureCoords.x * textureCoords.y;
        return vec4(colorsc, time); 
    }

    // Verifies focusVector normalization process
    vec4 T2focusVectorNormalized() {
        vec3 focusVectorN = normalize(focusVector);
        float fvlen = length(focusVectorN);
        return displayScalar(fvlen);
    }

    // Verifies focusVector sweep
    vec4 T3angleFromLookAt() {
        vec3 focusVectorN = normalize(focusVector);
        float cosA = dot(focusVectorN, cameraLook);
        return displayScalar(cosA);
    }

    // Verifies camera look vector
    vec4 T4angleFromNegativeZ() {
        vec3 focusVectorN = normalize(focusVector);
        float cosA = dot(focusVectorN, vec3(0.0, 0.0, -1.0));
        return displayScalar(cosA);
    }

    // Verifies camera DoF values
    vec4 T5cameraPosTest() {
        vec3 color;
        color.x = cameraPos.x;
        color.y = cameraPos.y;
        color.z = cameraPos.z;
        if (cameraPos.x == -32.0) return displayError(1);
        if (cameraPos.x == 32.0) return displayError(2);
        return displayTriple(normalize(color));
    }

    // Should show a triangle on screen with a blue background
    // Verifies rayTriIntersect function
    vec4 T6linearRayCollisionWithHardcodedTriangle() {
        vec3 triangle[3];
        triangle[0] = vec3(100.0, 100.0, -300.0);
        triangle[1] = vec3(100.0, -100.0, -300.0);
        triangle[2] = vec3(100.0, 100.0, -500.0);

        if (abs(cameraPos.x) != 32.) return displayError(1);
        if (cameraPos.y != 0.) return displayError(1);
        if (cameraPos.z != 0.) return displayError(1);

        if (cameraLook.x != 0.) return displayError(2);
        if (cameraLook.y != 0.) return displayError(2);
        if (cameraLook.z != -1.) return displayError(2);

        float dist = rayTriIntersect(triangle, cameraPos, focusVector);
        if (dist <= 0.) return displayError(3);
        else return displayScalar(dist);
    }
    
    // Changing triID should change which triangle is being rendered.
    // Verifies DataTexture retrieval process
    vec4 T7linearRayCollisionWithOneTriangle() {
        int triID = 1;
        vec3 v1 = getSceneData(0, triID).xyz;
        vec3 v2 = getSceneData(1, triID).xyz;
        vec3 v3 = getSceneData(2, triID).xyz;
        vec3 triangle[3] = vec3[3](v1, v2, v3);

        float dist = rayTriIntersect(triangle, cameraPos, focusVector);
        if (dist <= 0.) return displayError(3);
        else return displayScalar(dist);
    }

    // Should render the full scene in white and blue
    // Verifies DataTexture iteration
    vec4 T8linearRayCollisionWithAllTriangles() {
        for (int i = 0; i < textureSize(sceneVertices, 0).y; i++) {
            vec3 v1 = getSceneData(0, i).xyz;
            vec3 v2 = getSceneData(1, i).xyz;
            vec3 v3 = getSceneData(2, i).xyz;
            vec3 triangle[3] = vec3[3](v1, v2, v3);

            float dist = rayTriIntersect(triangle, cameraPos, focusVector);
            if (dist > 0.) return displayScalar(dist);
        }
        return displayError(3);
    }

    // Should render the full scene with colors
    // Verifies colorOnHit
    vec4 T9linearRayPaintingWithAllTriangles() {
        return colorOnHit(cameraPos, focusVector);
    }

    // Should show a radial gradient that's darker on the edges
    vec4 T10iterRayDistanceMap() {
        vec3 focusVectorN = normalize(focusVector);
        
        float t = 0.;
        vec3 curP = cameraPos;
        vec3 curV = focusVectorN;
        while ( t <= 5.) {
            vec3 newPV[2] = expMap(curP, curV, 0.1);
            curP = newPV[0];
            curV = newPV[1];
            t += 0.1;
        }
        return displayScalar(abs(curP.z) / 5.);
    }

    vec4 T11nonLinearIterRayDistanceMap() {
        vec3 focusVectorN = normalize(focusVector);
        
        float t = 0.;
        vec3 curP = cameraPos;
        vec3 curV = focusVectorN;
        while ( t <= 5.) {
            vec3 newPV[2] = driftMapXY(curP, curV, 0.1);
            curP = newPV[0];
            curV = newPV[1];
            t += 0.1;
        }
        return displayScalar(abs(curP.z) / 5.);
    }

    vec4 T12iterRayHardcodedTriangle() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T13iterRayAllTriangles() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }
    `
}
