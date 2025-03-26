uniform sampler2D uSprite; 

// Varying
varying vec3 vNormal;
varying vec3 vPosition;

// Three.js includes
#include <common>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>

// Custom includes
#include "../includes/ambientLight.glsl"
#include "../includes/directionalLight.glsl"

// DirectionalLight
void main() {

    // declare inits
    vec3 viewDirection = vPosition - cameraPosition;
    vec3 light = vec3(0.0);  
    vec4 diffuseColor = vec4(0.0); 

    // Sample all textures
    vec4 sprite = texture(uSprite, gl_PointCoord);
    diffuseColor = sprite; 

    // Lights
    light += ambientLight(
        vec3(1.0),      // Color
        0.7             // Intensity
    );
    diffuseColor.rgb *= light;

    // Includes
	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	// #include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

    // outgoingLight = diffuseColor.rgb;

	#include <opaque_fragment>
	#include <tonemapping_fragment>
	// #include <colorspace_fragment>
	#include <premultiplied_alpha_fragment>


    gl_FragColor = diffuseColor;


}

