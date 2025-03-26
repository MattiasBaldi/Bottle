uniform sampler2D uMap;
uniform vec3 diffuse;
uniform float opacity;
uniform float alphaTest;

// Varying
varying vec3 vNormal;
varying vec3 vPosition;
#ifdef USE_COLOR
  varying vec3 vColor;
#endif

// Custom includes
#include "../includes/ambientLight.glsl"
#include "../includes/directionalLight.glsl"

void main() {
    // Declare inits
    vec3 viewDirection = vPosition - cameraPosition;
    vec3 light = vec3(0.0);  
    vec4 color = vec4(diffuse, opacity); 

    // Sample texture
    vec4 sprite = texture(uMap, gl_PointCoord);
    
    // Apply color and alpha
    color *= sprite;
    
    // Apply vertex colors if enabled
    // #ifdef USE_COLOR
    //   color.rgb *= vColor;
    // #endif
    
    // Alpha test - discard transparent pixels
    if (color.a < alphaTest) discard;
    
    // Apply lighting
    light += ambientLight(
        vec3(1.0),      // Color
        0.7             // Intensity
    );
    color.rgb *= light;
    
    // Output final color with proper premultiplied alpha
    gl_FragColor = color;
    
    #ifdef PREMULTIPLIED_ALPHA
      gl_FragColor.rgb *= gl_FragColor.a;
    #endif
}