import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh'

export default class Spice {
    constructor(jar, params) 
    {
        // Parameters
        this.jar = jar
        this.params = params;
        this.points = null; 

        // Starting position
        this.count = null; 
        this.startY = null; 
        this.endY = null;
    }

    create(start, end, top) {
        const { scales, positions, rotations, colors, sampledCount } = this.#samplePoints(start, end, this.params.density, top);
        if (this.params.type === 'sprite') {
            return this.#createPoints(scales, positions, rotations, colors, sampledCount);
        } else if (this.params.type === 'instance') {
            return this.#createInstancedMesh(scales, positions, rotations, sampledCount);
        }
    }

    // Points with sprite textures
    #createPoints(scales, positions, rotations, colors, sampledCount) {
        let points = null; 
        const pointsGeometry = new THREE.BufferGeometry();

        // // Color
        // const adjustedColors = colors.subarray(0, sampledCount);
        // pointsGeometry.setAttribute('color', new THREE.BufferAttribute(adjustedColors, 1));

        // Position
        const adjustedPositions = positions.subarray(0, sampledCount * 3);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));

        // // Rotation
        // const adjustedRotations = rotations.subarray(0, sampledCount * 3);
        // pointsGeometry.setAttribute('aRotation', new THREE.BufferAttribute(adjustedRotations, 3));

        // // Scale
        // const adjustedScales = scales.subarray(0, sampledCount);
        // pointsGeometry.setAttribute('aScale', new THREE.BufferAttribute(adjustedScales, 1));

        return points = new THREE.Points(pointsGeometry, this.params.material);

    }

    // Instances
    #createInstancedMesh(scales, positions, rotations, sampledCount) {
    
        const instancedMesh = new InstancedMesh2(this.params.mesh.geometry, this.params.mesh.material, { capacity: sampledCount });
        
        instancedMesh.addInstances(sampledCount, (obj, index) => {
            const i3 = index * 3;
    
            // Position
            obj.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);

            // Setting rotation
            const rotation = new THREE.Vector3(rotations[i3], rotations[i3 + 1], rotations[i3 + 2]);
            const euler = new THREE.Euler().setFromVector3(rotation);
            obj.quaternion.setFromEuler(euler);

            // Set rotation from normals
            // const normal = new THREE.Vector3(normals[i3], normals[i3 + 1], normals[i3 + 2]);
            // const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            // obj.quaternion.copy(quaternion);

            obj.scale.set(scales[index], scales[index], scales[index])    

            // Update matrix
            obj.updateMatrix();
        });
    
        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh;
    }

    // Surface Sampler
    #samplePoints(startPercentage, endPercentage, density, top = true) {


        if(this.jar.geometry.boundingBox) {
        const height = this.jar.geometry.boundingBox.max.y - this.jar.geometry.boundingBox.min.y;
        this.startY = this.jar.geometry.boundingBox.min.y + height * startPercentage * 0.01;
        this.endY = this.jar.geometry.boundingBox.min.y + height * endPercentage * 0.01;
        }

        // * endPercentage
        // For consistent spatial density regardless of fill amount
        const count = Math.floor(density * (endPercentage - startPercentage))
        const sampler = new MeshSurfaceSampler(this.jar).build();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const rotations = new Float32Array(count * 3);
        const normals = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const rotation = new THREE.Vector3(); 
        const color = new THREE.Vector3(); 
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();

        let sampledCount = 0;
        for (let i = 0; i < count; i++) {
            sampler.sample(position, normal);

            /* 
            * Y Positioning
            */
            position.y = THREE.MathUtils.clamp(position.y, this.startY, this.endY);

            // Sample top
            if(top)
            {
            if (position.y === this.endY) {
                const offSet = 0.15
                const factor = Math.random() * Math.random(); // Adjust the factor range for different density
                position.x = THREE.MathUtils.lerp(position.x, 0, factor);
                position.z = THREE.MathUtils.lerp(position.z, 0, factor);
                position.y += Math.random() * offSet - (offSet / 2); // add offset
            }
            }

            // Skip local bottom & maxTop + minTop
            if (position.y === this.startY || position.y <= this.jar.geometry.boundingBox.min.y || position.y >= this.jar.geometry.boundingBox.max.y) {
                continue;
            }

            // Randomize scale
            scales[sampledCount] = THREE.MathUtils.lerp(this.params.size, this.params.size * Math.random(), this.params.sizeRandomize)

            // Randomize rotation
            rotation.set(
                THREE.MathUtils.lerp(this.params.rotation.x, this.params.rotation.x * Math.random(), this.params.rotationRandomize),
                THREE.MathUtils.lerp(this.params.rotation.y, this.params.rotation.y * Math.random(), this.params.rotationRandomize),
                THREE.MathUtils.lerp(this.params.rotation.z, this.params.rotation.z * Math.random(), this.params.rotationRandomize)
            );
            rotations.set([rotation.x, rotation.y, rotation.z], sampledCount * 3);

            /* 
            * Fake collision detection
            */

            // 'Collision' with bottle

            // Check if the point is inside or outside using normals
            const dot = normal.dot(position.clone().normalize());
            if (dot > 0) {
                continue; // Skip points that are outside
            }

              // push inwards depending on size
            if(this.params.type === 'instance')
            {
                position.x *= 1 - this.params.size * 0.6;  // ensure positioned inside
                position.z *= 1 - this.params.size * 0.6; // ensure positioned inside
                position.y *= 1 - this.params.size * 0.25; // ensure positioned inside
            }
            else{
                position.x *= 1 - this.params.size * 0.1;  // ensure positioned inside
                position.z *= 1 - this.params.size * 0.1; // ensure positioned inside
                position.y *= 1 - this.params.size * 0.05; // ensure positioned inside
            }
          
        
            // add self collision on instance types
        //     if(this.type === 'instance')
        //     {
        //     // Self collision
        //     let collision = false;
        //     for (let j = 0; j < sampledCount; j++) {
        //         const j3 = j * 3;
        //         const existingPosition = new THREE.Vector3(positions[j3], positions[j3 + 1], positions[j3 + 2]);
        //         const distance = position.distanceTo(existingPosition);

        //     if (distance < this.params.size * this.params.selfCollisionDistance) {
        //         collision = true;
        //         break;
        //     }
        //     }

        //     if (collision) {
        //         continue; // Skip this point if it collides with any previously sampled point
        //     }
        //  }


  
            // Set
            colors.set([color.x, color.y, color.z], sampledCount * 3);
            positions.set([position.x, position.y, position.z], sampledCount * 3);
            normals.set([normal.x, normal.y, normal.z], sampledCount * 3);
            sampledCount++;
        }

        return { scales, positions, rotations, normals, colors, sampledCount };
    }

}