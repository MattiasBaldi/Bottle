import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import spritesVertexShader from './shaders/sprites/vertex.glsl'
import spritesFragmentShader from './shaders/sprites/fragment.glsl'
import Spice from './spice.js'
import { MeshTransmissionMaterial } from '@pmndrs/vanilla'

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
// const backgroundFolder = debug.addFolder('Background');
// backgroundFolder.close()
// const backgroundParams = { background: false };
// backgroundFolder.add(backgroundParams, 'background').name('Toggle Background').onChange((value) => {
//     scene.background = value ? scene.environment : new THREE.Color('#ffffff'); 
// });

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
const enabled = true; // or true, depending on your requirement
controls.enableDamping = enabled;
controls.minDistance = enabled ? 3.5 : 0;
controls.maxDistance = enabled ? 4 : Infinity;
controls.enablePan = enabled ? false : true;
controls.maxPolarAngle = enabled ? Math.PI / 2 : Math.PI;
controls.minPolarAngle = enabled ? Math.PI / 2 : 0;


// const controlsFolder = debug.addFolder('Controls');
// const controlsParams = { enableControls: false };
// controlsFolder.add(controlsParams, 'enableControls').name('Disable Controls').onChange((enabled) => {
//     controls.enableDamping = enabled;
//     controls.minDistance = enabled ? 3.5 : 0;
//     controls.maxDistance = enabled ? 4 : Infinity;
//     controls.enablePan = enabled ? false : true;
//     controls.maxPolarAngle = enabled ? Math.PI / 2 : Math.PI;
//     controls.minPolarAngle = enabled ? Math.PI / 2 : 0;
// });

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    alpha: true // Add alpha: true for proper transparency handling
})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))

// Add these settings for proper transmission material handling
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// Create a render target for the transmission material
const renderTarget = new THREE.WebGLRenderTarget(
    sizes.width * Math.min(window.devicePixelRatio, 1),
    sizes.height * Math.min(window.devicePixelRatio, 1)
);
renderTarget.texture.colorSpace = THREE.SRGBColorSpace;

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
        
        // Update render target
        renderTarget.setSize(
            sizes.width * Math.min(window.devicePixelRatio, 1),
            sizes.height * Math.min(window.devicePixelRatio, 1)
        )
    })

/**
 * Load Texture
 */
const textureLoader = new THREE.TextureLoader()

const sprites =
{
    chili: 
    {
        one: textureLoader.load('./textures/sprites/chili_flake_one.png'), 
        two: textureLoader.load('./textures/sprites/chili_flake_two.png'), 
        three: textureLoader.load('./textures/sprites/chili_flake_three.png'), 
    }, 

    pepperCorn: textureLoader.load('./textures/sprites/pepperCorn.png'), 
    sugarCube: textureLoader.load('./textures/sprites/sugarCube.png'), 
    basilLeaf: textureLoader.load('./textures/sprites/basilLeaf.png'), 
    sugar: textureLoader.load('./textures/sprites/sugar.png'), 
    powder: textureLoader.load('./textures/sprites/powder.png'), 
}


// Set sRGB encoding for all sprites
Object.values(sprites).forEach(sprite => {
    sprite.colorSpace = THREE.SRGBColorSpace
});

/**
 * Load models
 */
const gltfLoader = new GLTFLoader()
let glassMaterial = null; 
let jar = null; 
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
glassMaterial = new MeshTransmissionMaterial({
    _transmission: 1,        // Correct for this implementation
    thickness: 0.1,          // Good, this is > 0
    roughness: 0,
    chromaticAberration: 0.03,
    anisotropicBlur: 0.1,
    distortion: 0.1,         // Increased to 0.1
    distortionScale: 0.5,
    temporalDistortion: 0.0,
    ior: 1.5,                // Add IOR (index of refraction)
    samples: 1,              // Increase sample count
    attenuationDistance: Infinity, // Added attenuation distance
    attenuationColor: new THREE.Color(0xffffff), // Added attenuation color
    reflectivity: 0,        // Added reflectivity
    color: new THREE.Color(0xffffff), // Added color
    buffer: renderTarget.texture, // This is the critical missing piece
});


// Geometry
jar = bottle.scene.children[0]
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
const jarParams = { 
    visible: true, 
    boxVisible: false, 
    wireframe: false, 
    side: 'FrontSide',
    alphaTest: glassMaterial.alphaTest,
    depthWrite: glassMaterial.depthWrite,
    depthTest: glassMaterial.depthTest,
    chromaticAberration: glassMaterial.chromaticAberration,
    anisotropicBlur: glassMaterial.anisotropicBlur,
    distortion: glassMaterial.distortion,
    distortionScale: glassMaterial.distortionScale,
    temporalDistortion: glassMaterial.temporalDistortion
};
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
bottleFolder.add(glassMaterial, '_transmission').min(0).max(1).step(0.01).name('_Transmission')
bottleFolder.add(glassMaterial, 'thickness').min(0).max(1).step(0.01).name('Thickness')
bottleFolder.add(glassMaterial, 'opacity').min(0).max(1).step(0.01).name('Opacity')
bottleFolder.add(glassMaterial, 'envMapIntensity').min(0).max(10).step(0.1).name('EnvMap Intensity')
bottleFolder.add(jarParams, 'chromaticAberration').min(0).max(1).step(0.01).name('Chromatic Aberration').onChange((value) => {
    glassMaterial.chromaticAberration = value;
});
bottleFolder.add(jarParams, 'anisotropicBlur').min(0).max(1).step(0.01).name('Anisotropic Blur').onChange((value) => {
    glassMaterial.anisotropicBlur = value;
});
bottleFolder.add(jarParams, 'distortion').min(0).max(1).step(0.01).name('Distortion').onChange((value) => {
    glassMaterial.distortion = value;
});
bottleFolder.add(jarParams, 'distortionScale').min(0).max(1).step(0.01).name('Distortion Scale').onChange((value) => {
    glassMaterial.distortionScale = value;
});
bottleFolder.add(jarParams, 'temporalDistortion').min(0).max(1).step(0.01).name('Temporal Distortion').onChange((value) => {
    glassMaterial.temporalDistortion = value;
});
bottleFolder.add(glassMaterial, '_transmission').min(0).max(1).step(0.01).name('Transmission')
bottleFolder.add(glassMaterial, 'ior').min(1).max(2.33).step(0.01).name('IOR')

/**
 * Spices
 */
const createShaderMaterial = 
({
    spriteTextureOne = null, spritePercentageOne = 0,
    spriteTextureTwo = null, spritePercentageTwo = 0,
    spriteTextureThree = null, spritePercentageThree = 0
}) => 
{

const shader = new THREE.ShaderMaterial
({

    vertexShader: spritesVertexShader, 
    fragmentShader: spritesFragmentShader,
    uniforms: 
    {
        uSize: new THREE.Uniform(100 * renderer.getPixelRatio()), // Size will be updated when particle size changes

        // Vibrance
        uSaturation: new THREE.Uniform(1.0),
        uBrightness: new THREE.Uniform(1.0),

        // Textures || Sprites
        uSpriteOne: new THREE.Uniform(spriteTextureOne),
        uSpriteOnePercentage: new THREE.Uniform(spritePercentageOne),
        uSpriteTwo: new THREE.Uniform(spriteTextureTwo),
        uSpriteTwoPercentage: new THREE.Uniform(spritePercentageTwo),
        uSpriteThree: new THREE.Uniform(spriteTextureThree),
        uSpriteThreePercentage: new THREE.Uniform(spritePercentageThree),

        // Details
        uEdgeSoftness: new THREE.Uniform(0.5), // Controls the blur at the edges to simulate powdered vs. granular spices.
        uNoiseIntensity: new THREE.Uniform(0.5), // use procedural noise instead of large noise textures.
        uSpecular: new THREE.Uniform(0.5), // Adds slight highlights for glossy spices like peppercorns. For shiny spices like seeds but reduce the number of specular calculations in the shader.
        uSubsurface: new THREE.Uniform(0.5) // Mimics light scattering through spices like turmeric.
    },
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    // blending: THREE.NormalBlending,
})

return shader
}

const spices = 
{

    // Instances 
    // INSTANCE_basil:
    // {
    //     container: jar, 
    //     type: 'instance', // Determine what is used
    //     mesh: spiceModels.scene.getObjectByName('basil'), 
    //     density: 10,

    //     selfCollisionDistance: 0.2, 

    //     size: 0.75,
    //     sizeRandomize: 0.05, 

    //     rotation: new THREE.Vector3(1, 1, 1),
    //     rotationRandomize: 1.0,
    // },

    // INSTANCE_anise:
    // {
    //     type: 'instance', // Determine what is used
    //     mesh: spiceModels.scene.getObjectByName('star_anise'), 
    //     density: 100,

    //     selfCollisionDistance: 0.2, 

    //     size: 0.8,
    //     sizeRandomize: 0.05, 

    //     rotation: new THREE.Vector3(1, 1, 1),
    //     rotationRandomize: 0.7,
    // },

    // INSTANCE_cloves:
    // {
    //     type: 'instance', // Determine what is used
    //     mesh: spiceModels.scene.getObjectByName('cloves'), 
    //     density: 800,

    //     selfCollisionDistance: 0.2, 
        
    //     size: 0.5,
    //     sizeRandomize: 0.05, 

    //     rotation: new THREE.Vector3(1, 1, 1),
    //     rotationRandomize: 0.7,

    // },

    INSTANCE_peppercorn:
    {
        type: 'instance', // Determine what is used
        density: 100,
        mesh: spiceModels.scene.getObjectByName('pepper'), 

        containerCollisisonDistance: 0.1, 
        selfCollisionDistance: 0.2, 
        
        size: 0.1,
        sizeRandomize: 0.01, 

        rotation: new THREE.Vector3(1, 1, 1),
        rotationRandomize: 0.7,
    },

    // INSTANCE_seeds:
    // {
    //     type: 'instance', // Determine what is used
    //     density: 100,
    //     mesh: spiceModels.scene.getObjectByName('seed'), 

    //     selfCollisionDistance: 0.2, 
        
    //     size: 1,
    //     sizeRandomize: 0.01, 

    //     rotation: new THREE.Vector3(1, 1, 1),
    //     rotationRandomize: 0.7,

    // },

    INSTANCE_chili_flakes:
    {
        type: 'instance', // Determine what is used
        density: 250,
        mesh: spiceModels.scene.getObjectByName('chili'), 

        selfCollisionDistance: 0.01, 
        
        size: 0.125,
        sizeRandomize: 0.125, 

        rotation: new THREE.Vector3(1, 1, 2),
        rotationRandomize: 1.0,
    },

    INSTANCE_powder:
    {
        type: 'instance', // Determine what is used
        density: 150,
        mesh: spiceModels.scene.getObjectByName('powder'), 

        selfCollisionDistance: 0.2, 
        
        size: 0.1,
        sizeRandomize: 0.01, 

        rotation: new THREE.Vector3(1, 1, 1),
        rotationRandomize: 0.7,

    },

    // Sprites
    POINTS_chili_powder_withSprites:
    {
        type: 'sprite', // Determine what is used
        density: 1000,

        selfCollisionDistance: 0.2, 
        
        size: 1,
        sizeRandomize: 0.01, 

        rotation: new THREE.Vector3(1, 1, 1),
        rotationRandomize: 0.7,

        material: createShaderMaterial({
            spriteTextureOne: sprites.chili.one, 
            spritePercentageOne: 0.3,
            spriteTextureTwo: sprites.chili.two, 
            spritePercentageTwo: 0.3,
            spriteTextureThree: sprites.chili.three, 
            spritePercentageThree: 0.3
        })
    },

    POINTS_powder_withSprites:
    {
        type: 'sprite', // Determine what is used
        density: 420,

        selfCollisionDistance: 0.2, 

        size: 1.5,
        sizeRandomize: 0.7,

        rotation: new THREE.Vector3(1, 1, 1),
        rotationRandomize: 0.7,

        material: new THREE.PointsMaterial
        ({
            sizeAttenuation: true,
            map: sprites.powder,
            size: 0.4,
            transparent: true,
            // depthWrite: false,
            alphaTest: 0.9, 
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
            Object.keys(spicePanel).forEach((panel) => {
                panel.destroy()
            })
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

        const materialFolder = spiceFolder.addFolder('Material tweaks')

        // count
        spicePanel.density = materialFolder.add(spice.params, 'density').min(0).max(spice.params.type === 'sprite' ? 2500 : 500).onChange(() => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Density (particles per %)')

        // selfCollisionDistance
        spicePanel.selfCollisionDistance = materialFolder.add(spice.params, 'selfCollisionDistance').min(0).max(1).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            console.log('jar content', jar.content);
        });


        // size
        spicePanel.size = materialFolder.add(spice.params, 'size').min(0).max(1).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
            
        }); 

        // Update shader size uniform if using shader material
        spicePanel.sizeRandomize = materialFolder.add(spice.params, 'sizeRandomize').min(0).max(1).step(0.01).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
            
            // Update shader size uniform if using shader material
            if(spice.params.type === 'sprite' && spice.params.material && spice.params.material.uniforms && spice.params.material.uniforms.uSize) {
                spice.params.material.uniforms.uSize.value = spice.params.size * renderer.getPixelRatio();
            }
        });

        // rotation
        spicePanel.rotation = materialFolder.add(spice.params.rotation, 'x').min(0).max(Math.PI).step(0.01).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Rotation X');
        spicePanel.rotation = materialFolder.add(spice.params.rotation, 'y').min(0).max(Math.PI).step(0.01).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Rotation Y');
        spicePanel.rotation = materialFolder.add(spice.params.rotation, 'z').min(0).max(Math.PI).step(0.01).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Rotation Z');

        // rotationRandomize
        spicePanel.rotationRandomize = materialFolder.add(spice.params, 'rotationRandomize').min(0).max(1).step(0.01).onChange((value) => 
        {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
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
    
    // 2. Render the scene to the render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    // 3. Show the mesh and render normally
    renderer.setRenderTarget(null);
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

