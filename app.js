"use strict";
/**
 * Renault & Dacia Homey App v3.0
 * TypeScript-based app with modern architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = require("homey");
class RenaultApp extends homey_1.App {
    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        this.log('Renault & Dacia app v3.0 (TypeScript) has been initialized');
        // Register flow cards and other app-level functionality here if needed
        this.log('App initialization complete');
    }
    /**
     * onUninit is called when the app is about to be destroyed
     */
    async onUninit() {
        this.log('Renault & Dacia app is shutting down');
    }
}
module.exports = RenaultApp;
//# sourceMappingURL=app.js.map