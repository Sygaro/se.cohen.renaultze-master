/**
 * Dacia Spring Driver
 * Handles pairing and device management
 */
import { Driver } from 'homey';
import { RenaultApiClient } from '../../api/renault-api-client';
import type { VehicleInfo } from '../../types/renault-api.types';

interface PairingSettings {
  username: string;
  password: string;
  locale: string;
  accountId?: string;
  vin?: string;
  modelCode?: string;
}

class DaciaSpringDriver extends Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit(): Promise<void> {
    this.log('DaciaSpringDriver has been initialized');
  }

  /**
   * onPair is called when a user starts pairing
   */
  async onPair(session: any): Promise<void> {
    let apiClient: RenaultApiClient | undefined;
    const settings: PairingSettings = {
      username: '',
      password: '',
      locale: 'it-IT', // Default locale for Dacia Spring
    };

    /**
     * Login handler - authenticate with Renault API
     */
    session.setHandler(
      'login',
      async (data: { username: string; password: string; locale?: string }) => {
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
          apiClient = new RenaultApiClient(
            {
              username: settings.username,
              password: settings.password,
            },
            settings.locale
          );

          // Get account info (this handles login internally)
          const accountInfo = await apiClient.getAccountInfo();
          settings.accountId = accountInfo.accountId;

          this.log('Login successful');
          return true;
        } catch (error) {
          this.error('Login failed:', error);
          return false;
        }
      }
    );

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

        const devices = vehicles.map((vehicle: VehicleInfo) => ({
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
      } catch (error) {
        this.error('Failed to list devices:', error);
        throw error;
      }
    });
  }
}

export = DaciaSpringDriver;
