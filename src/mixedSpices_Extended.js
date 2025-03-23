import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh'
import Spice from './spice.js'

export default class mixedSpices extends Spice {
    constructor(jar, spices) 
    {
        // Parameters
        this.jar = jar 
        this.spices = spices
        this.points = null;
        this.mixedSpice = new THREE.Group();
    
    }

    mix()
    {
        // create one for each using the mixed ones
        for(const key in this.spices) {
            const spice = this.spices[key];
            const spiceObject = this.create(this.jar, 0, 100, false);
            if (spiceObject) {
                this.mixedSpice.add(spiceObject);
            }
        }
    
        return this.mixedSpice;
    }

} 