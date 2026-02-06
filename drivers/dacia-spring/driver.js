"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Dacia Spring Driver
 * Handles pairing and device management
 */
const homey_1 = require("homey");
const renault_api_client_1 = require("../../api/renault-api-client");
class DaciaSpringDriver extends homey_1.Driver {
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('DaciaSpringDriver has been initialized');
    }
    /**
     * onPair is called when a user starts pairing
     */
    async onPair(session) {
        let apiClient;
        const settings = {
            username: '',
            password: '',
            locale: 'it-IT', // Default locale for Dacia Spring
        };
        /**
         * Login handler - authenticate with Renault API
         */
        session.setHandler('login', async (data) => {
            this.log('Attempting login...');
            if (!data.username || !data.password) {
                this.error('Missing username or password');
                return false;
            }
            try {
                // Store credentials
                settings.username = data.username;
                settings.password = data.password;
                if (data.locale) {
                    settings.locale = data.locale;
                }
                // Create API client and authenticate
                apiClient = new renault_api_client_1.RenaultApiClient({
                    username: settings.username,
                    password: settings.password,
                }, settings.locale);
                // Get account info (this handles login internally)
                const accountInfo = await apiClient.getAccountInfo();
                settings.accountId = accountInfo.accountId;
                this.log('Login successful');
                return true;
            }
            catch (error) {
                this.error('Login failed:', error);
                return false;
            }
        });
        /**
         * List devices handler - fetch vehicles from API
         */
        session.setHandler('list_devices', async () => {
            this.log('Listing devices...');
            if (!apiClient) {
                this.error('API client not initialized');
                throw new Error('Please login first');
            }
            try {
                const vehicles = await apiClient.getVehicles();
                this.log(`Found ${vehicles.length} vehicle(s)`);
                const devices = vehicles.map((vehicle) => ({
                    name: `${vehicle.brand} ${vehicle.model}`,
                    data: {
                        id: vehicle.vin,
                    },
                    settings: {
                        username: settings.username,
                        password: settings.password,
                        accountId: settings.accountId,
                        vin: vehicle.vin,
                        modelCode: vehicle.model, // vehicle.model contains the model code
                        locale: settings.locale,
                    },
                }));
                return devices;
            }
            catch (error) {
                this.error('Failed to list devices:', error);
                throw error;
            }
        });
    }
}
exports.default = DaciaSpringDriver;
module.exports = DaciaSpringDriver;
//# sourceMappingURL=driver.js.map