import * as THREE from 'three'
import galaxyVertexShader from './shaders/particles/vertex.glsl'
import galaxyFragmentShader from './shaders/particles/fragment.glsl'

export default class Particles {
    constructor()
    {
        this.geometry = null; 
        this.material = null; 
        this.points = null; 

        this.generatePoints()
        return this.points
    }


    addGeometry()
    {
    this.geometry = new THREE.BufferGeometry()

    const parameters = {}
    parameters.count = 200000
    parameters.size = 0.005
    parameters.radius = 5
    parameters.branches = 3
    parameters.spin = 1
    parameters.randomness = 0.2
    parameters.randomnessPower = 3
    parameters.insideColor = '#ff6030'
    parameters.outsideColor = '#1b3984'

    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count * 1)
    const randomness = new Float32Array(parameters.count * 3)

    const insideColor = new THREE.Color(parameters.insideColor)
    const outsideColor = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++)
    {
        const i3 = i * 3

        // Position
        const radius = Math.random() * parameters.radius

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius  
  
        positions[i3    ] = 0
        positions[i3 + 1] = 0
        positions[i3 + 2] = 0

        randomness[i3   ] = randomX
        randomness[i3 + 1] = randomY
        randomness[i3 + 2] = randomZ

        // Color
        const mixedColor = insideColor.clone()
        mixedColor.lerp(outsideColor, radius / parameters.radius)

        colors[i3    ] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b

        // Scale
        scales[i] = Math.random(); 
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3)); 
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); 
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    }

    addMaterial()
    {
    this.material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    
        uniforms: 
        {
            uTime: {value: 0.0}, 
            // uSize: { value: 30.0 * renderer.getPixelRatio() }
        },

        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader
    })

    }

    generatePoints()
    {
        this.addGeometry()
        this.addMaterial()
        this.points = new THREE.Points(this.geometry, this.material)
    }
}