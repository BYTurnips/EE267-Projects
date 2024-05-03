/**
 * @file Fragment shader for DoF rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2022/04/14
 */

/* TODO (2.3) DoF Rendering */

var shaderID = "fShaderDof";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

// uv coordinates after interpolation
varying vec2 textureCoords;

// texture map from the first rendering
uniform sampler2D textureMap;

// depth map from the first rendering
uniform sampler2D depthMap;

// Projection matrix used for the first pass
uniform mat4 projectionMat;

// Inverse of projectionMat
uniform mat4 invProjectionMat;

// resolution of the window in [pixels]
uniform vec2 windowSize;

// Gaze position in [pixels]
uniform vec2 gazePosition;

// Diameter of pupil in [mm]
uniform float pupilDiameter;

// pixel pitch in [mm]
uniform float pixelPitch;

const float searchRad = 11.0;


// Compute the distance to fragment in [mm]
// p: texture coordinate of a fragment / a gaze position (in normalized coords)
//
// Note: GLSL is column major
float distToFrag( vec2 p ) {

	/* TODO (2.3.1) Distance to Fragment */
	float xNDC = 2. * p.x - 1.;
	float yNDC = 2. * p.y - 1.;
	float zNDC = 2. * texture2D(depthMap, p).x - 1.;

	float wCLIP = projectionMat[3][2] / 
                    (zNDC - (projectionMat[2][2] / projectionMat[2][3]));
	vec4 pCLIP = vec4(xNDC * wCLIP, yNDC * wCLIP, zNDC * wCLIP, wCLIP);
	vec3 vVIEW = (invProjectionMat * pCLIP).xyz;

	return length(vVIEW);
    // return -vVIEW.z;
}


// compute the circle of confusion in [mm]
// fragDist: distance to current fragment in [mm]
// focusDist: distance to focus plane in [mm]
float computeCoC( float fragDist, float focusDist ) {
	return pupilDiameter * abs(fragDist - focusDist) / fragDist;
}


// compute depth of field blur and return color at current fragment
vec3 computeBlur() {
	float focusDist = distToFrag(gazePosition / windowSize);
    float fragDist = distToFrag(textureCoords);
	float c = computeCoC(fragDist, focusDist);

    vec3 color = vec3(0.0);
	float count = 0.0;
	for (float i = -searchRad; i <= searchRad; i++) {
		for (float j = -searchRad; j <= searchRad; j++) {
			if (sqrt(i * i + j * j) > min(c / 2. / pixelPitch, searchRad)) {
				continue; // if outside the circle of confusion
			}

			vec2 shiftCoords = textureCoords;
            shiftCoords.x += i / windowSize.x;
            shiftCoords.y += j / windowSize.y;
            shiftCoords = clamp(shiftCoords, vec2(0.0), vec2(1.0));

			color += texture2D( textureMap,  shiftCoords ).xyz;
			count += 1.0;
		}
	}
	color = color / count;
	return color;
}


void main() {
	gl_FragColor = vec4(computeBlur(), 1.0);

    // gl_FragColor = texture2D( textureMap, textureCoords);
    // gl_FragColor.w = texture2D( depthMap, textureCoords).x;
}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
