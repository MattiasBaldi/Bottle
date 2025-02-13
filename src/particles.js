import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';


export default class Particles
{
    constructor(containerGeometry)
    {
        this.containerGeometry = containerGeometry; 
        this.material = null; 
        this.geometry = null;
        this.points = null;  
        this.sampler =  new MeshSurfaceSampler( this.containerGeometry ).setWeightAttribute( 'color' ).build();


        this.addGeometry()
        this.addMaterial()
        this.generatePoints()
        return this.points
    }

    addGeometry()
    {
       this.geometry = new THREE.BufferGeometry();
       
       const count = 2000; 
       const positions = new Float32Array(count * 3);     // x, y, z
       const colors = new Float32Array(count * 3);        // RGB
       const scales = new Float32Array(count * 3);        // x, y, z
       const randomness = new Float32Array(count * 3);    // x, y, z
       
        for (let i = 0; i < count; i++)
        {
            const i3 = i * 3;
            
            const position = new THREE.Vector3();
            this.sampler.sample(position);

            positions[i3]       = position.x; 
            positions[i3 + 1]   = position.y;
            positions[i3 + 2]   = position.z;

            scales[i3]       = Math.random(); 
            scales[i3 + 1]   = Math.random(); 
            scales[i3 + 2]   = Math.random(); 
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 3)); 

        // const matrix = new THREE.Matrix4();
        // matrix.makeTranslation( position.x, position.y, position.z );

        // const mesh = new THREE.InstancedMesh( this.containerGeometry, this.material, count );
        // mesh.setMatrixAt( i, matrix );

    }

    addMaterial()
    {
        this.material = new THREE.PointsMaterial({
            color: 'red', 
            size: 0.05
        })
    }

    generatePoints()
    {

        this.points = new THREE.Points(this.geometry, this.material);
        return this.points
    }
}