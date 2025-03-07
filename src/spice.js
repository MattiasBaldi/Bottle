import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import instanceSampler from './utils/sampler/instanceSampler.js'
import pointsSampler from './utils/sampler/pointsSampler.js'
import { InstancedMesh2 } from '@three.ez/instanced-mesh'

export default class Spice {
    constructor(params) 
    {
        this.points = null; 
        this.params = params;
        this.startY = null; 
        this.endY = null;
    }

    create(mesh, start, end) {
        const { normals, rotations, positions, colors, sampledCount } = this.#samplePoints(mesh, start, end, this.params.count, this.params.type === 'points');
        if (this.params.type === 'points') {
            return this.#createPoints(rotations, positions, colors, sampledCount);
        } else if (this.params.type === 'mesh') {
            return this.#createInstancedMesh(normals, positions, sampledCount);
        }
    }

    createTop(mesh, start, end) {
        let topPoints = null;
        const count = this.params.count

        const { normals, rotations, positions, colors, sampledCount } = this.#samplePoints(mesh, start, end, count * 0.1, this.params.type === 'points');
        if (this.params.type === 'points') {
            topPoints = this.#createPoints(positions, colors, sampledCount);
            return topPoints; 
        } else if (this.params.type === 'mesh') {
            topPoints = this.#createInstancedMesh(normals, rotations, positions, sampledCount);
            return topPoints; 
        }
    }

    // Points with sprite textures
    #createPoints(positions, colors, sampledCount) {
        let points = null; 
        const pointsGeometry = new THREE.BufferGeometry();
        const adjustedPositions = positions.subarray(0, sampledCount * 3);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
        pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return points = new THREE.Points(pointsGeometry, this.params.material);
    }

    // Instances
    #createInstancedMesh(normals, positions, sampledCount) {
        
        const instancedMesh = new InstancedMesh2(this.params.mesh.geometry, this.params.mesh.material, { capacity: sampledCount });

        /// Compute boundingBox
        instancedMesh.computeBVH({ margin: 0 });
        
        instancedMesh.addInstances(sampledCount, (obj, index) => {
            const i3 = index * 3;
    
            // Position
            obj.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
    
            // Setting normals
            const normal = new THREE.Vector3(normals[i3], normals[i3 + 1], normals[i3 + 2]);
    
            // Setting rotation towards 0,0,0 depending on the normal at given position
            const euler = new THREE.Euler().setFromVector3(normal);
            obj.quaternion.setFromEuler(euler);

            obj.scale.set(this.params.size, this.params.size, this.params.size)
    
            // Update matrix
            obj.updateMatrix();
        });
    
        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh;
    }

    // Surface Sampler
    #samplePoints(mesh, startPercentage, endPercentage, count, includeColors) {

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

            if (position.y >= this.startY && position.y <= this.endY) {
            position.multiplyScalar(0.96);
            positions.set([position.x, position.y, position.z], sampledCount * 3);

            // set normal at specified point
            normals.set([normal.x, normal.y, normal.z], sampledCount * 3);

            // Include color at each point
            if (includeColors) {
                color.set(Math.random(), Math.random(), Math.random());
                colors.set([color.r, color.g, color.b], sampledCount * 3);
            }

            // Fill rotation array
            rotations.set([rotation.x, rotation.y, rotation.z], sampledCount * 3);

            sampledCount++;
            }
        }

        return { normals, rotations, positions, colors, sampledCount };
    }
}