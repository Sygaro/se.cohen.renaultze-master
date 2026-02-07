/**
 * Renault Zoe Driver
 * Handles pairing and device management
 */

import { Driver } from 'homey';
import { RenaultApiClient } from '../../api/renault-api-client';

interface PairingSettings {
  username: string;
  password: string;
  locale: string;
  accountId?: string;
  vin?: string;
  modelCode?: string;
}

class RenaultZoeDriver extends Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit(): Promise<void> {
    this.log('RenaultZoeDriver has been initialized');
  }

  /**
   * onPair is called when a user starts pairing
   */
  async onPair(session: any): Promise<void> {
    let apiClient: RenaultApiClient | undefined;
    const settings: PairingSettings = {
      username: '',
      password: '',
      locale: 'sv-SE',
    };

    /**
     * Login handler - authenticate with Renault API
     */
    session.setHandler('login', async (data: { username: string; password: string }) => {
      this.log('Attempting login...');

      if (!data.username || !data.password) {
        this.error('Username or password missing');
        return false;
      }

      try {
        // Create API client
        apiClient = new RenaultApiClient(
          {
            username: data.username,
            password: data.password,
          },
          settings.locale
        );

        // Authenticate - getAccountInfo will handle login automatically
        await apiClient.getAccountInfo();

        // Store credentials for later
        settings.username = data.username;
        settings.password = data.password;
        settings.accountId = (apiClient as any).accountId;

        this.log('Login successful');
        return true;
      } catch (error: any) {
        this.error('Login failed:', error.message);
        return false;
      }
    });

    /**
     * List devices handler - show available vehicles
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
          name: `${vehicle.brand} ${vehicle.model} (${vehicle.vin})`,
          data: {
            id: vehicle.vin,
          },
          settings: {
            username: settings.username,
            password: settings.password,
            locale: settings.locale,
            accountId: settings.accountId || '',
            vin: vehicle.vin,
            modelCode: vehicle.modelCode,
          },
        }));

        return devices;
      } catch (error: any) {
        this.error('Failed to list devices:', error.message);
        throw new Error('Failed to retrieve vehicles from Renault');
      }
    });
  }
}

export = RenaultZoeDriver;
