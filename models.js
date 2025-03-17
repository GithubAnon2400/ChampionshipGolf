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

        promises.push(new Promise((resolve) => {
            // Placeholder for Ace with blue texture
            this.loader.load('assets/ace_texture.jpg', (texture) => {
                const geometry = new THREE.PlaneGeometry(0.5, 1);
                const material = new THREE.MeshStandardMaterial({ map: texture, color: 0x0000ff });
                this.models.ace = new THREE.Mesh(geometry, material);
                this.models.ace.castShadow = true;
                resolve();
            }, undefined, () => {
                console.warn('Ace texture failed to load, using fallback');
                const geometry = new THREE.PlaneGeometry(0.5, 1);
                const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
                this.models.ace = new THREE.Mesh(geometry, material);
                this.models.ace.castShadow = true;
                resolve();
            });
        }));

        promises.push(new Promise((resolve) => {
            // Load Birdie with texture from assets
            this.loader.load('assets/birdie.png', (texture) => {
                const geometry = new THREE.PlaneGeometry(0.5, 1);
                const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
                this.models.birdie = new THREE.Mesh(geometry, material);
                this.models.birdie.castShadow = true;
                resolve();
            }, undefined, () => {
                console.warn('Birdie texture failed to load, using fallback');
                const geometry = new THREE.PlaneGeometry(0.5, 1);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                this.models.birdie = new THREE.Mesh(geometry, material);
                this.models.birdie.castShadow = true;
                resolve();
            });
        }));

        Promise.all(promises).then(() => {
            console.log('Models loaded:', this.models);
            if (callback) callback();
        }).catch(error => {
            console.error('Error loading models:', error);
            if (callback) callback();
        });
    }

    getModel(name) {
        const model = this.models[name.toLowerCase()];
        if (!model) {
            console.warn(`Model ${name} not found, creating placeholder`);
            return this.createPlaceholder(name);
        }
        return model.clone();
    }

    createPlaceholder(name) {
        const geometry = new THREE.PlaneGeometry(0.5, 1);
        const material = new THREE.MeshStandardMaterial({
            color: name.toLowerCase() === 'ace' ? 0x0000ff : 0x00ff00
        });
        const placeholder = new THREE.Mesh(geometry, material);
        placeholder.castShadow = true;
        return placeholder;
    }
}

window.ModelManager = ModelManager;