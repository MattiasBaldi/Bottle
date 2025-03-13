import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import instanceSampler from './utils/sampler/instanceSampler.js'
import pointsSampler from './utils/sampler/pointsSampler.js'
import { InstancedMesh2 } from '@three.ez/instanced-mesh'

export default class Spice {
    constructor(params) 
    {
        // Parameters
        this.params = params;
        this.type = this.params.type; // instances or points
        this.points = null; 

        // Starting position
        this.startY = null; 
        this.endY = null;
    }

    create(mesh, start, end) {
        const { rotations, normals, positions, colors, sampledCount } = this.#samplePoints(mesh, start, end, this.params.count, this.params.type === 'points');
        if (this.params.type === 'points') {
            return this.#createPoints(positions, colors, sampledCount);
        } else if (this.params.type === 'mesh') {
            return this.#createInstancedMesh(rotations, normals, positions, sampledCount);
        }
    }

    // Points with sprite textures
    #createPoints(positions, colors, sampledCount) {
        let points = null; 
        const pointsGeometry = new THREE.BufferGeometry();
        const adjustedPositions = positions.subarray(0, sampledCount * 3);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
        pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.params.material.size = this.params.size

        return points = new THREE.Points(pointsGeometry, this.params.material);
    }

    // Instances
    #createInstancedMesh(rotations, normals, positions, sampledCount) {
        
        const instancedMesh = new InstancedMesh2(this.params.mesh.geometry, this.params.mesh.material, { capacity: sampledCount });

        /// Compute boundingBox
        instancedMesh.computeBVH({ margin: 0 });
        
        instancedMesh.addInstances(sampledCount, (obj, index) => {
            const i3 = index * 3;
    
            // Position
            obj.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);

            // Setting rotation
            const rotation = new THREE.Vector3(rotations[i3], rotations[i3 + 1], rotations[i3 + 2]);
            const euler = new THREE.Euler().setFromVector3(rotation);
            obj.quaternion.setFromEuler(euler);
    
            // // Setting rotation from normals
            // const normal = new THREE.Vector3(normals[i3], normals[i3 + 1], normals[i3 + 2]);
            // const euler = new THREE.Euler().setFromVector3(normal);
            // obj.quaternion.setFromEuler(euler);

            obj.scale.set(this.params.size, this.params.size, this.params.size)
    
            // Update matrix
            obj.updateMatrix();
        });
    
        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh;
    }

    // Surface Sampler
    #samplePoints(mesh, startPercentage, endPercentage, count, includeColors, top = true) {

        if(mesh.geometry.boundingBox) {
        const height = mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y;
        this.startY = mesh.geometry.boundingBox.min.y + height * startPercentage * 0.01;
        this.endY = mesh.geometry.boundingBox.min.y + height * endPercentage * 0.01;
        }

        const sampler = new MeshSurfaceSampler(mesh).build();
        const positions = new Float32Array(count * 3);
        const rotations = new Float32Array(count * 3);
        const normals = new Float32Array(count * 3);
        const colors = includeColors ? new Float32Array(count * 3) : null;
        const color = new THREE.Vector3();
        const rotation = new THREE.Vector3();
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();

        let sampledCount = 0;
        for (let i = 0; i < count; i++) {
            sampler.sample(position, normal, color);

            /* 
            * Y Positioning
            */
            position.y = THREE.MathUtils.clamp(position.y, this.startY, this.endY);
           
            // Sample top if true
            if(top)
            {
            if (position.y === this.endY) {
                const factor = Math.random() * Math.random(); // Adjust the factor range for different density
                position.x = THREE.MathUtils.lerp(position.x, 0, factor);
                position.z = THREE.MathUtils.lerp(position.z, 0, factor);
                position.y += Math.random() * 0.1 - 0.05; // add offset
            }
            } 

            // skip bottom
            if (position.y === this.startY) {
                continue; // Skip points at the bottom
            }

            /* 
            * Fake collision detection
            */

            // Randomize rotation
            rotations.set([Math.random(), Math.random(), Math.random()], sampledCount * 3);

            // 'Collision' with bottle depending on size
            position.x *= (1 - (this.params.size * 0.4)); // ensure positioned inside
            position.z *= (1 - (this.params.size * 0.4)); // ensure positioned inside
            position.y *= (1 - (this.params.size * 0.25)); // ensure positioned inside

            // 'Collision' with each other and 'gravity' meaning stack on one another, bottom up.

            
            // Set
            positions.set([position.x, position.y, position.z], sampledCount * 3);
            normals.set([normal.x, normal.y, normal.z], sampledCount * 3);
            rotations.set([rotation.x, rotation.y, rotation.z], sampledCount * 3);
            sampledCount++;

        }

        return { normals, rotations, positions, colors, sampledCount };
    }

}