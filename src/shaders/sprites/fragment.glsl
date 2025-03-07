uniform vec3 uColorOne; 
uniform vec3 uColorTwo;

varying vec3 vColor;

// Function to generate a random number based on a 2D coordinate
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {

// Disc
float disc = distance(gl_PointCoord, vec2(0.5));
disc = 1.0 - disc; 
disc = step(0.8, disc); 

// square
float square = step(1.0, gl_PointCoord.x) * step(1.0, gl_PointCoord.y); 

// triangle
float angle = rand(gl_PointCoord) * 6.283185; // Random angle between 0 and 2*PI
mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
vec2 rotatedCoord = rotation * (gl_PointCoord - vec2(0.5)) + vec2(0.5);

float edge1 = step(rotatedCoord.x, rotatedCoord.y);
float edge2 = step(rotatedCoord.y, (1.0 - rotatedCoord.x));
float triangle = edge1 * edge2;

gl_FragColor = vec4(1.0, 0.0, 0.0, disc); 
#include <colorspace_fragment>
}