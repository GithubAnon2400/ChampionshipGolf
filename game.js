class Game {
    constructor() {
        console.log('Initializing Championship Golf game...');

        this.state = {
            isRunning: false,
            currentHole: 0,
            playerName: 'Player',
            playerScore: 0,
            playerStrokes: 0,
            holeStrokes: 0,
            ballInMotion: false,
            shotDirection: new THREE.Vector3(0, 0, -1),
            rotationSpeed: 0,
            selectedCharacter: null,
            currentClub: 'driver',
            power: 0,
            trickShotActive: false,
            players: new Map(),
            clouds: []
        };

        if (!window.THREE) throw new Error('Three.js not loaded');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) throw new Error('Canvas container not found');
        canvasContainer.appendChild(this.renderer.domElement);

        // Sunny day lighting
        this.scene.add(new THREE.AmbientLight(0xffffcc, 0.8));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Sunny skybox with dynamic clouds
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB, // Light blue sky
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(skybox);

        // Add sun
        const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(100, 200, 100);
        this.scene.add(sun);

        try {
            this.physics = typeof PhysicsEngine === 'function' ? new PhysicsEngine() : null;
            this.course = (typeof Course === 'function' && this.physics) ? new Course(this.scene, this.physics) : null;
            this.modelManager = typeof ModelManager === 'function' ? new ModelManager() : null;
            this.characterManager = typeof CharacterManager === 'function' ? new CharacterManager(this.modelManager) : null;
            this.ui = typeof UIManager === 'function' ? new UIManager(this) : null;

            window.addEventListener('load', () => {
                if (this.ui && typeof this.ui.initializeScreens === 'function') {
                    this.ui.initializeScreens();
                }
            });
        } catch (e) {
            console.error('Error initializing components:', e);
            this.ui = null;
        }

        if (this.modelManager && typeof this.modelManager.loadModels === 'function') {
            this.ui?.showLoading('Loading character textures...');
            this.modelManager.loadModels(() => {
                this.setupCharacterManager();
                this.initGame();
            });
            setTimeout(() => {
                if (!this.state.isRunning) {
                    console.warn('Loading timed out, proceeding with fallbacks');
                    this.setupCharacterManager();
                    this.initGame();
                }
            }, 5000);
        } else {
            this.setupCharacterManager();
            this.initGame();
        }

        this.setupEventListeners();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        this.clubs = {
            driver: { maxDistance: 300, forceMultiplier: 20 },
            '3-wood': { maxDistance: 250, forceMultiplier: 18 },
            '5-wood': { maxDistance: 230, forceMultiplier: 16 },
            '2-iron': { maxDistance: 210, forceMultiplier: 14 },
            '3-iron': { maxDistance: 200, forceMultiplier: 13 },
            '4-iron': { maxDistance: 190, forceMultiplier: 12 },
            '5-iron': { maxDistance: 180, forceMultiplier: 11 },
            '6-iron': { maxDistance: 170, forceMultiplier: 10 },
            '7-iron': { maxDistance: 160, forceMultiplier: 9 },
            '8-iron': { maxDistance: 150, forceMultiplier: 8 },
            '9-iron': { maxDistance: 140, forceMultiplier: 7 },
            'pitching-wedge': { maxDistance: 130, forceMultiplier: 6 },
            putter: { maxDistance: 30, forceMultiplier: 2 }
        };

        this.trail = null;
        this.trailPoints = [];
        this.trailMaxPoints = 50;
        this.aimingIndicator = null;
        this.holeCircle = null;
        this.flagstick = null;
        this.setupMultiplayer();
        this.createInitialClouds();
    }

    createInitialClouds() {
        for (let i = 0; i < 5; i++) {
            const cloudGeometry = new THREE.SphereGeometry(5 + Math.random() * 5, 16, 16);
            const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                Utils.randomInt(-200, 200),
                50 + Math.random() * 50,
                Utils.randomInt(-200, 200)
            );
            cloud.userData = { speed: 0.05 + Math.random() * 0.05 };
            this.scene.add(cloud);
            this.state.clouds.push(cloud);
        }
    }

    setupCharacterManager() {
        if (this.characterManager) {
            this.selectCharacter('ace');
            this.characterManager.createCharacterModels(this.scene);
        }
    }

    initGame() {
        this.ui.initialize();
        const today = new Date();
        const seed = Utils.hashCode(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
        this.course.generateCourse(seed);
        this.ui.showScreen('start');
        this.ui.showLoading('');
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.getElementById('trick-shot-btn')?.addEventListener('click', () => {
            this.state.trickShotActive = !this.state.trickShotActive;
            console.log('Trick shot mode:', this.state.trickShotActive);
            this.ui.showNotification(this.state.trickShotActive ? 'Trick Shot Mode ON!' : 'Trick Shot Mode OFF!', 2000);
        });

        document.getElementById('share-score-btn')?.addEventListener('click', () => {
            this.shareScore();
        });

        document.getElementById('share-final-score-btn')?.addEventListener('click', () => {
            this.shareScore();
        });
    }

    setPlayerName(name) {
        this.state.playerName = name;
        this.ui?.updatePlayerInfo(name, this.state.playerScore, this.state.playerStrokes);
    }

    selectCharacter(characterName) {
        if (this.characterManager) {
            this.state.selectedCharacter = this.characterManager.selectCharacter(characterName);
            console.log(`Selected character: ${characterName}`, this.state.selectedCharacter);
            if (!this.state.selectedCharacter?.modelGroup) {
                this.state.selectedCharacter.modelGroup = this.modelManager.getModel(characterName);
                if (this.state.selectedCharacter.modelGroup) {
                    this.scene.add(this.state.selectedCharacter.modelGroup);
                }
            }
            this.character = this.state.selectedCharacter.modelGroup;
        }
    }

    setupMultiplayer() {
        this.playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.state.players.set(this.playerId, {
            name: this.state.playerName,
            score: 0,
            strokes: 0,
            character: this.character,
            ball: this.ball,
            position: this.ball ? this.ball.position.clone() : new THREE.Vector3(0, 0, 0)
        });

        for (let i = 0; i < 3; i++) {
            const otherId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const otherCharacter = this.characterManager.selectCharacter(i % 2 === 0 ? 'ace' : 'birdie').modelGroup.clone();
            const otherBall = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 32, 32),
                new THREE.MeshStandardMaterial({ color: 0xff0000 + i * 0x333333 })
            );
            otherBall.position.set(
                Utils.randomInt(-20, 20),
                0.1,
                Utils.randomInt(-this.course.holes[0].length, 0)
            );
            this.scene.add(otherCharacter);
            this.scene.add(otherBall);
            this.state.players.set(otherId, {
                name: `Player${i + 2}`,
                score: 0,
                strokes: 0,
                character: otherCharacter,
                ball: otherBall,
                position: otherBall.position.clone()
            });
        }
    }

    sendPlayerUpdate() {
        const data = {
            playerId: this.playerId,
            position: this.ball ? this.ball.position.toArray() : [0, 0, 0],
            character: this.state.selectedCharacter ? this.state.selectedCharacter.modelGroup.position.toArray() : [0, 0, 0]
        };
        this.updateOtherPlayers();
    }

    updateOtherPlayers() {
        this.state.players.forEach((player, id) => {
            if (id !== this.playerId && player.ball) {
                player.ball.position.z += 0.01;
                if (player.ball.position.z > 50) player.ball.position.z = -this.course.holes[0].length;
                if (player.character) player.character.position.copy(player.ball.position).add(new THREE.Vector3(0, 0, 0.5));
            }
        });
    }

    startGame() {
        if (!this.state.selectedCharacter) return;
        if (!this.ui || !this.course || !this.physics) return;
        this.state.isRunning = true;
        this.state.currentHole = 0;
        this.loadNextHole();
        this.ui.showScreen('game');
    }

    loadNextHole() {
        try {
            this.state.currentHole = 1;
            this.state.holeStrokes = 0;

            this.scene.children = this.scene.children.filter(child =>
                child instanceof THREE.Light || child === this.character || child === this.ball || child === this.trail || child === this.aimingIndicator || child === this.holeCircle || child === this.flagstick || this.state.clouds.includes(child)
            );

            const hole = this.course?.loadHole(this.state.currentHole - 1) || { par: 4, greenSize: 20 };
            this.ui?.updateHoleInfo(this.state.currentHole, hole.par);

            if (!this.ball) {
                const ballRadius = 0.1;
                this.ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
                this.ball.castShadow = true;
                this.scene.add(this.ball);
                this.trail = this.createTrail();
                this.scene.add(this.trail);
            }

            const teePos = this.course?.getTeePosition() || { x: 0, y: 0, z: 0 };
            const terrainOffset = hole.length * 1.5 / 2;
            this.ball.position.set(teePos.x + terrainOffset, teePos.y + 0.1, teePos.z - terrainOffset);

            if (this.physics?.createBall) this.physics.createBall(0.1, { x: teePos.x + terrainOffset, y: teePos.y + 0.1, z: teePos.z - terrainOffset });
            if (this.physics?.bodies?.ball) {
                this.physics.bodies.ball.position.set(teePos.x + terrainOffset, teePos.y + 0.1, teePos.z - terrainOffset);
                this.physics.bodies.ball.velocity.set(0, 0, 0);
            }

            if (!this.state.selectedCharacter && this.characterManager) this.state.selectedCharacter = this.characterManager.selectCharacter('ace');
            this.characterObj = this.state.selectedCharacter;
            if (!this.character && this.characterObj?.modelGroup) {
                this.character = this.characterObj.modelGroup;
                this.scene.add(this.character);
            }

            if (this.characterObj?.positionAt) {
                this.characterObj.positionAt(teePos.x + terrainOffset, teePos.y, teePos.z - terrainOffset + 0.5);
                this.characterObj.faceTarget?.(this.ball?.position || teePos);
            } else if (this.character) {
                this.character.position.set(teePos.x + terrainOffset, teePos.y, teePos.z - terrainOffset + 0.5);
                this.character.lookAt(this.ball.position.x, this.character.position.y, this.ball.position.z);
            }

            this.state.ballInMotion = false;
            this.trailPoints = [];

            const holePos = this.course.getHolePosition();
            const ballPos = this.ball.position.clone();
            this.state.shotDirection.subVectors(holePos, ballPos).normalize();
            this.state.shotDirection.y = 0;
            this.state.shotDirection.normalize();

            this.selectBestClub(ballPos.distanceTo(new THREE.Vector3(holePos.x, ballPos.y, holePos.z)), hole.greenSize);
            this.createAimingIndicator();
            this.updateAimingIndicator();
            this.addHoleCircle(holePos, hole.greenSize);
            this.addFlagstick(holePos);
            this.updateUIDetails();
            this.positionCamera();
        } catch (e) {
            console.error('Error loading next hole:', e);
            this.ui?.showNotification('Error loading hole, please restart.', 3000);
        }
    }

    addHoleCircle(position, radius) {
        if (this.holeCircle) this.scene.remove(this.holeCircle);
        const geometry = new THREE.CircleGeometry(radius * 0.1, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.holeCircle = new THREE.Mesh(geometry, material);
        this.holeCircle.position.set(position.x, position.y, position.z);
        this.holeCircle.rotateX(-Math.PI / 2);
        this.scene.add(this.holeCircle);
    }

    addFlagstick(position) {
        if (this.flagstick) this.scene.remove(this.flagstick);
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const flagGeometry = new THREE.PlaneGeometry(0.5, 0.3);
        const flagMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, side: THREE.DoubleSide });
        this.flagstick = new THREE.Group();
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        pole.position.set(0, 1, 0);
        flag.position.set(0.25, 1.85, 0);
        this.flagstick.add(pole);
        this.flagstick.add(flag);
        this.flagstick.position.set(position.x, position.y, position.z);
        this.scene.add(this.flagstick);
    }

    createTrail() {
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.trailMaxPoints * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const trailMaterial = new THREE.PointsMaterial({
            color: 0x808080,
            size: 0.2,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Points(trailGeometry, trailMaterial);
        trail.frustumCulled = false;
        return trail;
    }

    updateTrail() {
        if (!this.ball || !this.trail || !this.state.ballInMotion) return;
        this.trailPoints.push(new THREE.Vector3().copy(this.ball.position));
        if (this.trailPoints.length > this.trailMaxPoints) this.trailPoints.shift();
        const positions = this.trail.geometry.attributes.position.array;
        for (let i = 0; i < this.trailMaxPoints; i++) {
            const idx = i * 3;
            if (i < this.trailPoints.length) {
                const point = this.trailPoints[i];
                positions[idx] = point.x;
                positions[idx + 1] = point.y;
                positions[idx + 2] = point.z;
            } else {
                positions[idx] = positions[idx + 1] = positions[idx + 2] = 0;
            }
        }
        this.trail.geometry.attributes.position.needsUpdate = true;
        this.trail.geometry.setDrawRange(0, this.trailPoints.length);
    }

    positionCamera() {
        if (!this.ball) return;
        const ballPos = this.ball.position.clone();
        const holePos = this.course.getHolePosition();
        const directionToHole = new THREE.Vector3().subVectors(holePos, ballPos).normalize();
        const distanceToHole = ballPos.distanceTo(new THREE.Vector3(holePos.x, ballPos.y, holePos.z));
        const cameraDistance = Utils.clamp(8 + distanceToHole * 0.02, 8, 20); // Dynamic zoom
        const cameraHeight = 6;
        const cameraOffset = directionToHole.clone().multiplyScalar(-cameraDistance);
        this.camera.position.set(ballPos.x + cameraOffset.x, ballPos.y + cameraHeight, ballPos.z + cameraOffset.z);
        this.camera.lookAt(holePos.x, holePos.y + 2, holePos.z);
    }

    updateUIDetails() {
        if (!this.ball || !this.course || !this.ui) return;
        const ballPos = this.ball.position.clone();
        const holePos = this.course.getHolePosition();
        const distanceToHole = Utils.distance3D(ballPos, new THREE.Vector3(holePos.x, ballPos.y, holePos.z));
        const club = this.clubs[this.state.currentClub];
        const maxDistance = club.maxDistance;
        this.ui.updateGameDetails({ distanceToHole, maxClubDistance: maxDistance, club: this.state.currentClub });
    }

    createAimingIndicator() {
        if (this.aimingIndicator) this.scene.remove(this.aimingIndicator);
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([0, 0.1, 0, 0, 0.1, -5]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
        this.aimingIndicator = new THREE.Line(geometry, material);
        this.scene.add(this.aimingIndicator);
    }

    updateAimingIndicator() {
        if (!this.aimingIndicator || !this.ball) return;
        const ballPos = this.ball.position.clone();
        const direction = this.state.shotDirection.clone().multiplyScalar(5);
        const positions = this.aimingIndicator.geometry.attributes.position.array;
        positions[0] = ballPos.x; positions[1] = ballPos.y + 0.1; positions[2] = ballPos.z;
        positions[3] = ballPos.x + direction.x; positions[4] = ballPos.y + 0.1; positions[5] = ballPos.z + direction.z;
        this.aimingIndicator.geometry.attributes.position.needsUpdate = true;
    }

    selectBestClub(distanceToHole, greenSize) {
        const ballPos = this.ball.position.clone();
        const isOnGreen = distanceToHole <= greenSize && ballPos.y < 0.2;
        if (isOnGreen) {
            this.state.currentClub = 'putter';
        } else {
            const clubsByDistance = Object.entries(this.clubs)
                .filter(([_, club]) => club.maxDistance >= distanceToHole && club.maxDistance < 310)
                .sort(([, a], [, b]) => a.maxDistance - b.maxDistance);
            this.state.currentClub = clubsByDistance.length > 0 ? clubsByDistance[0][0] : 'driver';
        }
        console.log(`Selected club: ${this.state.currentClub} for distance ${distanceToHole} yards`);
    }

    startRotation(direction) {
        if (!this.state.isRunning || this.state.ballInMotion) return;
        this.state.rotationSpeed = direction === 'left' ? 1 : -1;
    }

    stopRotation() {
        this.state.rotationSpeed = 0;
    }

    swing(power) {
        if (!this.state.isRunning || this.state.ballInMotion) return;
        console.log('Swing initiated with power:', power);
        this.state.holeStrokes++;
        this.state.playerStrokes++;
        this.ui?.updatePlayerInfo(this.state.playerName, this.state.playerScore, this.state.playerStrokes);
        this.state.power = Utils.clamp(power, 0, 100);
        const currentHole = this.course.getCurrentHole();
        const ballPos = this.ball.position.clone();
        const holePos = currentHole.holePosition;
        const distanceToHole = Utils.distance3D(ballPos, new THREE.Vector3(holePos.x, ballPos.y, holePos.z));
        const isOnGreen = distanceToHole <= currentHole.greenSize && ballPos.y < 0.2;
        if (isOnGreen) this.state.currentClub = 'putter';
        else this.selectBestClub(distanceToHole, currentHole.greenSize);

        const club = this.clubs[this.state.currentClub];
        let force = (this.state.power / 100) * club.forceMultiplier;
        let direction = { x: this.state.shotDirection.x, y: 0.2, z: this.state.shotDirection.z };

        if (this.state.trickShotActive) {
            const trickType = Math.floor(Math.random() * 3); // 0: Spin, 1: Bounce, 2: Power Boost
            force *= 1.5;
            if (trickType === 0) {
                direction.y += 0.3; // Spin effect
                this.ui.showNotification('Trick Shot: Spin!', 2000);
            } else if (trickType === 1) {
                direction.y += 0.5; // Bounce effect
                this.ui.showNotification('Trick Shot: Bounce!', 2000);
            } else {
                force *= 1.2; // Power boost
                this.ui.showNotification('Trick Shot: Power Boost!', 2000);
            }
            this.createTrickShotEffect(trickType);
        }

        if (this.state.power >= 90 && this.state.power <= 100) {
            this.ui.elements.powerMeter.classList.add('perfect');
            force *= 1.2;
            this.ui.showNotification('Perfect Swing! +20% Power!', 2000);
        } else {
            this.ui.elements.powerMeter.classList.remove('perfect');
        }

        if (this.state.currentClub === 'putter') {
            direction.y = 0;
            force *= 0.5;
        } else {
            const exaggerationFactor = 1.5;
            direction.y += 0.5 * exaggerationFactor;
            force *= exaggerationFactor;
        }

        console.log(`Using ${this.state.currentClub} with force ${force}, direction:`, direction);
        let stats = { power: 5, accuracy: 5, luck: 5 };
        if (this.characterObj?.getStats) stats = this.characterObj.getStats();
        const hitResult = this.physics.hitBall(force, direction, { x: 0, y: 0, z: 0 }, stats);
        this.state.ballInMotion = true;
        this.trailPoints = [];
        this.characterObj?.playSwingAnimation();
        this.updateUIDetails();
        this.createSwingParticles();
    }

    createTrickShotEffect(trickType) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 3;
            const y = Math.random() * 3;
            const z = (Math.random() - 0.5) * 3;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({
            color: trickType === 0 ? 0x00FFFF : trickType === 1 ? 0xFF00FF : 0xFFFF00,
            size: 0.2
        });
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(this.ball.position);
        this.scene.add(particles);
        setTimeout(() => this.scene.remove(particles), 1500);
    }

    createSwingParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 2;
            const y = Math.random() * 2;
            const z = (Math.random() - 0.5) * 2;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xFFD700, size: 0.1 });
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(this.ball.position);
        this.scene.add(particles);
        setTimeout(() => this.scene.remove(particles), 1000);
    }

    createUFO() {
        const geometry = new THREE.CylinderGeometry(0, 1, 0.5, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
        const ufo = new THREE.Mesh(geometry, material);
        ufo.position.set(
            Utils.randomInt(-50, 50),
            10 + Math.random() * 5,
            Utils.randomInt(-this.course.holes[0].length, 0)
        );
        ufo.userData = { speed: 0.1 + Math.random() * 0.2, type: 'ufo' };
        this.scene.add(ufo);
        return ufo;
    }

    createBird() {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0xffa500 });
        const bird = new THREE.Mesh(geometry, material);
        bird.position.set(
            Utils.randomInt(-50, 50),
            5 + Math.random() * 5,
            Utils.randomInt(-this.course.holes[0].length, 0)
        );
        bird.userData = { speed: 0.2 + Math.random() * 0.3, type: 'bird' };
        this.scene.add(bird);
        return bird;
    }

    createCelebrationParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 5;
            const y = Math.random() * 5;
            const z = (Math.random() - 0.5) * 5;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xFF4500, size: 0.2 });
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(this.course.getHolePosition());
        this.scene.add(particles);
        setTimeout(() => this.scene.remove(particles), 2000);
    }

    onBallAtRest() {
        this.state.ballInMotion = false;
        const holePos = this.course.holes[this.state.currentHole - 1].holePosition;
        const ballSpeed = this.physics?.bodies?.ball?.velocity.length() || 0;
        const distanceToHole = Utils.distance3D(this.ball.position, holePos);
        const distanceToFlagstick = Utils.distance3D(this.ball.position, this.flagstick.position);

        if (distanceToHole <= 0.054 || (distanceToHole < 0.1 && ballSpeed < 0.1) || distanceToFlagstick < 0.1) {
            const par = this.course.holes[this.state.currentHole - 1].par;
            const scoreDifferential = this.state.holeStrokes - par;
            this.state.playerScore += scoreDifferential < 0 ? 0 : scoreDifferential; // Bonus for under par
            this.state.players.get(this.playerId).score = this.state.playerScore;
            this.ui?.updatePlayerInfo(this.state.playerName, this.state.playerScore, this.state.playerStrokes);
            this.ui?.showHoleCompletionMessage(this.state.holeStrokes, par);
            this.characterObj?.playCelebrationAnimation();
            this.createCelebrationParticles();
            this.scene.remove(this.ball);
            this.sendPlayerUpdate();
            this.endGame();
        } else {
            if (this.characterObj?.positionAt) {
                this.characterObj.positionAt(this.ball.position.x, 0, this.ball.position.z + 0.5);
                this.characterObj.faceTarget?.(this.ball.position);
            } else if (this.character) {
                this.character.position.set(this.ball.position.x, 0, this.ball.position.z + 0.5);
                this.character.lookAt(this.ball.position.x, this.character.position.y, this.ball.position.z);
            }
            const currentHole = this.course.getCurrentHole();
            if (currentHole?.holePosition) {
                const dirToHole = new THREE.Vector3().subVectors(currentHole.holePosition, this.ball.position).normalize();
                this.state.shotDirection.copy(dirToHole);
                this.state.shotDirection.y = 0;
                if (this.characterObj?.faceTarget) this.characterObj.faceTarget(new THREE.Vector3(this.ball.position.x + dirToHole.x, this.ball.position.y, this.ball.position.z + dirToHole.z));
            }
            this.positionCamera();
            this.updateAimingIndicator();
            this.updateUIDetails();
            this.sendPlayerUpdate();
        }
    }

    endGame() {
        this.state.isRunning = false;
        this.ui?.updateFinalScore(this.state.playerScore);
        this.ui?.showScreen('gameOver');
    }

    resetGame() {
        this.state.currentHole = 0;
        this.state.playerScore = 0;
        this.state.playerStrokes = 0;
        this.startGame();
    }

    submitScore(name, email) {
        console.log(`Submitting score: ${name}, ${email}, ${this.state.playerScore}`);
        const leaderboard = new Leaderboard();
        leaderboard.addScore('daily', name, this.state.playerScore);
        leaderboard.addScore('legends', name, this.state.playerScore);
        this.ui.updateLeaderboard(leaderboard.getScores('daily'), leaderboard.getScores('legends'));
    }

    shareScore() {
        const score = this.state.playerScore;
        const shareText = `I scored ${score > 0 ? '+' + score : score} in Championship Golf! Can you beat me? Play now: [Insert Link]`;
        console.log('Share score:', shareText);
        this.ui.showNotification('Score ready to share! Copy the link!', 3000);
    }

    animate(time) {
        try {
            const delta = (time - (this.lastTime || time)) / 1000;
            this.lastTime = time;
            if (this.state.isRunning) {
                if (this.state.rotationSpeed !== 0) {
                    const angle = this.state.rotationSpeed * Math.PI * delta;
                    const x = this.state.shotDirection.x, z = this.state.shotDirection.z;
                    this.state.shotDirection.x = x * Math.cos(angle) - z * Math.sin(angle);
                    this.state.shotDirection.z = x * Math.sin(angle) + z * Math.cos(angle);
                    this.state.shotDirection.normalize();
                    if (this.characterObj?.faceTarget) this.characterObj.faceTarget(this.ball.position.clone().add(this.state.shotDirection));
                    this.positionCamera();
                    this.updateAimingIndicator();
                }
                if (this.physics) this.physics.update(delta);
                if (this.ball && this.physics?.bodies?.ball) {
                    this.ball.position.copy(this.physics.bodies.ball.position);
                    this.ball.quaternion.copy(this.physics.bodies.ball.quaternion);
                    this.updateTrail();
                    if (this.physics.bodies.ball.velocity.y < -0.1 && this.ball.position.y < 0.1) {
                        this.ball.position.y = 0.1;
                        this.physics.bodies.ball.velocity.y *= -0.5;
                    }
                }
                if (this.state.ballInMotion && this.physics?.isBallAtRest()) this.onBallAtRest();

                this.state.clouds.forEach(cloud => {
                    cloud.position.x += cloud.userData.speed;
                    if (cloud.position.x > 300) cloud.position.x = -300;
                });

                this.scene.children.forEach(child => {
                    if (child.userData && (child.userData.speed || child.userData.speed === 0)) {
                        child.position.z += child.userData.speed;
                        if (child.position.z > 50) {
                            child.position.z = -this.course.holes[0].length;
                            child.position.x = Utils.randomInt(-50, 50);
                            child.position.y = child.userData.type === 'ufo' ? 10 + Math.random() * 5 : 5 + Math.random() * 5;
                        }
                    }
                });

                if (Math.random() < 0.01) this.scene.add(this.createUFO());
                if (Math.random() < 0.02) this.scene.add(this.createBird());

                this.updateOtherPlayers();
            }
            this.renderer.render(this.scene, this.camera);
        } catch (e) {
            console.error('Animation error:', e);
        }
        requestAnimationFrame(this.animate);
    }
}

String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
};

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});