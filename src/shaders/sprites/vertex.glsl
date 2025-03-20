uniform float uSize;
uniform float uRotationRandomness; 
uniform float uScaleRandomness; 

attribute vec3 aRotation; 
attribute float aScale; 

varying vec2 vUv;


void main()
{
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;


    // Size
    gl_PointSize = aScale * uSize;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varying
    vUv = uv; 

}