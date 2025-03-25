uniform float uSize;
uniform float uRotationRandomness; 
uniform float uScaleRandomness; 

attribute vec3 aRotation; 
attribute float aScale; 

varying vec3 vNormal; 
varying vec3 vPosition; 

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main()
{

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
   

    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <fog_vertex>

    // Size
    gl_PointSize = aScale * uSize;
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Varying         
    vPosition = position; 
    vNormal = normal;

  

}