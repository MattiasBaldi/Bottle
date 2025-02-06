varying vec2 vUv; 

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Final posiiton
    gl_Position = projectionMatrix * viewMatrix * modelPosition; 

    // Varyings
    vUv = uv; 
}