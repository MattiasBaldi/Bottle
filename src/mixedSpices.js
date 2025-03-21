import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh'
import Spice from './spice.js'

export default class mixedSpices {
    constructor(jar, spices) 
    {
        // Parameters
        this.jar = jar 
        this.spices = spices
        this.params = params;
        this.type = this.params.type; // instances or points
        this.points = null; 

    }

    mix()
    {
        // run one samplePoints
        let percentageMissing = null; 
        let finalCount = null;

        // finding the total samplepoints
        for (const spice in this.spices)
        {
            if(spice.isTop)
            {
                percentageMissing = 100 - spice.endPercentage
            }

            // this spice' total Percentage
            const spicePercentageOfBottle = spice.startPercentage - spice.endPercentage * 0.01
            spice.count += Math.floor(density * (percentageMissing * spicePercentageOfBottle))
            finalCount += spice.count
        }

        // sample points
        this.#samplePoints(finalCount)

        // create each spice
        for(const spice in this.spices)
        {
            this.mixedSpice += this.create(spice)
        }

        return this.mixedSpice; 
 
    }

    create(spice) {

        if (spice.params.type === 'sprite') {
            return this.#createPoints(spice);
        } 
        
        else if (spice.params.type === 'instance') {
            return this.#createInstancedMesh(spice);
        }
    }

    // Points with sprite textures
    #createPoints(spice) {
        let points = null; 
        const pointsGeometry = new THREE.BufferGeometry();

        // Position
        const adjustedPositions = spice.positions.subarray(0, positions.length * 3);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));

        // // Rotation
        // const adjustedRotations = rotations.subarray(0, positions.length * 3);
        // pointsGeometry.setAttribute('aRotation', new THREE.BufferAttribute(adjustedRotations, 3));

        // // Scale
        // const adjustedScales = scales.subarray(0, positions.length);
        // pointsGeometry.setAttribute('aScale', new THREE.BufferAttribute(adjustedScales, 1));

        return points = new THREE.Points(pointsGeometry, spice.params.material);
    }

    // Instances
    #createInstancedMesh(spice) {
        
        const instancedMesh = new InstancedMesh2(spice.params.mesh.geometry, spice.params.mesh.material, { capacity: sampledCount });

        instancedMesh.addInstances(spice.positions.length, (obj, index) => {
            const i3 = index * 3;

            // Position
            obj.position.set(spice.positions[i3], spice.positions[i3 + 1], spice.positions[i3 + 2]);

            // Randomize scale
            obj.scale.set(
                THREE.MathUtils.lerp(spice.params.size, spice.params.size * Math.random(), spice.params.sizeRandomize), 
                THREE.MathUtils.lerp(spice.params.size, spice.params.size * Math.random(), spice.params.sizeRandomize), 
                THREE.MathUtils.lerp(spice.params.size, spice.params.size * Math.random(), spice.params.sizeRandomize));

            // Setting rotation
            const rotation = new THREE.Vector3(
                THREE.MathUtils.lerp(spice.params.rotation.x, spice.params.rotation.x * Math.random(), spice.params.rotationRandomize),
                THREE.MathUtils.lerp(spice.params.rotation.y, spice.params.rotation.y * Math.random(), spice.params.rotationRandomize),
                THREE.MathUtils.lerp(spice.params.rotation.z, spice.params.rotation.z * Math.random(), spice.params.rotationRandomize));
            const euler = new THREE.Euler().setFromVector3(rotation);
            obj.quaternion.setFromEuler(euler);

            // push inwards depending on size
            obj.position.x *= 1 - spice.params.size * 0.6;  // ensure positioned inside
            obj.position.z *= 1 - spice.params.size * 0.6; // ensure positioned inside
            obj.position.y *= 1 - spice.params.size * 0.25; // ensure positioned inside

            // Update matrix
            obj.updateMatrix();
        });
    
        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh;
    }

    // Surface Sampler
    #samplePoints(count) {

        // For consistent spatial density regardless of fill amount
        const count = count
        const sampler = new MeshSurfaceSampler(jar).build();
        const positions = new Float32Array(count * 3);
        const position = new THREE.Vector3();
        const normals = new Float32Array(count * 3);
        const normal = new THREE.Vector3();

        let sampledCount = 0;
        for (let i = 0; i < count; i++) {
            sampler.sample(position, normal);

            // Check if the point is inside or outside using normals
            const dot = normal.dot(position.clone().normalize());
            if (dot > 0) {
                continue; // Skip points that are outside
            }

            position.x *= 1 - 0.1;  // ensure positioned inside
            position.z *= 1 - 0.1; // ensure positioned inside
            position.y *= 1 - 0.05; // ensure positioned inside
          
            // Set
            positions.set([position.x, position.y, position.z], sampledCount * 3);
            sampledCount++;
        }

        for (const spice in this.spices)
        {
            spice.positions = positions[spice.count]
        }
    }
}