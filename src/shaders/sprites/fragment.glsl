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

// Use percentages to determine which sprite to show
float random = fract(sin(dot(gl_PointCoord, vec2(12.9898, 78.233))) * 43758.5453);


    vec4 texColor;
    if (random < uSpriteOnePercentage) {
        texColor = spriteOne;
    } else if (random < uSpriteOnePercentage + uSpriteTwoPercentage) {
        texColor = spriteTwo;
    } else {
        texColor = spriteThree;
    }

    // Final color with computed alpha
    gl_FragColor = texColor;
    #include <colorspace_fragment>
}