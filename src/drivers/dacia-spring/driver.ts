/**
 * Dacia Spring Driver
 * Handles pairing and device management
 */
import { Driver } from 'homey';
import { RenaultApiClient } from '../../api/renault-api-client';
import type { VehicleInfo } from '../../types/renault-api.types';

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
  async onPair(session: PairingSession): Promise<void> {
    let apiClient: RenaultApiClient | undefined;
    const settings: PairingSettings = {
      username: '',
      password: '',
      locale: 'nb-NO', // Will be set by user selection
    };

    /**
     * Combined login with locale selection
     */
    session.setHandler('login_with_locale', async (data: { locale: string; username: string; password: string }) => {
      this.log('Attempting login with locale...');
      this.log(`Locale: ${data.locale}`);
      this.log(`Username: ${data.username}`);

      if (!data.locale || !data.username || !data.password) {
        const error = 'Missing required fields';
        this.error(error);
        throw new Error(error);
      }

      try {
        // Save settings
        settings.locale = data.locale;
        settings.username = data.username;
        settings.password = data.password;

        // Create API client with selected locale
        this.log(`Creating API client with locale: ${settings.locale}`);
        apiClient = new RenaultApiClient(
          {
            username: data.username,
            password: data.password,
          },
          data.locale
        );

        // Get account info (this handles login internally)
        const accountInfo = await apiClient.getAccountInfo();
        settings.accountId = accountInfo.accountId;

        this.log('Login successful');
        return true;
      } catch (error) {
        this.error('Login failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMessage);
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
            modelCode: vehicle.modelCode,
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
