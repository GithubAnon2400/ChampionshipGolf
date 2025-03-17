class Utils {
    /**
     * Generates a random integer between min and max (inclusive).
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number} A random integer.
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Clamps a value between a minimum and maximum.
     * @param {number} value - The value to clamp.
     * @param {number} min - The minimum allowed value.
     * @param {number} max - The maximum allowed value.
     * @returns {number} The clamped value.
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Calculates the 3D distance between two points.
     * @param {THREE.Vector3} point1 - The first point.
     * @param {THREE.Vector3} point2 - The second point.
     * @returns {number} The distance between the points.
     */
    static distance3D(point1, point2) {
        if (!point1 || !point2 || !(point1 instanceof THREE.Vector3) || !(point2 instanceof THREE.Vector3)) {
            console.warn('Invalid points provided for distance3D');
            return 0;
        }
        return point1.distanceTo(point2);
    }

    /**
     * Generates a simple hash code from a string (used for daily seeds).
     * @param {string} str - The input string.
     * @returns {number} A hash code.
     */
    static hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
}

window.Utils = Utils;