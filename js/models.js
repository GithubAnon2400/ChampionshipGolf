class ModelManager {
    constructor() {
        if (!THREE.TextureLoader) {
            throw new Error('THREE.TextureLoader is not available');
        }
        this.loader = new THREE.TextureLoader();
        this.models = {
            ace: null,
            birdie: null
        };
    }

    loadModels(callback) {
        console.log('Loading textures for models...');
        const promises = [];

        // Load Ace with fallback color (no texture dependency)
        promises.push(new Promise((resolve) => {
            const geometry = new THREE.PlaneGeometry(0.5, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue fallback
            this.models.ace = new THREE.Mesh(geometry, material);
            this.models.ace.castShadow = true;
            resolve();
        }));

        // Load Birdie with texture from assets
        promises.push(new Promise((resolve) => {
            this.loader.load('assets/birdie.png', (texture) => {
                const geometry = new THREE.PlaneGeometry(0.5, 1);
                const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
                this.models.birdie = new THREE.Mesh(geometry, material);
                this.models.birdie.castShadow = true;
                resolve();
            }, undefined, (error) => {
                console.warn('Birdie texture failed to load, using fallback:', error);
                const geometry = new THREE.PlaneGeometry(0.5, 1);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green fallback
                this.models.birdie = new THREE.Mesh(geometry, material);
                this.models.birdie.castShadow = true;
                resolve(); // Always resolve to prevent Promise.all rejection
            });
        }));

        Promise.all(promises)
            .then(() => {
                console.log('Models loaded:', this.models);
                if (callback) callback();
            })
            .catch(error => {
                console.error('Unexpected error loading models:', error);
                if (callback) callback(); // Proceed with fallbacks
            });
    }

    getModel(characterName) {
        return this.models[characterName] ? this.models[characterName].clone() : null;
    }
}