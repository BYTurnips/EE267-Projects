/**
 * @file Raycast fragment shader
 */

var shaderID = "fShaderRaycast";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

varying vec2 textureCoords;

uniform sampler2D textureMap;

uniform sampler2D depthMap;

// center of lens for un-distortion
// in normalized coordinates between 0 and 1
uniform vec2 centerCoordinate;

// [width, height] size of viewport in [mm]
// viewport is the left/right half of the browser window
uniform vec2 viewportSize;

// lens distortion parameters [K_1, K_2]
uniform vec2 K;

// distance between lens and screen in [mm]
uniform float distLensScreen;

void main() {
    
	// distance from center in [mm]
	float radius_mm = distance(
		viewportSize * textureCoords, viewportSize * centerCoordinate );

	float rad = radius_mm / distLensScreen;
	float distortionFactor = 1.0 + K[0] * pow(rad, 2.0) + K[1] * pow(rad, 4.0);

	// compute undistorted texture coordinates
	vec2 textureCoordsUndistorted =
		( textureCoords - centerCoordinate ) * distortionFactor + centerCoordinate;

	if ( textureCoordsUndistorted.x < 1.0 &&
		textureCoordsUndistorted.x > 0.0 &&
		textureCoordsUndistorted.y < 1.0 &&
		textureCoordsUndistorted.y > 0.0 ) {
		gl_FragColor = texture2D( textureMap , textureCoordsUndistorted );
	} else {
		gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	}

    // float dep_cont = (texture2D( depthMap, textureCoords ).x - 0.9) * 10.;
    // gl_FragColor = vec4(dep_cont, dep_cont, dep_cont, 1.0);
}
` );

var shaderNode = document.createElement( "script" );
shaderNode.id = shaderID;
shaderNode.setAttribute( "type", "x-shader/x-fragment" );
shaderNode.appendChild( shader );
document.body.appendChild( shaderNode );
