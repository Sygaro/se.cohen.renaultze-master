/**
 * Renault Zoe Driver
 * Handles pairing and device management
 */

import { Driver } from 'homey';
import { RenaultApiClient } from '../../api/renault-api-client';

interface PairingSession {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setHandler(event: string, handler: (...args: any[]) => Promise<any>): void;
}

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
  async onPair(session: PairingSession): Promise<void> {
    let apiClient: RenaultApiClient | undefined;
    const settings: PairingSettings = {
      username: '',
      password: '',
      locale: 'nb-NO', // Changed from 'sv-SE' to Norwegian as default
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
        this.log('Calling getAccountInfo()...');
        const accountInfo = await apiClient.getAccountInfo();

        // Store credentials for later
        settings.username = data.username;
        settings.password = data.password;
        settings.accountId = accountInfo.accountId;

        this.log('✅ Login successful');
        this.log('Debug info:', apiClient.getDebugInfo());
        return true;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.error('❌ Login failed:', errorMessage);
        
        if (apiClient) {
          this.error('Debug info:', apiClient.getDebugInfo());
        }
        
        this.error('Please verify:');
        this.error('1. Username (email) is correct');
        this.error('2. Password is correct');
        this.error('3. You can log in to My Renault app/website');
        this.error('4. Your account region matches the selected locale');
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.error('Failed to list devices:', errorMessage);
        throw new Error('Failed to retrieve vehicles from Renault');
      }
    });
  }
}

export = RenaultZoeDriver;
