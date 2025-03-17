class Course {
    constructor(scene, physics) {
        console.log('Initializing Course...');
        this.scene = scene;
        this.physics = physics;
        this.holes = [];
        this.currentHoleIndex = 0;
        this.terrainMesh = null;
        this.holePositions = [];
    }

    generateCourse(seed) {
        console.log('Generating course with seed:', seed);
        this.holes = [];
        const holeCount = 1; // Single hole
        let totalLength = 0;

        for (let i = 0; i < holeCount; i++) {
            const par = 4; // Default to par 4 for variety
            const length = par * 100 + (Math.random() * 100 - 50);
            totalLength += length;
            const greenSize = 20; // Fixed for par 4
            this.holes.push({
                par: par,
                length: length,
                greenSize: greenSize,
                holePosition: new THREE.Vector3(0, 0, -totalLength)
            });
        }

        const heightData = this.generateHeightData(32, 32, seed);
        const terrainSize = { x: 100, z: totalLength / 2 };
        const position = { x: -terrainSize.x / 2, y: 0, z: -terrainSize.z / 2 };

        if (this.physics) {
            this.physics.createTerrain(heightData, terrainSize, position);
        }

        if (this.terrainMesh) {
            this.scene.remove(this.terrainMesh);
        }

        const geometry = new THREE.PlaneGeometry(terrainSize.x, terrainSize.z * 2, 31, 31);
        const material = new THREE.MeshStandardMaterial({ color: 0x00cc00, wireframe: false }); // Brighter green
        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.position.set(0, 0, 0);
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);

        // Add hazards (trees and water)
        this.addHazards(terrainSize, position);

        this.holePositions = this.holes.map(hole => hole.holePosition);
        console.log('Course generated with holes:', this.holes);
    }

    generateHeightData(width, height, seed) {
        const data = [];
        for (let x = 0; x < width; x++) {
            data[x] = [];
            for (let z = 0; z < height; z++) {
                data[x][z] = (Math.sin(x * 0.1 + seed) + Math.cos(z * 0.1 + seed)) * 0.5;
            }
        }
        return data;
    }

    addHazards(terrainSize, position) {
        // Add trees (simple cones)
        for (let i = 0; i < 3; i++) {
            const treeGeometry = new THREE.ConeGeometry(1, 3, 8);
            const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(
                position.x + (Math.random() - 0.5) * terrainSize.x * 0.8,
                1.5,
                position.z + (Math.random() - 0.5) * terrainSize.z * 0.8
            );
            tree.castShadow = true;
            this.scene.add(tree);
        }

        // Add water hazard
        const waterGeometry = new THREE.PlaneGeometry(10, 10);
        const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x1E90FF, transparent: true, opacity: 0.8 });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.set(
            position.x + (Math.random() - 0.5) * terrainSize.x * 0.5,
            0.01,
            position.z + (Math.random() - 0.5) * terrainSize.z * 0.5
        );
        this.scene.add(water);
    }

    loadHole(index) {
        console.log('Loading hole index:', index);
        if (index < 0 || index >= this.holes.length) {
            console.warn('Invalid hole index, returning default:', index);
            return { par: 4, length: 400, greenSize: 20, holePosition: new THREE.Vector3(0, 0, -400) };
        }
        this.currentHoleIndex = index;
        const hole = this.holes[index];
        console.log('Hole loaded:', hole);
        return hole;
    }

    getTeePosition() {
        const hole = this.holes[this.currentHoleIndex];
        if (!hole) {
            console.warn('No current hole, returning default tee position');
            return { x: 0, y: 0, z: 0 };
        }
        return { x: 0, y: 0, z: -hole.length / 2 };
    }

    getHolePosition() {
        const hole = this.holes[this.currentHoleIndex];
        if (!hole) {
            console.warn('No current hole, returning default hole position');
            return new THREE.Vector3(0, 0, -400);
        }
        return hole.holePosition;
    }

    getCurrentHole() {
        return this.holes[this.currentHoleIndex] || { par: 4, length: 400, greenSize: 20, holePosition: new THREE.Vector3(0, 0, -400) };
    }
}

window.Course = Course;