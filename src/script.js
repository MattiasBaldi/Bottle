import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import spritesVertexShader from './shaders/sprites/vertex.glsl'
import spritesFragmentShader from './shaders/sprites/fragment.glsl'
import Spice from './spice.js'

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
environmentloader.load('./environment/HDR/restaurant_1k.hdr', (texture) => {
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

// Debug camera near and far
const cameraFolder = debug.addFolder('Camera');
cameraFolder.close();
cameraFolder.add(camera, 'near').min(0.1).max(10).step(0.1).name('Near').onChange(() => {
    camera.updateProjectionMatrix();
});
cameraFolder.add(camera, 'far').min(0).max(1000).step(1).name('Far').onChange(() => {
    camera.updateProjectionMatrix();
});

// Controls
const controls = new OrbitControls(camera, canvas)
const controlsFolder = debug.addFolder('Controls');
const controlsParams = { enableControls: false };
controlsFolder.add(controlsParams, 'enableControls').name('Disable Controls').onChange((enabled) => {
    controls.enableDamping = enabled;
    controls.minDistance = enabled ? 3.5 : 0;
    controls.maxDistance = enabled ? 4 : Infinity;
    controls.enablePan = enabled ? false : true;
    controls.maxPolarAngle = enabled ? Math.PI / 2 : Math.PI;
    controls.minPolarAngle = enabled ? Math.PI / 2 : 0;
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))

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
 * Load Texture
 */
const textureLoader = new THREE.TextureLoader()

const sprites =
{
    pepperCorn: textureLoader.load('./textures/sprites/pepperCorn.png'), 
    sugarCube: textureLoader.load('./textures/sprites/sugarCube.png'), 
    basilLeaf: textureLoader.load('./textures/sprites/basilLeaf.png'), 
    sugar: textureLoader.load('./textures/sprites/sugar.png'), 
}


// Set sRGB encoding for all sprites
Object.values(sprites).forEach(sprite => {
    sprite.colorSpace = THREE.SRGBColorSpace
});

/**
 * Load models
 */
const gltfLoader = new GLTFLoader()
let bottle = null; 
let spiceModels = null; 
async function loadModels() {
    const gltfLoader = new GLTFLoader();

    const spicePromise = new Promise((resolve, reject) => {
        gltfLoader.load('./models/spices.glb', (gltf) => {
            resolve(gltf);
        }, undefined, reject);
    });

    const bottlePromise = new Promise((resolve, reject) => {
        gltfLoader.load('./models/bottle.glb', (gltf) => {
            resolve(gltf);
        }, undefined, reject);
    });

    try {
        const [spiceGltf, bottleGltf] = await Promise.all([spicePromise, bottlePromise]);
        spiceModels = spiceGltf;
        bottle = bottleGltf;
        
        // load experience
        initExperience();
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// init experience function
function initExperience() {

/**
 * JAR
 */

// group
const group = new THREE.Group()
scene.add(group)

// Material
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
    side: THREE.FrontSide,
});

// Geometry
const jar = bottle.scene.children[0]
jar.geometry.computeBoundingBox();
jar.name = 'jar'
jar.scale.setScalar(1)
jar.position.set(0, 0, 0)
jar.material = glassMaterial
group.add(jar)

// BoxHelper
const boxHelper = new THREE.BoxHelper(jar, 0xff0000);
boxHelper.visible = false; 
group.add(boxHelper);

// Debug
const bottleFolder = debug.addFolder('Bottle')
bottleFolder.close()
const jarParams = { visible: true, boxVisible: false, wireframe: false, side: 'DoubleSide' };
bottleFolder.add(jarParams, 'visible').name('Visible').onChange((value) => {
    jar.visible = value;
});
bottleFolder.add(jarParams, 'boxVisible').name('BoundingBox Helper').onChange((value) => {
    boxHelper.visible = value;
});
bottleFolder.add(jarParams, 'wireframe').name('Wireframe').onChange((value) => {
    glassMaterial.wireframe = value;
});
bottleFolder.add(jarParams, 'side', { Front: 'FrontSide', Back: 'BackSide', Double: 'DoubleSide' }).name('Side').onChange((value) => {
    glassMaterial.side = THREE[value];
    glassMaterial.needsUpdate = true;
});
bottleFolder.addColor(glassMaterial, 'color').name('Color')
bottleFolder.add(glassMaterial, 'roughness').min(0).max(1).step(0.01).name('Roughness')
bottleFolder.add(glassMaterial, 'metalness').min(0).max(1).step(0.01).name('Metalness')
bottleFolder.add(glassMaterial, 'transmission').min(0).max(1).step(0.01).name('Transmission')
bottleFolder.add(glassMaterial, 'opacity').min(0).max(1).step(0.01).name('Opacity')
bottleFolder.add(glassMaterial, 'envMapIntensity').min(0).max(10).step(0.1).name('EnvMap Intensity')
bottleFolder.add(glassMaterial, 'clearcoat').min(0).max(1).step(0.01).name('Clearcoat')
bottleFolder.add(glassMaterial, 'clearcoatRoughness').min(0).max(1).step(0.01).name('Clearcoat Roughness')

/**
 * Spices
 */

// const shaderMaterial = new THREE.ShaderMaterial
// ({

//                 vertexShader: spritesVertexShader, 
//                 fragmentShader: spritesFragmentShader,
//                 uniforms: 
//                 {
//                     uSize: new THREE.Uniform(fill.pointSize * renderer.getPixelRatio()), // Also adds size attentuation
        
//                     // Colors
//                     uColorOne: new THREE.Uniform(new THREE.Color(fill.colorOne)),
//                     uColorTwo: new THREE.Uniform(new THREE.Color(fill.colorTwo)),
//                     uColorThree: new THREE.Uniform(new THREE.Color(fill.colorThree)),
//                     uSaturation: new THREE.Uniform(1.0),
//                     uBrightness: new THREE.Uniform(1.0),
        
//                     // Textures || Sprites
//                     uSprite: new THREE.Uniform(),
//                     uSpriteNormal: new THREE.Uniform(),
//                     uSpriteRoughness: new THREE.Uniform(),
        
//                     // Variation
//                     uScaleRandomness: new THREE.Uniform(),
//                     uRotationRandomness: new THREE.Uniform(),
        
//                     // Details
//                     uEdgeSoftness: new THREE.Uniform(0.5), // Controls the blur at the edges to simulate powdered vs. granular spices.
//                     uNoiseIntensity: new THREE.Uniform(0.5), // use procedural noise instead of large noise textures.
//                     uSpecular: new THREE.Uniform(0.5), // Adds slight highlights for glossy spices like peppercorns. For shiny spices like seeds but reduce the number of specular calculations in the shader.
//                     uSubsurface: new THREE.Uniform(0.5) // Mimics light scattering through spices like turmeric.
        
//                     // Extra
//                     // Granularity & Clumping
//                     // uGranularity: Defines whether the spice is a fine powder or coarse (adjust particle size distribution).
//                     // uClumping: Adjusts how particles stick together (use slight attraction forces).
//                     // uDryness: Controls how dusty or moist the spice looks (affects roughness and opacity).
//                     // uDustiness: Adds a subtle overlay for aged or powdered spices.
        
//                     // uJitter: Adds randomness to size and position to prevent uniform-looking particles.
//                     // uSizeVariation: Adjusts particle sizes for a natural, uneven look.
        
//                     /*
//                     Performance Considerations
//                     The biggest performance hits come from:
        
//                     Textures: Large or multiple textures can slow rendering. Use smaller, compressed textures or a texture atlas.
//                     Transparency & Blending: Overlapping semi-transparent particles require sorting, which is expensive.
//                     Per-Pixel Computation: Complex fragment shader operations like noise functions, lighting, and procedural textures are costly.
//                     Particle Count: More particles mean more draw calls. Batch rendering and instancing help.
//                     High-Precision Math: Avoid excessive conditionals or loops in shaders.
//                     */
          
//                 },
//                 transparent: true,
//                 depthWrite: false
// })

const spices = 
{

    // Instances 
    basil:
    {
        type: 'mesh', // Determine what is used
        mesh: spiceModels.scene.getObjectByName('basil'), 
        count: 700,
        size: 0.75,
        collisionDistance: 0.01,
        alphaTest: 1, 
    },

    anise:
    {
        type: 'mesh', // Determine what is used
        mesh: spiceModels.scene.getObjectByName('star_anise'), 
        count: 100,
        size: 0.8,
        collisionDistance: 0.01,
        alphaTest: 1, 
    },

    cloves:
    {
        type: 'mesh', // Determine what is used
        mesh: spiceModels.scene.getObjectByName('cloves'), 
        count: 800,
        size: 0.5,
        collisionDistance: 0.01,
        alphaTest: 1, 
    },

    // Sprites
    pepperPoints:
    {
        type: 'points', // Determine what is used
        mesh: null,
        count: 10000,
        size: 0.15,
        material: new THREE.PointsMaterial
        ({
            size: 0.15,
            sizeAttenuation: true,
            map: sprites.pepperCorn,
            alphaTest: 1, // Enable alpha testing to discard low alpha pixels
        })
    },

    sugarPoints:
    {
        type: 'points', // Determine what is used
        mesh: null,
        count: 42000,
        size: 0.07,
        material: new THREE.PointsMaterial
        ({
            size: 0.08,
            // sizeAttenuation: true,
            map: sprites.sugarCube,
            alphaTest: 0.9, // Enable alpha testing to discard low alpha pixels
        })
    },
}

/**
 * Jar content
 */
jar.content = {}
jar.content.spices = {}

/**
 * Logic
 */

function addSpice(spiceName) {
    const spice = new Spice(spices[spiceName]);
    jar.content.spices[spiceName] = spice;
    jar.content.spices[spiceName].isTop = null; 
}

function removeSpice(spiceName) {
    const spice = jar.content.spices[spiceName]
    if(spice.points)
    {
        group.remove(spice.points)
        spice.points.geometry.dispose();
        spice.points.material.dispose();
        spice.points = null;
    }

    delete jar.content.spices[spiceName];
    // sampleTop()    
}

function calculatePoints(spice, startPercentage, endPercentage)
{
        // remove
        if (spice.points) {
            group.remove(spice.points)
            spice.points.geometry.dispose();
            spice.points.material.dispose();
            spice.points = null;
        }
    
        spice.startPercentage = startPercentage; // Y%
        spice.endPercentage = endPercentage; // Y%
        spice.points = spice.create(jar, spice.startPercentage, spice.endPercentage);  
        group.add(spice.points);


        recalculateTop();
}

function recalculateTop() {
    // Clear prior top
    Object.values(jar.content.spices).forEach(spice => {
        if (spice.isTop) {
            group.remove(spice.points);
            spice.points.geometry.dispose();
            spice.points.material.dispose();
            spice.points = spice.create(jar, spice.startPercentage, spice.endPercentage);
            group.add(spice.points);
            spice.isTop = false; 
        }
    });

    // Recalculate new spiceTop
    Object.values(jar.content.spices).forEach(spice => {
        if (spice.endPercentage === Math.max(...Object.values(jar.content.spices).map(s => s.endPercentage))) {
            spice.isTop = true;
            console.log('TopSpice is: ', spice)
            group.remove(spice.points);
            spice.points.geometry.dispose();
            spice.points.material.dispose();
            spice.points = spice.create(jar, spice.startPercentage, spice.endPercentage, true); // setting to true to include the top
            group.add(spice.points);
        
        }
    });
}

/**
 * Panel
 */

// params
const spicesFolder = debug.addFolder('Spices')
const spiceOptions = Object.keys(spices);
const spiceParams = { selectedSpice: spiceOptions[0] };
let spicesInJar = 0; 

// dropdown component
function createSpiceDropdown() {
    const spiceFolder = spicesFolder.addFolder(`Spice ${Object.keys(jar.content.spices).length + 1}`);
    spiceParams.selectedSpice = ''; // Set initial name to nothing

     // add dropdown
    const spicePanel = {};
    let currentSpice = null; 
    
    spiceFolder.add(spiceParams, 'selectedSpice', spiceOptions).name('Select Spice').onChange((spiceName) => {
        

        // clear everything
        if(currentSpice)
        {
            removeSpice(currentSpice)
        }
        
        if (Object.keys(spicePanel).length > 0) {
            spicePanel.count.destroy();
            spicePanel.start.destroy();
            spicePanel.size.destroy();
            spicePanel.end.destroy();
            spicePanel.removeButton.destroy();  
        }
    
        // add spice
        addSpice(spiceName);
        const spice = jar.content.spices[spiceName];
        currentSpice = spiceName
        spice.startPercentage = 0; 
        spice.endPercentage = 0;
        console.log('jar content', jar.content); 
        
        /*
        SLIDERS
        */
    
        // count
        spicePanel.count = spiceFolder.add(spice.params, 'count').min(0).max(100000).onChange(() => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Count (when jar is filled)')

        // start
        spicePanel.size = spiceFolder.add(spice.params, 'size').min(0).max(2).onChange((value) => 
        {
            calculatePoints(spice, value, spice.endPercentage); 
            console.log('jar content', jar.content); 
        });
    
        // start
        spicePanel.start = spiceFolder.add(spice, 'startPercentage').min(0).max(100).onChange((value) => 
        {
            calculatePoints(spice, value, spice.endPercentage); 
            console.log('jar content', jar.content); 
        });
    
        // end
        spicePanel.end = spiceFolder.add(spice, 'endPercentage').min(0).max(100).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, value); 
            console.log('jar content', jar.content); 
        });
      
        // self destruct button
        spicePanel.removeButton = spiceFolder.add({ remove: () => {
            spiceFolder.destroy();
            removeSpice(spiceName)
            console.log('jar content', jar.content); 
            spicesInJar -= 1; 
        }}, 'remove').name('Remove');
    });
}

// add button
spicesFolder.add({ addSpice: () => {
    if (spicesInJar < 7) {
        createSpiceDropdown();
        console.log('jar content', jar.content); 
        spicesInJar += 1; 
    } else {
        
    }
}}, 'addSpice').name('Add Spice');


// optimize button
spicesFolder.add({ optimize: () => {
    if (spicesInJar > 0) {
        // Give the jar a spin using GSAP
        const spinDuration = 1; // duration in seconds
        const spinAngle = Math.PI * 2; // 360 degrees

        gsap.to(group.rotation, {
            y: group.rotation.y + spinAngle,
            duration: spinDuration,
            ease: "power1.inOut"
        });
    } else {
        console.log('No spices in the jar to optimize');
    }
}}, 'optimize').name('Optimize');
}

// load models and begin experience when ready
loadModels();


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

