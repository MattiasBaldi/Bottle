import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import TopSurface from "./utils/topsurface";

export default class Spice {
    constructor(container, params) {
        this.container = container;
        this.params = params;
        this.points = null;
        this.fill = null;
        this.topsurface = null;

        this.start = null;
        this.end = null;
    }

    create(start, end) {
        const { positions, colors, sampledCount } = this.#samplePoints(start, end, this.params.count, this.params.type === 'points');
        if (this.params.type === 'points') {
            return this.#createPoints(positions, colors, sampledCount);
        } else if (this.params.type === 'mesh') {
            return this.#createMesh(positions, sampledCount);
        }
    }

    #createPoints(positions, colors, sampledCount) {
        const pointsGeometry = new THREE.BufferGeometry();
        const adjustedPositions = positions.subarray(0, sampledCount * 3);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(adjustedPositions, 3));
        pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return this.points = new THREE.Points(pointsGeometry, this.params.material);
    }

    #createMesh(positions, sampledCount) {
        const instancedMesh = new THREE.InstancedMesh(this.params.mesh.geometry, this.params.mesh.material, sampledCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < sampledCount; i++) {
            const i3 = i * 3;
            dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        return this.points = instancedMesh;
    }

    #samplePoints(start, end, count, includeColors) {
        this.disposePoints();

        const jarDimensions = this.#computeHeight();
        this.startY = jarDimensions.minY + jarDimensions.height * start * 0.01;
        this.endY = jarDimensions.minY + jarDimensions.height * end * 0.01;

        const sampler = new MeshSurfaceSampler(this.container).build();
        const positions = new Float32Array(count * 3);
        const colors = includeColors ? new Float32Array(count * 3) : null;
        const color = new THREE.Vector3();
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();

        let sampledCount = 0;
        for (let i = 0; i < count; i++) {
            sampler.sample(position, normal);

            if (position.y >= this.startY && position.y <= this.endY) {
                position.multiplyScalar(0.97);
                positions.set([position.x, position.y, position.z], sampledCount * 3);

                if (includeColors) {
                    color.set(Math.random(), Math.random(), Math.random());
                    colors.set([color.r, color.g, color.b], sampledCount * 3);
                }

                sampledCount++;
            }
        }

        return { positions, colors, sampledCount };
    }

    #computeHeight() {
        this.container.geometry.computeBoundingBox();

        const jarDimensions = {};
        jarDimensions.minY = this.container.geometry.boundingBox.min.y;
        jarDimensions.maxY = this.container.geometry.boundingBox.max.y;
        jarDimensions.height = jarDimensions.maxY - jarDimensions.minY;

        return jarDimensions;
    }

    disposePoints() {
        // Remove existing points if they exist
        if (this.points) {
            this.points.geometry.dispose();
            this.points.material.dispose();
            this.points = null;
        }
    }
}