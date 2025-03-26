import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import spritesVertexShader from './shaders/sprites/vertex.glsl'
import spritesFragmentShader from './shaders/sprites/fragment.glsl'
import Spice from './spice.js'
import mixedSpices from './mixedSpices.js'
import { MeshTransmissionMaterial } from '@pmndrs/vanilla'
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

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
environmentloader.load('./environment/HDR/studi_1k.hdr', (texture) => {
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
const enabled = true; // or true, depending on your requirement
controls.enableDamping = enabled;
controls.minDistance = enabled ? 3.5 : 0;
controls.maxDistance = enabled ? 4 : Infinity;
controls.enablePan = enabled ? false : true;
controls.maxPolarAngle = enabled ? Math.PI / 2 : Math.PI;
controls.minPolarAngle = enabled ? Math.PI / 2 : 0;

const controlsFolder = debug.addFolder('Controls');
const controlsParams = { enableControls: true };
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
    antialias: false,
    // alpha: true // Add alpha: true for proper transparency handling
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

    chiliPowder: textureLoader.load('./textures/sprites/chili_powder.png'),

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

// Geometrys
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
    uSize = null, 
    uSprite = null, 
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
        uSprite: new THREE.Uniform(uSprite),
        // uNormal: new THREE.Uniform(uSprite),
        // uDisplacement: new THREE.Uniform(uSprite),
        // uRoughness: new THREE.Uniform(uSprite),

        // Details
        uEdgeSoftness: new THREE.Uniform(0.5), // Controls the blur at the edges to simulate powdered vs. granular spices.
        uNoiseIntensity: new THREE.Uniform(0.5), // use procedural noise instead of large noise textures.
        uSpecular: new THREE.Uniform(0.5), // Adds slight highlights for glossy spices like peppercorns. For shiny spices like seeds but reduce the number of specular calculations in the shader.
        uSubsurface: new THREE.Uniform(0.5) // Mimics light scattering through spices like turmeric.
    },


    transparent: true,
    alphaTest: 0.9, 
    depthTest: true, 
    depthWrite: false,
    vertexColors: true,
    blending: THREE.NormalBlending,
})

return shader
}

const spices = 
{
    
    POINTS_chiliPowder_CustomShader:
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

    POINTS_powder_customShader:
    {
        type: 'sprite', // Determine what is used
        density: 1000,

        selfCollisionDistance: 0.2, 
        
        size: 1,
        sizeRandomize: 0.01, 

        rotation: new THREE.Vector3(1, 1, 1),
        rotationRandomize: 0.7,

        material: createShaderMaterial({
            spriteTextureOne: sprites.powder,
            spritePercentageOne: 1.0,
        })
    },

    POINTS_powder_PointsMaterial:
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
            depthWrite: false,
            alphaTest: 0.9, 
        })
    },

    POINTS_chiliPowder_PointsMaterial:
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
            map: sprites.chiliPowder,
            size: 0.4,
            transparent: true,
            depthWrite: false,
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
    const spice = new Spice(jar, spices[spiceName]);
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
    recalculateTop();
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
        spice.points = spice.create(spice.startPercentage, spice.endPercentage);  
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
            spice.points = spice.create(spice.startPercentage, spice.endPercentage);
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
            spice.points = spice.create(spice.startPercentage, spice.endPercentage, true); // setting to true to include the top
            group.add(spice.points);
        
        }
    });
}

function mixSpices()
{
    jar.content.mix = new mixedSpices(jar, jar.content.spices)
    const mix = jar.content.mix.mix();
    group.add(mix)

    // Clear other spices
    for(const key in jar.content.spices)
        {
            const spice = jar.content.spices[key]
            spice.points.geometry.dispose()
            spice.points.material.dispose()
            group.remove(spice.points)
        }
        jar.content.spices = {};
}

const addLabel = (jar, color, text) =>
{
    const size = new THREE.Vector3(
        jar.geometry.boundingBox.max.z - jar.geometry.boundingBox.min.x,
        (jar.geometry.boundingBox.max.y - jar.geometry.boundingBox.min.y) * 0.25, // 2/10 of height (y)
        jar.geometry.boundingBox.max.z - jar.geometry.boundingBox.min.z // Full depth (z)
    );

    const position = new THREE.Vector3(
        0,
        (jar.geometry.boundingBox.max.y + jar.geometry.boundingBox.min.y) / 2 - 0.25,
        0
    ); 

    // Define the position for the decal at the center
    const labelGeometry = new DecalGeometry(jar, position, new THREE.Quaternion(), size);
    
    const canvas = document.createElement('canvas');
    const boundingBox = jar.geometry.boundingBox;
    const width = boundingBox.max.x - boundingBox.min.x;
    const height = (boundingBox.max.y - boundingBox.min.y) * 0.25; // 2/10 of height
    const aspectRatio = width / height; // Calculate aspect ratio
    const scaleFactor = 512; // Base scale factor for resolution
    canvas.width = Math.ceil(scaleFactor * aspectRatio); // Adjust width based on aspect ratio
    canvas.height = Math.ceil(scaleFactor); // Use scale factor for height
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.globalAlpha = 1.0; // Ensure full opacity
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.font = `${Math.ceil(canvas.height * 0.1)}px helvetica`; // Scale font size proportionally
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw the text
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const labelTexture = new THREE.CanvasTexture(canvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
    labelTexture.minFilter = THREE.LinearFilter; // Prevent mipmap issues
    labelTexture.magFilter = THREE.LinearFilter;

    const labelMaterial = new THREE.MeshStandardMaterial({
        color: color,
        map: labelTexture,
        transparent: true, // Enable transparency
        roughness: 0.1, 
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
    });

    return new THREE.Mesh(labelGeometry, labelMaterial);
};

/**
 * Panel
 */

// params
const spicesFolder = debug.addFolder('Spices')
const spiceOptions = Object.keys(spices);
const spiceParams = { selectedSpice: spiceOptions[0] };
let spicesInJar = 0;
const panel = {}

// dropdown component
const createSpiceDropdown = () => {
    const spiceFolder = spicesFolder.addFolder(`Spice ${Object.keys(jar.content.spices).length + 1}`);
    spiceParams.selectedSpice = ''; // Set initial name to nothing

    // add dropdown
    const spicePanel = {};
    let currentSpice = null; 
    
    spiceFolder.add(spiceParams, 'selectedSpice', spiceOptions).name('Select Spice').onChange((spiceName) => {
        // clear everything
        if(currentSpice) {
            removeSpice(currentSpice);
        }
        
        if (Object.keys(spicePanel).length > 0) {
            Object.keys(spicePanel).forEach((panel) => {
                panel.destroy();
            });
        }
    
        // add spice
        addSpice(spiceName);
        const spice = jar.content.spices[spiceName];
        currentSpice = spiceName;
        spice.startPercentage = 0; 
        spice.endPercentage = 0;
        
        /*
        SLIDERS
        */
    
        // start
        spicePanel.start = spiceFolder.add(spice, 'startPercentage').min(0).max(100).onChange((value) => {
            calculatePoints(spice, value, spice.endPercentage); 
            console.log('jar content', jar.content); 
        });
    
        // end
        spicePanel.end = spiceFolder.add(spice, 'endPercentage').min(0).max(100).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, value); 
            console.log('jar content', jar.content); 
        });

        const materialFolder = spiceFolder.addFolder('Material tweaks');

        // count
        spicePanel.density = materialFolder.add(spice.params, 'density').min(0).max(spice.params.type === 'sprite' ? 2500 : 500).onChange(() => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Density (particles per %)');

        // selfCollisionDistance
        spicePanel.selfCollisionDistance = materialFolder.add(spice.params, 'selfCollisionDistance').min(0).max(1).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            console.log('jar content', jar.content);
        });

        // size
        spicePanel.size = materialFolder.add(spice.params, 'size').min(0).max(1).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }); 

        // Update shader size uniform if using shader material
        spicePanel.sizeRandomize = materialFolder.add(spice.params, 'sizeRandomize').min(0).max(1).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
            
            // Update shader size uniform if using shader material
            if(spice.params.type === 'sprite' && spice.params.material && spice.params.material.uniforms && spice.params.material.uniforms.uSize) {
                spice.params.material.uniforms.uSize.value = spice.params.size * renderer.getPixelRatio();
            }
        });

        // rotation
        spicePanel.rotationX = materialFolder.add(spice.params.rotation, 'x').min(0).max(Math.PI).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Rotation X');
        spicePanel.rotationY = materialFolder.add(spice.params.rotation, 'y').min(0).max(Math.PI).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Rotation Y');
        spicePanel.rotationZ = materialFolder.add(spice.params.rotation, 'z').min(0).max(Math.PI).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        }).name('Rotation Z');

        // rotationRandomize
        spicePanel.rotationRandomize = materialFolder.add(spice.params, 'rotationRandomize').min(0).max(1).step(0.01).onChange((value) => {
            calculatePoints(spice, spice.startPercentage, spice.endPercentage); 
            console.log('jar content', jar.content); 
        });

        if (spice.params.type === 'sprite' && spice.params.material) {
            spicePanel.transparent = materialFolder.add(spice.params.material, 'transparent').name('Transparent').onChange((value) => {
            spice.params.material.transparent = value;
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            });

            spicePanel.alphaTest = materialFolder.add(spice.params.material, 'alphaTest').min(0).max(1).step(0.01).name('Alpha Test').onChange((value) => {
            spice.params.material.alphaTest = value;
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            });

            spicePanel.depthTest = materialFolder.add(spice.params.material, 'depthTest').name('Depth Test').onChange((value) => {
            spice.params.material.depthTest = value;
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            });

            spicePanel.vertexColors = materialFolder.add(spice.params.material, 'vertexColors').name('Vertex Colors').onChange((value) => {
            spice.params.material.vertexColors = value;
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            });

            spicePanel.blending = materialFolder.add(spice.params.material, 'blending', {
            NoBlending: THREE.NoBlending,
            NormalBlending: THREE.NormalBlending,
            AdditiveBlending: THREE.AdditiveBlending,
            SubtractiveBlending: THREE.SubtractiveBlending,
            MultiplyBlending: THREE.MultiplyBlending
            }).name('Blending').onChange((value) => {
            spice.params.material.blending = parseInt(value);
            calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            });

            spicePanel.depthWrite = materialFolder.add(spice.params.material, 'depthWrite').name('Depth Write').onChange((value) => {
                spice.params.material.depthWrite = value;
                calculatePoints(spice, spice.startPercentage, spice.endPercentage);
            });
        }

        // self destruct button
        spicePanel.removeButton = spiceFolder.add({ remove: () => {
            spiceFolder.destroy();
            removeSpice(spiceName);
            console.log('jar content', jar.content); 
            spicesInJar -= 1; 
        }}, 'remove').name('Remove');
    });
    return spiceFolder;
};

// add button
const createAddButton = () => {
    const button = spicesFolder.add({ addSpice: () => {
        if (spicesInJar < 7) {
            createSpiceDropdown();
            console.log('jar content', jar.content); 
            spicesInJar += 1; 
        } else {
            console.log('Maximum number of spices reached');
        }
    }}, 'addSpice').name('Add Spice');
    return button;
};

// optimize button
const createOptimizeButton = () => {
    const button = spicesFolder.add({ optimize: () => {
        if (spicesInJar > 0) {

            // Give the jar a spin using GSAP
            const spinDuration = 1; // duration in seconds
            const spinAngle = Math.PI * 2; // 360 degrees
            
            gsap.to(group.rotation, {
                y: group.rotation.y + spinAngle, // Rotate around Y axis (vertical)
                duration: spinDuration,
                ease: "power1.inOut",
                onComplete: () => {
                    // Mix spices after animation completes
                    mixSpices();
                    jar.label = addLabel(jar, 'white', 'TEST'); 
                    group.add(jar.label);

                    debug.add(jar.label.material, 'opacity').min(0).max(1).step(0.01).name('Label Opacity').onChange(() => {
                        jar.label.material.needsUpdate = true;
                    });
                    debug.add(jar.label.material, 'transparent').name('Label Transparent').onChange(() => {
                        jar.label.material.needsUpdate = true;
                    });
                    debug.addColor(jar.label.material, 'color').name('Label Color').onChange(() => {
                        jar.label.material.needsUpdate = true;
                    });
                    debug.add(jar.label.material, 'roughness').min(0).max(1).step(0.01).name('Label Roughness').onChange(() => {
                        jar.label.material.needsUpdate = true;
                    });
                    debug.add(jar.label.material, 'metalness').min(0).max(1).step(0.01).name('Label Metalness').onChange(() => {
                        jar.label.material.needsUpdate = true;
                    });

                    if(!panel.resetButton)
                        panel.resetButton = createResetButton();
                    panel.addButton = null; 
                }
            });
        } else {
            console.log('No spices in the jar to optimize');
        }
    }}, 'optimize').name('Optimize');

    return button;
};

// reset button
const createResetButton = () => {
    // Destroy all existing buttons in spice.folder
    spicesFolder.children.forEach(child => child.destroy());

    // Add a reset button that resets the entire experience
    const button = spicesFolder.add({ reset: () => {
        // Remove all spices
        spicesInJar = 0;

        // Clear the mix if it exists
        if (jar.content.mix) {
            jar.content.mix.points.children.forEach(child => {
                child.geometry.dispose();
                child.material.dispose();
            });
            group.remove(jar.label);
            group.remove(jar.content.mix);
            jar.content.mix = null;
        }

        // Recreate the spice dropdown
        if(!panel.addButton)
            panel.addButton = createAddButton();
    }}, 'reset').name('Reset');
    return button;
};

// init panel
panel.addButton = createAddButton();
panel.optimizeButton = createOptimizeButton(); 

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

