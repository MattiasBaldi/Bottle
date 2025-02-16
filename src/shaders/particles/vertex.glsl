uniform float uSize;
uniform vec2 uResolution;

attribute vec3 aRandomness;
attribute float aSize;
// attribute float aPosition;
// attribute float aPosition;

void main()
{

    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Size
    gl_PointSize = aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

}