uniform sampler2D uTexture; 

varying vec2 vUv; 
void main()
{
    // Color
    vec3 color = vec3(1.0, 1.0, 1.0); 

    // Texture
    // vec3 color = texture2D(uTexture, vUv).rgb; 

    gl_FragColor = vec4(color, 1.0); 
}