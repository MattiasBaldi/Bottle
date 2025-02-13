import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import fakeParticlesVertexShader from './shaders/fakeParticles/vertex.glsl'
import fakeParticlesFragmentShader from './shaders/fakeParticles/fragment.glsl'
import Particles from './particles.js'

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
    scene.background = value ? scene.environment : null;
});



// CUBE TEXTURE LOADER

// LDR cube texture
// const cubeTextureLoader = new THREE.CubeTextureLoader()
// const environmentMap = cubeTextureLoader.load([
//     'Environment/CubeMap/restaurant/px.png',
//     'Environment/CubeMap/restaurant/nx.png',
//     'Environment/CubeMap/restaurant/py.png',
//     'Environment/CubeMap/restaurant/ny.png',
//     'Environment/CubeMap/restaurant/pz.png',
//     'Environment/CubeMap/restaurant/nz.png',
// ])

// scene.background = new THREE.Color('#ffffff')
// scene.environment = environmentMap
// scene.environmentIntensity = 1; 


/**
 * Container
 */

const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 'white',
    roughness: 0,
    metalness: 0,
    transmission: 0.95, // Slightly lower transparency for better performance
    opacity: 0.4,
    transparent: true,
    envMapIntensity: 1.0, // Ensure environment map intensity is set
    clearcoat: 0.1, // Add a small clearcoat for better reflections
    clearcoatRoughness: 0.1 // Slight roughness for clearcoat
});

const containerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 64)
const container = new THREE.Mesh(containerGeometry, glassMaterial);

// Add model
const gltfLoader = new GLTFLoader()
gltfLoader.load('./models/bottle.glb', (gltf) => {
    console.log(gltf)
    const gltfscene = gltf.scene;
    gltfscene.position.set(0, 0, 0)
    const model = gltfscene.children[0]
    console.log(container)
    model.material = glassMaterial
    scene.add(gltfscene)
})

// Debug for glass material
const bottleFolder = debug.addFolder('Bottle')
bottleFolder.close()
bottleFolder.addColor(glassMaterial, 'color').name('Color')
bottleFolder.add(glassMaterial, 'roughness').min(0).max(1).step(0.01).name('Roughness')
bottleFolder.add(glassMaterial, 'metalness').min(0).max(1).step(0.01).name('Roughness')
bottleFolder.add(glassMaterial, 'transmission').min(0).max(1).step(0.01).name('Transmission')
bottleFolder.add(glassMaterial, 'opacity').min(0).max(1).step(0.01).name('Opacity')
bottleFolder.add(glassMaterial, 'envMapIntensity').min(0).max(10).step(0.1).name('EnvMap Intensity')
bottleFolder.add(glassMaterial, 'clearcoat').min(0).max(1).step(0.01).name('Clearcoat')
bottleFolder.add(glassMaterial, 'clearcoatRoughness').min(0).max(1).step(0.01).name('Clearcoat Roughness')

/**
 * Fake Particles
 */

// // Geometry
// const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 64)

// // Texture
// const textureLoader = new THREE.TextureLoader();
// const textures = {
//     chili: textureLoader.load('./textures/chili.webp', texture => {
//         texture.wrapS = THREE.RepeatWrapping;
//         texture.wrapT = THREE.RepeatWrapping;
//     }),
//     oregano: textureLoader.load('./textures/oregano.webp', texture => {
//         texture.wrapS = THREE.RepeatWrapping;
//         texture.wrapT = THREE.RepeatWrapping;
//     })
// };

// // Material
// const material =     new THREE.ShaderMaterial
// ({ 
//     vertexShader: fakeParticlesVertexShader, 
//     fragmentShader: fakeParticlesFragmentShader, 
//     uniforms: 
//     {
//         uTexture: new THREE.Uniform(textures.chili)
//     },
//     // wireframe: true
// })

// const cylinder = new THREE.Mesh(geometry, material);
// cylinder.scale.set(0.999, 0.5, 0.999)
// cylinder.position.y =  ( cylinder.scale.y / 2 ) -0.5 + 0.001; 
// scene.add(cylinder)


// // // Debug
// const fakeParticlesFolder = debug.addFolder('Fake Particles')
// fakeParticlesFolder.close()
// fakeParticlesFolder.add(cylinder.scale, 'y').step(0.01).max(1).min(0.01).onChange((value) => { 
//     cylinder.scale.y = value;
//     cylinder.position.y =  ( cylinder.scale.y / 2 ) -0.5 + 0.001; 
//     cylinder.material.map.wrapS = THREE.RepeatWrapping;
//     cylinder.material.map.wrapT = THREE.RepeatWrapping;
//     cylinder.material.map.repeat.set(1, value);
//     cylinder.material.needsUpdate = true;
// }).name('Fill')
// fakeParticlesFolder.add({ material: 'chili' }, 'material', ['chili', 'oregano']).onChange(value => {
//     if (value) {
//         cylinder.material.map = textures[value];
//         cylinder.material.needsUpdate = true;
//     } else {
//         cylinder.material.map = null;
//         cylinder.material.needsUpdate = true;
//     }
// });

/**
 * Particles
 */
// const particles = new Particles(bottleFolder.geometry)
// particles.position.set(0, 0, 0)
// scene.add(particles)

// const parameters = {}
// parameters.count = 200000
// parameters.size = 0.005
// parameters.radius = 5
// parameters.branches = 3
// parameters.spin = 1
// parameters.randomness = 0.2
// parameters.randomnessPower = 3
// parameters.insideColor = '#ff6030'
// parameters.outsideColor = '#1b3984'


// gui.add(parameters, 'size').min(0.001).max(10).step(0.01).onFinishChange(generateGalaxy)
// gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
// gui.add(parameters, 'count').min(100).max(1000000).step(100).onFinishChange(generateGalaxy)
// gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
// gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
// gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
// gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
// gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 4
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))

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