import * as THREE from 'three'

export default class TopSurface
{
    constructor(container, position)
    {
        this.container = container;
        this.position = position; 

        this.yGroups = []; 
        this.vertices = [];
        this.geometry = null; 
        this.material = null; 
        this.mesh = null; 
     
        this.groupVerticesByYCoordinates()
        this.storeVertices();
        this.createGeometry();
        this.createMesh();

        return this.mesh
    }

    groupVerticesByYCoordinates()
    {  

            // Group vertices into groups based on their y-coordinate
            for (let i = 0; i < this.container.geometry.attributes.position.count; i++) {
                const vertex = new THREE.Vector3().fromBufferAttribute(this.container.geometry.attributes.position, i);
        
                const y = vertex.y.toFixed(2); // Use a fixed precision to avoid floating-point issues
                if (!this.yGroups[y]) {
                this.yGroups[y] = [];
                }
                this.yGroups[y].push(vertex);
            }
    }

    storeVertices()
    {
        // Find closest vertices
        let closestYGroupIndex = null;
        let closestDistance = Infinity;

        // Store the yGroup index that is closest to the endY
        for (let y in this.yGroups) {
            const distance = Math.abs(this.position - y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestYGroupIndex = y;
            }
        }

        // Add vertices of the closest group to the topSurface vertices array
        this.yGroups[closestYGroupIndex].forEach(vertex => {
            vertex.y = this.position; // Update the y-coordinate to match the sides
            this.vertices.push(vertex)
        });

        // Order vertices counterclockwise
        this.vertices.sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
    }

    createGeometry()
    {


        // Create a shape and add vertices
        const shape = new THREE.Shape();
        shape.moveTo(this.vertices[0].z, this.vertices[0].x);
        for (let i = 1; i < this.vertices.length; i++) {
            shape.lineTo(this.vertices[i].z, this.vertices[i].x);
        }
        shape.lineTo(this.vertices[0].z, this.vertices[0].x); // Close the shape

        // Add geometry
        const topSurfaceYPosition = this.position - 0.001; // Added small offset so it never extends the position
        this.geometry = new THREE.ShapeGeometry(shape);
        this.geometry.rotateX(Math.PI / -2); // Rotate the geometry 90 degrees around the X axis
        this.geometry.translate(0, topSurfaceYPosition, 0); 
    }

    createMesh()
    {
        this.material = new THREE.MeshBasicMaterial({ color: 'green', side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    dispose()
    {
        if(this.geometry)
            this.geometry.dispose()

        if(this.material)
            this.material.dispose()

        if(this.mesh)
            this.geometry.dispose()

        this.geometry = null;
        this.vertices = [];
    }

    visualizeGeometry(scene)
    {
    // Create mesh & points for visualization
    const pointGeometry = new THREE.BufferGeometry().setFromPoints(this.vertices);
    const pointMaterial = new THREE.PointsMaterial({ color: 'green', size: 0.05 });
    const point = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(point);

    const material = new THREE.MeshBasicMaterial({ color: 'green', side: THREE.DoubleSide });
    const topSurface = new THREE.Mesh(this.geometry, material);
    topSurface.material.wireframe = true;
    scene.add(topSurface);
    }

}