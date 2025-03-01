import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import TopSurface from './topsurface.js'

/**
 * Base
 */
// Debug
const debug = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 *
 * Environment
 */
const environmentloader = new RGBELoader()
environmentloader.load('./HDR/restaurant.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = new THREE.Color('#ffffff')
})

// Add a toggle for the background in the debug GUI
const backgroundFolder = debug.addFolder('Background');
backgroundFolder.close()
const backgroundParams = { background: false };
backgroundFolder.add(backgroundParams, 'background').name('Toggle Background').onChange((value) => {
    scene.background = value ? scene.environment : new THREE.Color('#ffffff'); 
});


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 4

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
// controls.minDistance = 3.5; 
// controls.maxDistance = 4;
// controls.enablePan = false; 

// // Limit controls to horizontal rotation only
// controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the object
// controls.minPolarAngle = Math.PI / 2; // Prevent camera from going above the object

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))

/**
 * Load Texture
 */
const textureLoader = new THREE.TextureLoader()
const particlesTexture = textureLoader.load('./textures/particles/chili1.png')

/**
 * Load model
 */

const gltfLoader = new GLTFLoader()
gltfLoader.load('./models/bottle.glb', (gltf) => {

// Container
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 'white',
    roughness: 0,
    metalness: 0,
    transmission: 0.95, // Slightly lower transparency for better performance
    opacity: 1,
    transparent: true,
    envMapIntensity: 1.0, // Ensure environment map intensity is set
    // clearcoat: 0.1, // Add a small clearcoat for better reflections
    // clearcoatRoughness: 0.1, // Slight roughness for clearcoat
    side: THREE.DoubleSide,
    depthWrite: false, 
});

const gltfscene = gltf.scene;
const jar = gltfscene.children[0]
jar.scale.setScalar(1)
jar.position.set(0, 0, 0)
jar.material = glassMaterial
jar.visible = true;
scene.add(jar)

/**
 * Helpers and Debug
 */

// Debug for glass material
const bottleFolder = debug.addFolder('Bottle')
bottleFolder.close()
const jarParams = { visible: true };
bottleFolder.add(jarParams, 'visible').name('Visible').onChange((value) => {
    jar.visible = value;
});
bottleFolder.addColor(glassMaterial, 'color').name('Color')
bottleFolder.add(glassMaterial, 'roughness').min(0).max(1).step(0.01).name('Roughness')
bottleFolder.add(glassMaterial, 'metalness').min(0).max(1).step(0.01).name('Roughness')
bottleFolder.add(glassMaterial, 'transmission').min(0).max(1).step(0.01).name('Transmission')
bottleFolder.add(glassMaterial, 'opacity').min(0).max(1).step(0.01).name('Opacity')
bottleFolder.add(glassMaterial, 'envMapIntensity').min(0).max(10).step(0.1).name('EnvMap Intensity')
bottleFolder.add(glassMaterial, 'clearcoat').min(0).max(1).step(0.01).name('Clearcoat')
bottleFolder.add(glassMaterial, 'clearcoatRoughness').min(0).max(1).step(0.01).name('Clearcoat Roughness')

// Compute height
jar.geometry.computeBoundingBox();
const minY = jar.geometry.boundingBox.min.y;
const maxY = jar.geometry.boundingBox.max.y;
const height = maxY - minY; 

// Fill
const fill = {}
fill.pointSize = 30.0; 
fill.colorOne = 'red'
fill.colorTwo = 'yellow'

let topSurface = null; 
let points = null;
let count = 100000; 


function addPointsToJar(container, startPercentage, endPercentage) {

// Remove existing points if they exist
if (points) 
{
    scene.remove(points);
    points.geometry.dispose();
    points.material.dispose();
    points = null;
}

if (topSurface) 
    {
        if(topSurface.points)
        {
        scene.remove(topSurface.points);
        topSurface.points.geometry.dispose()
        topSurface.points.material.dispose()
        }
        topSurface.geometry.dispose()
        topSurface.material.dispose()
        topSurface = null; 
    }

// Define threshold
const startY = minY + height * startPercentage * 0.01;
const endY = minY + height * endPercentage * 0.01;

// topSurface
topSurface = new TopSurface(jar, endY) // Creates a topsurface class


function generatePoints(mesh, count, startY, endY) {
    // Begin the sampler
    const sampler = new MeshSurfaceSampler(mesh).build();
    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); // Array to store colors
    const color = new THREE.Vector3();
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();

    // Material
    const material = new THREE.ShaderMaterial({

        vertexShader: particlesVertexShader, 
        fragmentShader: particlesFragmentShader,
        uniforms: 
        {
            uSize: new THREE.Uniform(fill.pointSize * renderer.getPixelRatio()),

            // Colors
            uColorOne: new THREE.Uniform(new THREE.Color(fill.colorOne)),
            uColorTwo: new THREE.Uniform(new THREE.Color(fill.colorTwo)),
            uColorThree: new THREE.Uniform(new THREE.Color(fill.colorThree)),

            uSaturation: new THREE.Uniform(1.0),
            uBrightness: new THREE.Uniform(1.0),
            uContrast: new THREE.Uniform(1.0),

            // Shapes
            uShapeType: new THREE.Uniform(1.0), // Interpolates between triangles, squares and circles

            /* 
            float circle = smoothstep(0.5, 0.48, length(uv));
            float square = 1.0;
            float triangle = step(uv.y + 0.25, 0.866 * (0.5 - abs(uv.x)));

            float shapeMix = smoothstep(0.0, 1.0, uShapeType); // Interpolates between shapes
            float finalShape = mix(circle, square, shapeMix);
            finalShape = mix(finalShape, triangle, smoothstep(1.0, 2.0, uShapeType));

            if (finalShape < 0.5) discard;
          
            uTriangle: new THREE.Uniform(),
            uTriangleSize: new THREE.Uniform(new THREE.Vector3), 

            uSquare: new THREE.Uniform(),
            uSquareSize: new THREE.Uniform(new THREE.Vector3), 
            
            uCircle: new THREE.Uniform(),
            uCircleSize: new THREE.Uniform(new THREE.Vector3), 
          
            */

            // Textures || Sprites
            uTextureMix: new THREE.Uniform(),
            uSprite: new THREE.Uniform(),
            uTexture: new THREE.Uniform(),

            // Variation
            uScaleRandomness: new THREE.Uniform(),
            uRotationRandomness: new THREE.Uniform(),

            // Details
            uEdgeSoftness: new THREE.Uniform(0.5), // Controls the blur at the edges to simulate powdered vs. granular spices.
            uNoiseIntensity: new THREE.Uniform(0.5), // use procedural noise instead of large noise textures.
            uSpecular: new THREE.Uniform(0.5), // Adds slight highlights for glossy spices like peppercorns. For shiny spices like seeds but reduce the number of specular calculations in the shader.
            uSubsurface: new THREE.Uniform(0.5) // Mimics light scattering through spices like turmeric.

            // Extra

            // Granularity & Clumping
            // uGranularity: Defines whether the spice is a fine powder or coarse (adjust particle size distribution).
            // uClumping: Adjusts how particles stick together (use slight attraction forces).

            // Aging & Environmental Effects
            // uDryness: Controls how dusty or moist the spice looks (affects roughness and opacity).
            // uDustiness: Adds a subtle overlay for aged or powdered spices.

            // uJitter: Adds randomness to size and position to prevent uniform-looking particles.
            // uSizeVariation: Adjusts particle sizes for a natural, uneven look.


            /*
            Performance Considerations
            The biggest performance hits come from:

            Textures: Large or multiple textures can slow rendering. Use smaller, compressed textures or a texture atlas.
            Transparency & Blending: Overlapping semi-transparent particles require sorting, which is expensive.
            Per-Pixel Computation: Complex fragment shader operations like noise functions, lighting, and procedural textures are costly.
            Particle Count: More particles mean more draw calls. Batch rendering and instancing help.
            High-Precision Math: Avoid excessive conditionals or loops in shaders.
            */
  
        },
        transparent: true,
        depthWrite: false
    })

    // Sample randomly from the surface, generating points on the jar geometry
    let sampledCount = 0;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3
        sampler.sample(position, normal);

        // Only add points on y threshold and ensure they are inside the jar
        if (position.y >= startY && position.y <= endY) {    
            
            // Position
            position.multiplyScalar(0.97); // Offset to fit inside jar
            positions.set([position.x, position.y, position.z], sampledCount * 3);
     
            // Color
            color.lerp(fill.colorOne, fill.colorTwo, Math.random());
            colors.set([color.r, color.g, color.b], sampledCount * 3);
      
            sampledCount++;
        }
    }

    // Adjust arrays to the actual number of sampled points
    const adjustedPositions = positions.subarray(0, sampledCount * 3);
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return points = new THREE.Points(pointsGeometry, material);

}

// Generate points
topSurface.points = generatePoints(topSurface, count * 0.1, startY, endY)
points = generatePoints(container, count, startY, endY);
console.log(points.geometry.attributes.color)
scene.add(topSurface.points, points)
}

addPointsToJar(jar, 0, 45);

// Debug 
const pointsFolder = debug.addFolder('Points');
pointsFolder.close();
const pointsParams = { startPercentage: 0, endPercentage: 30, count: 100000};

pointsFolder.add(pointsParams, 'startPercentage').min(0).max(100).step(1).name('Start Percentage').onChange(() => {
    addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
});

pointsFolder.add(pointsParams, 'endPercentage').min(0).max(100).step(1).name('End Percentage').onChange(() => {
    addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
});

pointsFolder.add(pointsParams, 'count').min(1000).max(10000000).step(1000).name('Point Count').onChange((value) => {
    count = value;
    addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
});

pointsFolder.add(fill, 'pointSize').min(0.1).max(10).step(0.1).name('Point Size').onChange(() => {
    addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
});


})

/**
 * Resizing
 */
window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight
        sizes.pixelRatio = Math.min(window.devicePixelRatio, 1)
    
        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()
    
        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
    })

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

