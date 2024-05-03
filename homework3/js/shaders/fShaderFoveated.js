/**
 * @file Fragment shader for foveated rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2022/04/14
 */

/* TODO (2.2.4) Fragment Shader Foveation Blur */

var shaderID = "fShaderFoveated";

var shader = document.createTextNode( `
/***
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

// texture or uv coordinates of current fragment in normalized coordinates [0,1]
varying vec2 textureCoords;

// texture map from the first rendering pass
uniform sampler2D textureMap;

// resolution of the window in [pixels]
uniform vec2 windowSize;

// window space coordinates of gaze position in [pixels]
uniform vec2 gazePosition;

// eccentricity angle at boundary of foveal and middle layers
uniform float e1;

// eccentricity angle at boundary of middle and outer layers
uniform float e2;

// visual angle of one pixel
uniform float pixelVA;

// radius of middle layer blur kernel [in pixels]
const float middleKernelRad = 2.0;

// radius of outer layer blur kernel [in pixels]
const float outerKernelRad = 4.0;

// gaussian blur kernel for middle layer (5x5)
uniform float middleBlurKernel[int(middleKernelRad)*2+1];

// gaussian blur kernel for outer layer (9x9)
uniform float outerBlurKernel[int(outerKernelRad)*2+1];


void main() {
    float ecc = length(textureCoords * windowSize - gazePosition) * pixelVA;
    // vec4 interim = texture2D( textureMap,  textureCoords );
    // interim.w = (ecc < e1) ? 1. : ((ecc < e2) ? 0.8 : 0.5);

    vec4 fragColor = vec4(0.0);

    if (ecc < e1) {
        fragColor = texture2D( textureMap,  textureCoords );
    }
    else if (ecc < e2) {
        float totalcontrib = 0.0;

        for (int i = 0; i < int(middleKernelRad)*2+1; i++) {
            for (int j = 0; j < int(middleKernelRad)*2+1; j++) {
                float attenuation = middleBlurKernel[i] * 
                                    middleBlurKernel[j];
                
                vec2 shiftCoords = textureCoords;
                shiftCoords.x += (float(i) - middleKernelRad) / windowSize.x;
                shiftCoords.y += (float(j) - middleKernelRad) / windowSize.y;
                shiftCoords = clamp(shiftCoords, vec2(0.0), vec2(1.0));

                vec4 shiftColor = texture2D( textureMap,  shiftCoords );

                fragColor += shiftColor * attenuation;
                totalcontrib += attenuation;
            }
        }
        fragColor /= totalcontrib;
    }
    else {
        float totalcontrib = 0.0;

        for (int i = 0; i < int(outerKernelRad)*2+1; i++) {
            for (int j = 0; j < int(outerKernelRad)*2+1; j++) {
                float attenuation = outerBlurKernel[i] * 
                                    outerBlurKernel[j];
                
                vec2 shiftCoords = textureCoords;
                shiftCoords.x += (float(i) - outerKernelRad) / windowSize.x;
                shiftCoords.y += (float(j) - outerKernelRad) / windowSize.y;
                shiftCoords = clamp(shiftCoords, vec2(0.0), vec2(1.0));

                vec4 shiftColor = texture2D( textureMap,  shiftCoords );

                fragColor += shiftColor * attenuation;
                totalcontrib += attenuation;
            }
        }
        fragColor = fragColor / totalcontrib;
    }
    gl_FragColor = fragColor;
}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
