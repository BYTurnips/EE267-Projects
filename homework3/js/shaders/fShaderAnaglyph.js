/**
 * @file Fragment shader for anaglyph rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2022/04/14
 */

/* TODO (2.4.3) Color Channel Multiplexing */

var shaderID = "fShaderAnaglyph";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

// uv coordinates after interpolation
varying vec2 textureCoords;

// Texture map for the left eye
uniform sampler2D textureMapL;

// Texture map for the right eye
uniform sampler2D textureMapR;

void main() {
	vec4 leftColor = texture2D(textureMapL, textureCoords);
	float leftGray =    0.2989 * leftColor.x + 
                        0.5870 * leftColor.y + 
                        0.1140 * leftColor.z;

	vec4 rightColor = texture2D(textureMapR, textureCoords);
	float rightGray =   0.2989 * rightColor.x + 
                        0.5870 * rightColor.y + 
                        0.1140 * rightColor.z;

	gl_FragColor = vec4(leftGray, rightGray, rightGray, 1.0);

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
