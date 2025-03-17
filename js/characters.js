class CharacterManager {
    constructor(modelManager) {
        this.modelManager = modelManager;
        this.characters = {
            ace: { modelGroup: null, stats: { power: 8, accuracy: 7, luck: 5 } },
            birdie: { modelGroup: null, stats: { power: 6, accuracy: 9, luck: 7 } }
        };
        this.selectedCharacter = null;
        this.swingAnimation = null;
        this.celebrationAnimation = null;
    }

    createCharacterModels(scene) {
        this.characters.ace.modelGroup = this.modelManager.getModel('ace');
        this.characters.birdie.modelGroup = this.modelManager.getModel('birdie');
        if (this.characters.ace.modelGroup) {
            this.characters.ace.modelGroup.scale.set(2, 4, 2);
            scene.add(this.characters.ace.modelGroup);
        }
        if (this.characters.birdie.modelGroup) {
            this.characters.birdie.modelGroup.scale.set(2, 4, 2);
            scene.add(this.characters.birdie.modelGroup);
        }
        console.log('Character models created:', this.characters);
    }

    selectCharacter(name) {
        const character = this.characters[name.toLowerCase()];
        if (character && !character.modelGroup) {
            character.modelGroup = this.modelManager.getModel(name) || this.createPlaceholder(name);
        }
        this.selectedCharacter = character;
        return character;
    }

    createPlaceholder(name) {
        const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const material = new THREE.MeshStandardMaterial({
            color: name.toLowerCase() === 'ace' ? 0x0000ff : 0x00ff00
        });
        const model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        return model;
    }

    getStats() {
        return this.selectedCharacter?.stats || { power: 5, accuracy: 5, luck: 5 };
    }

    playSwingAnimation() {
        if (!this.selectedCharacter?.modelGroup) return;
        const model = this.selectedCharacter.modelGroup;
        let angle = 0;
        this.swingAnimation = setInterval(() => {
            angle += 0.1;
            model.rotation.y = Math.sin(angle) * 0.5; // Simple swing motion
            if (angle >= Math.PI * 2) {
                clearInterval(this.swingAnimation);
                model.rotation.y = 0;
            }
        }, 16);
        console.log(`${this.selectedCharacter ? this.selectedCharacter : 'Default'} swings!`);
        // Placeholder for sound effect
        console.log('Sound: Play swing sound effect (e.g., "thwack.wav")');
    }

    playCelebrationAnimation() {
        if (!this.selectedCharacter?.modelGroup) return;
        const model = this.selectedCharacter.modelGroup;
        let jump = 0;
        this.celebrationAnimation = setInterval(() => {
            jump += 0.1;
            model.position.y = Math.sin(jump) * 0.5 + 0.5; // Jump animation
            if (jump >= Math.PI * 2) {
                clearInterval(this.celebrationAnimation);
                model.position.y = 0.5;
            }
        }, 16);
        console.log(`${this.selectedCharacter ? this.selectedCharacter : 'Default'} celebrates!`);
        // Placeholder for sound effect
        console.log('Sound: Play celebration sound effect (e.g., "cheer.wav")');
    }
}

window.CharacterManager = CharacterManager;