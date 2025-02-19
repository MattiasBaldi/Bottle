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

// Debug for camera position
const cameraFolder = debug.addFolder('Camera');
cameraFolder.close();
cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.01).name('Camera X');
cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.01).name('Camera Y');
cameraFolder.add(camera.position, 'z').min(-10).max(10).step(0.01).name('Camera Z');
cameraFolder.add(camera, 'fov').min(1).max(180).step(1).name('Field of View').onChange(() => {
    camera.updateProjectionMatrix();
});

// Controls
const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
// controls.minDistance = 3.5; 
// controls.maxDistance = 4;
// controls.enablePan = false; 

// // Limit controls to horizontal rotation only
// controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below the object
// controls.minPolarAngle = Math.PI / 2; // Prevent camera from going above the object

// Debug for max zoom
const zoomFolder = debug.addFolder('Zoom');
zoomFolder.close();
zoomFolder.add(controls, 'minDistance').min(1).max(10).step(1).name('Min Zoom');
zoomFolder.add(controls, 'maxDistance').min(1).max(10).step(1).name('Max Zoom');


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
const particlesTexture = textureLoader.load('./textures/particles/pepper.png')

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

// Normal viewer
const normalHelper = new VertexNormalsHelper(jar, 0.2, 'green');
normalHelper.visible = false; 
scene.add(normalHelper);

// Debug for normal viewer
const normalFolder = debug.addFolder('Normals');
normalFolder.close();
const normalParams = { showNormals: false };
normalFolder.add(normalParams, 'showNormals').name('Show Normals').onChange((value) => {
    normalHelper.visible = value;
});

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

// Material
const pointsMaterial = new THREE.PointsMaterial
({ 
    size: 0.06,
    map: particlesTexture,
    transparent: true,
    alphaMap: particlesTexture,
    sizeAttenuation: true,
    depthWrite: false,
    vertexColors: true,
    // side: THREE.DoubleSide
    // color: 'red'
});

// Fill
const fill = {}
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

// Create topsurface mesh
function generatePoints(mesh, count, startY, endY) {
    // Begin the sampler
    const sampler = new MeshSurfaceSampler(mesh).build();
    const pointsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); // Array to store colors
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();

    // Sample randomly from the surface, generating points on the jar geometry
    let sampledCount = 0;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3
        sampler.sample(position, normal);

        // Only add points on y threshold and ensure they are inside the jar
        if (position.y >= startY && position.y <= endY) {    
            
            // Set position
            position.multiplyScalar(0.97); // Offset to fit inside jar
            positions.set([position.x, position.y, position.z], sampledCount * 3);
            
      
            sampledCount++;
        }

              // colors
              if( i % 10)
                {
                colors[ i3 + 0 ] = 1
                colors[ i3 + 1] = 0
                colors[ i3 + 2] = 0
                }
            
                else 
                {
                colors[i3 + 0] = 1
                colors[i3 + 1] = 0.4
                colors[i3 + 2] = 0
                    
                }
            
    }

    // Adjust arrays to the actual number of sampled points
    const adjustedPositions = positions.subarray(0, sampledCount * 3);
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    points = new THREE.Points(pointsGeometry, pointsMaterial);
    return points; 
}

// Generate points
topSurface.points = generatePoints(topSurface, count * 0.1, startY, endY)
points = generatePoints(container, count, startY, endY);
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
pointsFolder.add(pointsMaterial, 'size').min(0.001).max(1).step(0.001).name('Point Size')
pointsFolder.add(pointsParams, 'count').min(1000).max(10000000).step(1000).name('Point Count').onChange((value) => {
    count = value;
    addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
});
pointsFolder.addColor({ color: pointsMaterial.color.getHex() }, 'color').onChange((value) => {
    pointsMaterial.color.set(value);
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
    
        // Materials
        if(points)
            points.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
    
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

