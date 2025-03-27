uniform float uSize;
uniform float uRotationRandomness; 
uniform float uScaleRandomness; 
uniform float scale;

attribute vec3 aRotation; 
attribute float aScale; 
attribute vec3 color;

varying vec3 vNormal; 
varying vec3 vPosition; 

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_POINTS_UV

	varying vec2 vUv;
	uniform mat3 uvTransform;

#endif

void main() {


    #ifdef USE_POINTS_UV

      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;

    #endif

    #include <color_vertex>
    #include <morphinstance_vertex>
    #include <morphcolor_vertex>
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <project_vertex>

    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Size with attenuation
    gl_PointSize = aScale * uSize;
    gl_PointSize *= (scale / -viewPosition.z);

    
    // Pass varying values
    vPosition = position; 
    vNormal = normal;
    
    // Pass color to fragment shader
    #ifdef USE_COLOR
      vColor = color;
    #endif
}