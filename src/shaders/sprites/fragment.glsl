uniform sampler2D uSpriteOne; 
uniform float uSpriteOnePercentage; 

uniform sampler2D uSpriteTwo;
uniform float uSpriteTwoPercentage;  

uniform sampler2D uSpriteThree; 
uniform float uSpriteThreePercentage;


void main() {
    
    // Sample all textures
    vec4 spriteOne = texture(uSpriteOne, gl_PointCoord);
    vec4 spriteTwo = texture(uSpriteTwo, gl_PointCoord);
    vec4 spriteThree = texture(uSpriteThree, gl_PointCoord);


    // Final color with computed alpha
    gl_FragColor = texColor;
    #include <colorspace_fragment>
}