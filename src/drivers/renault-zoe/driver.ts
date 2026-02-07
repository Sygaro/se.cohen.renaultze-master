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
      locale: 'nb-NO', // Will be set by user selection
    };

    /**
     * Combined login with locale selection
     */
    session.setHandler('login_with_locale', async (data: { locale: string; username: string; password: string }) => {
      this.log('================================================');
      this.log('LOGIN_WITH_LOCALE HANDLER CALLED');
      this.log(`Locale: ${data.locale}`);
      this.log(`Username: ${data.username}`);
      this.log(`Password length: ${data.password?.length || 0}`);
      this.log('================================================');

      if (!data.locale || !data.username || !data.password) {
        const error = 'Missing required fields';
        this.error('❌ Validation failed:', error);
        throw new Error(error);
      }

      try {
        // Save settings
        settings.locale = data.locale;
        settings.username = data.username;
        settings.password = data.password;
        this.log('✅ Settings saved');

        // Create API client with selected locale
        this.log(`Step 1: Creating API client with locale: ${settings.locale}`);
        apiClient = new RenaultApiClient(
          {
            username: data.username,
            password: data.password,
          },
          data.locale
        );
        this.log('✅ API client created');
        this.log('Config:', JSON.stringify(apiClient.getDebugInfo(), null, 2));

        // Authenticate - getAccountInfo will handle login automatically
        this.log('Step 2: Calling getAccountInfo()...');
        const accountInfo = await apiClient.getAccountInfo();
        this.log('✅ Account info retrieved:', JSON.stringify(accountInfo, null, 2));

        // Store account ID
        settings.accountId = accountInfo.accountId;

        // Final validation
        if (!settings.accountId) {
          throw new Error('Account ID not set after getAccountInfo()');
        }

        this.log('================================================');
        this.log('✅ LOGIN SUCCESSFUL');
        this.log(`Account ID: ${settings.accountId}`);
        this.log('================================================');
        return true;
      } catch (error: unknown) {
        this.error('================================================');
        this.error('❌ LOGIN FAILED');
        
        if (error instanceof Error) {
          this.error(`Error name: ${error.name}`);
          this.error(`Error message: ${error.message}`);
          if (error.stack) {
            this.error(`Stack trace: ${error.stack}`);
          }
        } else {
          this.error(`Unknown error: ${String(error)}`);
        }
        
        if (apiClient) {
          this.error('API Client Debug Info:', JSON.stringify(apiClient.getDebugInfo(), null, 2));
        }
        
        this.error('================================================');
        
        // Re-throw with clear error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during login';
        throw new Error(errorMessage);
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
