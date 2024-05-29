
export function fShaderRaycast() {
    return `

    /****** Uniforms and input parameters ******/

    // Debug parameters
    varying vec2 textureCoords;
    uniform float time;
    uniform vec3 testcolor;

    // Focus vector passed in and interpolated from vertex shader
    varying vec3 focusVector;
    // Virtual scene vertices for ray cast collision detection
    uniform sampler2D sceneVertices;
    uniform vec3 cameraPos;  // Camera position in world space
    uniform vec3 cameraLook; // Camera looking direction
    uniform vec3 camearUp;   // Camera up direction

    /****** Unit test prototypes ******/
    vec4 T1testColorTime();
    vec4 T2focusVectorNormalized();
    vec4 T3angleFromLookAt();
    vec4 T4angleFromNegativeZ();
    vec4 T5cameraPosTest();
    vec4 T6linearRayCollisionWithHardcodedTriangle();
    vec4 T7linearRayCollisionWithFirstTriangle();
    vec4 T8linearRayDistanceWithFirstTriangle();
    vec4 T9linearRayCollisionWithAllTriangles();
    vec4 T10iterRayDistanceMap();
    vec4 T11nonLinearIterRayDistanceMap();
    vec4 T12iterRayHardcodedTriangle();
    vec4 T13iterRayAllTriangles();


    /****** Primary raycast functions ******/
    
    // flow from point p along line with zero curvature
    vec3[2] expMap(vec3 p, vec3 v, float deltaT) {
        return vec3[2](p + v * deltaT, v);
    }

    float hitTriangle(vec3 vertices[3], vec3 p, vec3 dir, float eps) {
        vec3 e1 = vertices[1] - vertices[0];
        vec3 e2 = vertices[2] - vertices[0];
        vec3 h = cross(dir, e2);
        float a = dot(e1, h);

        if (a > - eps && a < eps) {
            return -1.;
        }
        else {
            float f = 1. / a;
            vec3 s = p - vertices[0];
            float u = f * dot(s, h);
            if (u < 0. || u > 1.) {
                return -0.5;
            }
            vec3 q = cross(s, e1);
            float v = f * dot(dir, q);
            if (v < 0. || (u + v > 1.)) {
                return -1.;
            }
            float dist = f * dot(e2, q);
            return dist;
            // if (dist > eps) {
            //     return dist;
            // }
        }
        return -1.;
    }

    // find closest front collision with a triangular mesh and get color

    vec4 colOnHit(vec3 p, vec3 dir, float maxDist, float eps) {
        float distMin = -1.;
        vec3 e1;
        vec3 e2;
        int n = textureSize(sceneVertices, 0).x; // num triangles
        n = 1200;
        int best_i = 0;
        
        vec3 ptest = vec3(0., 0., 0.);
        vec3 vtest = vec3(1., 0., 0.);

        vec3 v1 = ptest + vtest +  vec3(0., 0., 1.);
        vec3 v2 = ptest + vtest + vec3(0. ,1., 0.);
        vec3 v3 = ptest + vtest + vec3(0., -1., -1.);
        vec3 vertices[3] = vec3[3](v1, v2, v3);
        float curDist = hitTriangle(vertices, cameraPos, focusVector, eps);
        return vec4(abs(curDist), 0., 0., 1.);
        if (distMin > 0. && distMin < maxDist) {
            return vec4(1., 1., 0., 1.);
        }
        
        // for (int i = 0; i < n; i++) {
        //     // vec3 v1 = texture2D(sceneVertices, vec2(0, i)).xyz;
        //     // vec3 v2 = texture2D(sceneVertices, vec2(1, i)).xyz;
        //     // vec3 v3 = texture2D(sceneVertices, vec2(2, i)).xyz;
        //     vec3 vertices[3] = vec3[3](v1, v2, v3);

        //     float curDist = hitTriangle(vertices, p, dir, eps);
        //     if (distMin < 0.0 || curDist < distMin) {
        //         if (curDist > 0.0 && curDist < maxDist ) {
        //             distMin = curDist;
        //             e1 = vertices[1] - vertices[0];
        //             e2 = vertices[2] - vertices[0];
        //             best_i = i;
        //         }
        //     }
        // }
        // if (distMin > 0. && distMin < maxDist) {
        //     vec4 color = texture2D(sceneVertices, vec2(3, best_i));
        //     return color;
        // }
        return vec4(0., 0., 1., 1.);
        // return vec4(1. -float(n), 0., 0.,1.);
    }

    vec4 nonLinearRayCast() {
        float t = 0.;
        vec4 color = vec4(0., 0., 0., 1.);
        float deltaT = 0.1;
        float eps = 0.0000001;
        while ( t <= 5.) {
            vec3 curP;
            vec3 curV;
            if (t == 0.) {
                curP = cameraPos;
                curV = focusVector;
            }
            else {
                vec3 newPV[2] = expMap(curP, curV, deltaT);
                curP = newPV[0];
                curV = newPV[1];
            } 
            color = colOnHit(curP, curV, deltaT, eps);
            if (color != vec4(0., 0., 0., 1.)) {
                break;
            }
            t += deltaT;
        }
        return color;
    }

    void main() {
        gl_FragColor = nonLinearRayCast();
    }

    /**** Unit test functions ****/

    /* 
        As reminder, below are the variables:

        varying vec2 textureCoords;
        uniform float time;
        uniform vec3 testcolor;

        varying vec3 focusVector;
        uniform sampler2D sceneVertices;
        uniform vec3 cameraPos;
        uniform vec3 cameraLook;
        uniform vec3 camearUp;
    */

    vec4 T1testColorTime() {
        vec3 colorsc = testcolor * textureCoords.x * textureCoords.y;
        return vec4(colorsc, time); 
    }

    vec4 T2focusVectorNormalized() {
        float fvlen = length(focusVector);
        return vec4(fvlen, fvlen, fvlen, time); 
    }

    vec4 T3angleFromLookAt() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T4angleFromNegativeZ() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T5cameraPosTest() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T6linearRayCollisionWithHardcodedTriangle() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T7linearRayCollisionWithFirstTriangle() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T8linearRayDistanceWithFirstTriangle() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T9linearRayCollisionWithAllTriangles() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T10iterRayDistanceMap() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T11nonLinearIterRayDistanceMap() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T12iterRayHardcodedTriangle() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 T13iterRayAllTriangles() {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }

    `
}
