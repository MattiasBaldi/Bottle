uniform float uSize;
uniform float uRotationRandomness; 
uniform float uScaleRandomness; 
uniform float scale;

attribute vec3 aRotation; 
attribute float aScale; 
attribute vec3 color;

varying vec3 vNormal; 
varying vec3 vPosition; 
#ifdef USE_COLOR
  varying vec3 vColor;
#endif

void main() {
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