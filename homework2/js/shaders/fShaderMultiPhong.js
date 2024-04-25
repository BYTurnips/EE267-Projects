/**
 * @file Phong fragment shader with point and directional lights
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2021/04/01
 */

/* TODO (2.3) */

var shaderID = "fShaderMultiPhong";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

varying vec3 normalCam; // Normal in view coordinate
varying vec3 fragPosCam; // Fragment position in view cooridnate

uniform mat4 viewMat;

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};

uniform Material material;

uniform vec3 attenuation;

uniform vec3 ambientLightColor;

/***
 * NUM_POINT_LIGHTS is replaced to the number of point lights by the
 * replaceNumLights() function in teapot.js before the shader is compiled.
 */
#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif

/***
 * NUM_DIR_LIGHTS is replaced to the number of directional lights by the
 * replaceNumLights() function in teapot.js before the shader is compiled.
 */
#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif


void main() {

	// Compute ambient reflection
	vec3 ambientReflection = material.ambient * ambientLightColor;
	vec3 fColor = ambientReflection;

	vec3 normalizedNormal = normalCam / length(normalCam);

    // Compute directional light sources
	for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
		DirectionalLight dirLight = directionalLights[i];
        vec3 lightVector = -mat3(viewMat) * dirLight.direction;
        float d = length(lightVector);
        vec3 lightVectorNormalized = lightVector / d;

        // Compute directional diffuse light
        vec3 diffuseReflection;
        float angle = dot(lightVectorNormalized, normalizedNormal);
        diffuseReflection = dirLight.color * material.diffuse * max(angle, 0.);

        // Compute directional specular light
        vec3 specularReflection;
        vec3 perfectReflectView = 
            reflect(- lightVectorNormalized, normalizedNormal);
        vec3 cameraView = - fragPosCam / length(fragPosCam);

        float simReflView = max(dot(perfectReflectView, cameraView), 0.0);
        vec3 reflColorSpecular = dirLight.color * material.specular;

        specularReflection = reflColorSpecular * 
            pow(simReflView, material.shininess);
		
		fColor += diffuseReflection + specularReflection;
    }

    // Compute point light sources
    for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
		PointLight light = pointLights[i];
        vec4 lightPositionView = viewMat * vec4( light.position, 1.0 );
        vec3 lightVector = lightPositionView.xyz - fragPosCam;
        float dist = length(lightVector);
        vec3 lightVectorNormalized = lightVector / dist;

        float constAtt = attenuation[0];
        float linAtt = attenuation[1] * dist;
        float quadAtt = attenuation[2] * dist * dist;
        float attFactor = 1. / (constAtt + linAtt + quadAtt);

        // Compute diffuse reflections
        vec3 diffuseReflection;
        float angle = dot(lightVectorNormalized, normalizedNormal);
        diffuseReflection = light.color * material.diffuse * max(angle, 0.);

        // Compute specular reflections
        vec3 specularReflection;
        vec3 perfectReflectView = 
            reflect(- lightVectorNormalized, normalizedNormal);
        vec3 cameraView = - fragPosCam / length(fragPosCam);

        float simReflView = max(dot(perfectReflectView, cameraView), 0.0);
        vec3 reflColorSpecular = light.color * material.specular;

        specularReflection = reflColorSpecular * 
            pow(simReflView, material.shininess);
		
		fColor += attFactor * (diffuseReflection + specularReflection);
    }

	gl_FragColor = vec4( fColor, 1.0 );

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
