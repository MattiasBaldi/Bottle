import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import fakeParticlesVertexShader from './shaders/fakeParticles/vertex.glsl'
import fakeParticlesFragmentShader from './shaders/fakeParticles/fragment.glsl'
import Particles from './particles.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

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
camera.position.y = 3
camera.position.z = 4
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
 * Add group
 */

const group = new THREE.Group()
scene.add(group)
group.scale.set(1, 1, 1)



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
    clearcoat: 0.1, // Add a small clearcoat for better reflections
    clearcoatRoughness: 0.1, // Slight roughness for clearcoat
    side: THREE.FrontSide
});

const gltfscene = gltf.scene;
const jar = gltfscene.children[0]
jar.scale.setScalar(1)
jar.position.set(0, 0, 0)
jar.material = glassMaterial
group.add(jar)


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


// /**
//  * Particles
//  */
// const particles = new Particles(jar.geometry)
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


// /**
//  * Mesh Sampler
//  */

    let points = null;

    function addPointsToJar(jar, startPercentage, endPercentage) {
        // Remove existing points if they exist
        if (points) {
            scene.remove(points);
            points.geometry.dispose();
            points.material.dispose();
            points = null;
        }

        // Create a sampler for a Mesh surface.
        const sampler = new MeshSurfaceSampler(jar).build();

        const pointsGeometry = new THREE.BufferGeometry();
        const count = 1000000; // Number of points to generate
        const positions = new Float32Array(count * 3);

        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const pointsMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.01 });

        // Define the threshold for the y value (startPercentage to endPercentage of the jar's height)
        const minY = jar.geometry.boundingBox.min.y;
        const maxY = jar.geometry.boundingBox.max.y;
        const startY = minY + (maxY - minY) * startPercentage * 0.01;
        const endY = minY + (maxY - minY) * endPercentage * 0.01;

        // Sample randomly from the surface, generating points on the jar geometry
        let sampledCount = 0;
        for (let i = 0; i < count; i++) {
            sampler.sample(position, normal);

            // Only add points on the outside surface within the threshold
            if (position.y >= startY && position.y <= endY && normal.dot(new THREE.Vector3(0, 1, 0)) < 0.5) {
                positions.set([position.x, position.y, position.z], sampledCount * 3);
                sampledCount++;
            }
        }

        // Adjust the buffer size to the actual number of sampled points
        const adjustedPositions = positions.subarray(0, sampledCount * 3);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
        points = new THREE.Points(pointsGeometry, pointsMaterial);

        scene.add(points);
    }

    addPointsToJar(jar, 10, 30);

    const jarFolder = debug.addFolder('Jar');
    jarFolder.close();
    const jarParams = { startPercentage: 10, endPercentage: 30 };
    jarFolder.add(jarParams, 'startPercentage').min(0).max(100).step(1).name('Start Percentage').onChange(() => {
        addPointsToJar(jar, jarParams.startPercentage, jarParams.endPercentage);
    });
    jarFolder.add(jarParams, 'endPercentage').min(0).max(100).step(1).name('End Percentage').onChange(() => {
        addPointsToJar(jar, jarParams.startPercentage, jarParams.endPercentage);
    });

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