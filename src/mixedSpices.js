import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh'

export default class mixedSpices {
    constructor(jar, spices) 
    {
        // Parameters
        this.jar = jar 
        this.spices = spices
        this.totalCount = 0;  // Initialize to 0, not null
        this.points = new THREE.Group();
    
        // call init
        this.findSamples()
        this.#samplePoints()
    }

    mix()
    {
        // create one for each using the mixed ones
        for(const key in this.spices) {
            const spice = this.spices[key];
            const spiceObject = this.create(spice);
            if (spiceObject) {
                this.points.add(spiceObject);
            }
        }
    
        return this.points;
    }

    create(spice) {
        if (spice.params.type === 'sprite') {
            return this.#createPoints(spice);
        } 
        else if (spice.params.type === 'instance') {
            return this.#createInstancedMesh(spice);
        }
        return null;
    }

    // Points with sprite textures
    #createPoints(spice) {
        const pointsGeometry = new THREE.BufferGeometry();

        // Position - fix the subarray calculation
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(spice.positions, 3));

        return new THREE.Points(pointsGeometry, spice.params.material);
    }

    // Instances
    #createInstancedMesh(spice) {
        // Divide by 3 because positions is a flat array of x,y,z components
        const count = spice.positions.length / 3;
        const instancedMesh = new InstancedMesh2(spice.params.mesh.geometry, spice.params.mesh.material, count);

        instancedMesh.addInstances(count, (obj, index) => {
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

    findSamples()
    {
        // Initialize with a default value
        let percentageMissing = 0;
        
        // finding the total samplepoints
        for (const key in this.spices) {
            const spice = this.spices[key]; // Get the actual object
            
            if(spice.isTop) {
                percentageMissing = 100 - spice.endPercentage;
            }
            
            // Initialize spice.count if it doesn't exist
            if (spice.count === undefined) {
                spice.count = 0;
            }
            
            // Calculate this spice's total percentage
            const spicePercentageOfBottle = ((spice.endPercentage - spice.startPercentage)/100) * 100;
            
            // Calculate and add the particles
            const additionalCount = Math.floor(spice.params.density * (percentageMissing * spicePercentageOfBottle/100));
            spice.count += additionalCount;
            
            this.totalCount += spice.count;
        }
    }

    // Surface Sampler
    #samplePoints() {
        // For consistent spatial density regardless of fill amount
        const sampler = new MeshSurfaceSampler(this.jar).build();
        const positions = new Float32Array(this.totalCount * 3);
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();

        // Ensure we get exactly the number of points we need
        let sampledCount = 0;
        let attemptCount = 0;
        const maxAttempts = this.totalCount * 10; // Avoid infinite loop

        while (sampledCount < this.totalCount && attemptCount < maxAttempts) {
            sampler.sample(position, normal);
            attemptCount++;

            // Check if the point is inside or outside using normals
            const dot = normal.dot(position.clone().normalize());
            if (dot > 0) {
                continue; // Skip points that are outside
            }

            position.x *= 0.9;  // ensure positioned inside (1 - 0.1)
            position.z *= 0.9; // ensure positioned inside
            // position.y *= 0.95; // ensure positioned inside
          
            // Set
            positions.set([position.x, position.y, position.z], sampledCount * 3);
            sampledCount++;
        }
        
        if (sampledCount < this.totalCount) {
            console.warn(`Only found ${sampledCount} valid points out of ${this.totalCount} requested`);
        }

        // Distribute particles from bottom to top (forward order)
        let startIndex = 0;
        for (const key in this.spices) {
            const spice = this.spices[key];
            const endIndex = startIndex + spice.count;
            
            // Create a slice of the positions array for this spice
            spice.positions = new Float32Array(spice.count * 3);
            
            // Copy only the needed positions for this spice
            for (let i = 0; i < spice.count; i++) {
                const sourceIndex = (startIndex + i) * 3;
                const targetIndex = i * 3;
                
                // Only copy if we have enough sampled points
                if (sourceIndex + 2 < sampledCount * 3) {
                    spice.positions[targetIndex] = positions[sourceIndex];
                    spice.positions[targetIndex + 1] = positions[sourceIndex + 1];
                    spice.positions[targetIndex + 2] = positions[sourceIndex + 2];
                }
            }
            
            startIndex = endIndex;
        }
    }
}