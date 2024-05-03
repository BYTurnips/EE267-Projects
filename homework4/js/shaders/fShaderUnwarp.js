/**
 * @file Unwarp fragment shader
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2022/04/21
 */

/* TODO (2.2.2) Fragment shader implementation */

var shaderID = "fShaderUnwarp";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

varying vec2 textureCoords;

// texture rendered in the first rendering pass
uniform sampler2D map;

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
    vec2 originPreCoords = textureCoords - centerCoordinate;
    float r = length(originPreCoords);
    vec2 originPostCoords = originPreCoords;
    originPostCoords *= 1. + K[0] * pow(r, 2.) + K[1] * pow(r, 4.);
    vec2 correctedCoords = originPostCoords + centerCoordinate;
	gl_FragColor = texture2D( map, correctedCoords );
    if (correctedCoords.x > 1.0 || correctedCoords.y > 1.0 ||
        correctedCoords.x < 0.0 || correctedCoords.y < 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
