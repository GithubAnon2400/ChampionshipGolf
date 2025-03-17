class PhysicsEngine {
    constructor() {
        if (!CANNON || !window.THREE) {
            throw new Error('CANNON.js or Three.js not loaded');
        }
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.bodies = {};
        this.isBallAtRest = false;
    }

    createTerrain(heightData, size, position) {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.position.set(position.x, position.y, position.z);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
    }

    createBall(radius, position) {
        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(ballShape);
        ballBody.position.set(position.x, position.y, position.z);
        ballBody.linearDamping = 0.1;
        ballBody.angularDamping = 0.1;
        this.bodies.ball = ballBody;
        this.world.addBody(ballBody);
    }

    hitBall(force, direction, position, stats) {
        if (!this.bodies.ball) return;
        const accuracyFactor = 1 - (stats.accuracy / 10) * 0.2;
        const luckFactor = (stats.luck / 10) * 0.1;
        const finalForce = force * (1 + luckFactor) * (1 - accuracyFactor);
        const finalDirection = new CANNON.Vec3(
            direction.x + (Math.random() - 0.5) * accuracyFactor,
            direction.y,
            direction.z + (Math.random() - 0.5) * accuracyFactor
        ).normalize();
        this.bodies.ball.applyImpulse(
            finalDirection.scale(finalForce * 10),
            new CANNON.Vec3().copy(this.bodies.ball.position)
        );
        this.isBallAtRest = false;
        return { force: finalForce, direction: finalDirection };
    }

    update(delta) {
        this.world.step(delta);
        if (this.bodies.ball && this.bodies.ball.velocity.length() < 0.1) {
            this.isBallAtRest = true;
        } else {
            this.isBallAtRest = false;
        }
    }
}

window.PhysicsEngine = PhysicsEngine;