import * as THREE from 'three'

export default class Particles
{
    constructor(containerGeometry)
    {
        this.containerGeometry = containerGeometry; 
        this.material = null; 
        this.geometry = null;
        this.points = null;  

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
            
            positions[i3]       = this.containerGeometry.attributes.position.getX(i); 
            positions[i3 + 1]   = this.containerGeometry.attributes.position.getY(i);
            positions[i3 + 2]   = this.containerGeometry.attributes.position.getZ(i);

            scales[i3]       = Math.random(); 
            scales[i3 + 1]   = Math.random(); 
            scales[i3 + 2]   = Math.random(); 
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 3)); 
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