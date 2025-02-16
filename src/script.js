import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import fakeParticlesVertexShader from './shaders/fakeParticles/vertex.glsl'
import fakeParticlesFragmentShader from './shaders/fakeParticles/fragment.glsl'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
})

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
controls.enableDamping = true

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
    side: THREE.DoubleSide
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


    // /**
    //  * Mesh Sampler
    //  */

    jar.geometry.computeBoundingBox();
    const yGroups = [];
    const minY = jar.geometry.boundingBox.min.y;
    const maxY = jar.geometry.boundingBox.max.y;
    const height = maxY - minY; 

    // Group vertices into groups based on their y-coordinate
    for (let i = 0; i < jar.geometry.attributes.position.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(jar.geometry.attributes.position, i);

        const y = vertex.y.toFixed(2); // Use a fixed precision to avoid floating-point issues
        if (!yGroups[y]) {
        yGroups[y] = [];
        }
        yGroups[y].push(vertex);
    }

    let points = null;
    let topSurface = null; 
    let mergedMesh = null; 

    function addPointsToJar(container, startPercentage, endPercentage) {
    // Remove existing points if they exist
    if (points) 
    {
        scene.remove(points);
        points.geometry.dispose();
        points.material.dispose();
        points = null;
    }

    if (mergedMesh) 
        {
            mergedMesh.geometry.dispose();
            mergedMesh.material.dispose();
            mergedMesh = null;
        }

    // if(topSurface)
    // {
    //     scene.remove(mesh)
    //     mesh.geometry.dispose() 
    //     mesh.material.dispose() 
    //     topSurface.geometry.dispose();
    //     topSurface = null; 
    // }
    
    
    // Define the threshold for the y value (startPercentage to endPercentage of the points position in the jar's height)
    const startY = minY + height * startPercentage * 0.01;
    const endY = minY + height * endPercentage * 0.01;

    // /**
    //  * Top Surface
    //  */
    topSurface  = 
    {
        vertices: [],
        geometry: null, 
    }

    const vertices = [];
    let geometry = null; 

    let closestYGroupIndex = null;
    let closestDistance = Infinity;

    // Store the yGroup index that is closest to the endY
    for (let y in yGroups) {
        const distance = Math.abs(endY - y);
        if (distance < closestDistance) {
        closestDistance = distance;
        closestYGroupIndex = y;
        }
    }

    // Add vertices of the closest group to the vertices array
    yGroups[closestYGroupIndex].forEach(vertex => {
        vertex.y = endY; // Update the y-coordinate to match the sides
        vertices.push(vertex)
    });

    // Order vertices counterclockwise
    vertices.sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));

    // Create a shape and add vertices
    const shape = new THREE.Shape();
    shape.moveTo(vertices[0].z, vertices[0].x);
    for (let i = 1; i < vertices.length; i++) {
        shape.lineTo(vertices[i].z, vertices[i].x);
    }
    shape.lineTo(vertices[0].z, vertices[0].x); // Close the shape

    // Add geometry
    const topSurfaceYPosition = endY - 0.001; // Added small offset so it never extends the endY
    topSurface.geometry = new THREE.ShapeGeometry(shape);
    topSurface.geometry.rotateX(Math.PI / -2); // Rotate the geometry 90 degrees around the X axis
    topSurface.geometry.translate(0, topSurfaceYPosition, 0); 

    // Create mesh & points for visualization
    // const pointGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
    // const pointMaterial = new THREE.PointsMaterial({ color: 'green', size: 0.05 });
    // const point = new THREE.Points(pointGeometry, pointMaterial);
    // scene.add(point);

    // const material = new THREE.MeshBasicMaterial({ color: 'green', side: THREE.DoubleSide });
    // const topSurface = new THREE.Mesh(geometry, material);
    // topSurface.material.wireframe = true;
    // scene.add(topSurface);

    // Merge top and side geometry
    const mergedGeometry = BufferGeometryUtils.mergeGeometries([container.geometry, topSurface.geometry]);
    mergedMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
    // scene.add(mesh)

    // Begin the sampler
    const sampler = new MeshSurfaceSampler(mergedMesh).build();
    const pointsGeometry = new THREE.BufferGeometry();
    const count = 100000; // Number of points to generate
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3); // Array to store colors
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const pointsMaterial = new THREE.PointsMaterial({ size: 0.04, vertexColors: true });    

    // Sample randomly from the surface, generating points on the jar geometry
    let sampledCount = 0;
    let topSurfacePoints = null; 
    for (let i = 0; i < count; i++) {
        sampler.sample(position, normal);

        // Only add points on y threshold and ensure they are inside the jar
        if (position.y >= startY && position.y <= endY) {    
            
            // Set position
            position.multiplyScalar(0.97); // Offset to fit inside jar
            positions.set([position.x, position.y, position.z], sampledCount * 3);

            // Randomize colors
            colors.set([Math.random(), Math.random(), Math.random()], sampledCount * 3);

            sampledCount++;

                // Add points at the top surface position to the topSurfacePoints variable
                if (position.y === topSurfaceYPosition) {
                if (!topSurfacePoints) {
                topSurfacePoints = [];
                }
                topSurfacePoints.push(position.clone());
                }
                    
        }

     
         
    }

    // /**
    //  * Adding Points
    //  */
    const adjustedPositions = positions.subarray(0, sampledCount * 3);
    const adjustedColors = colors.subarray(0, sampledCount * 3);
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(adjustedColors, 3));
    points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);
    }

    addPointsToJar(jar, 0, 32);

    // Debug 
    const pointsFolder = debug.addFolder('Points');
    pointsFolder.close();
    const pointsParams = { startPercentage: 0, endPercentage: 30 };
    pointsFolder.add(pointsParams, 'startPercentage').min(0).max(100).step(1).name('Start Percentage').onChange(() => {
        addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
    });
    pointsFolder.add(pointsParams, 'endPercentage').min(0).max(100).step(1).name('End Percentage').onChange(() => {
        addPointsToJar(jar, pointsParams.startPercentage, pointsParams.endPercentage);
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