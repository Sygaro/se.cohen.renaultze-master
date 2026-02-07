/**
 * Modern Dacia Spring Device Driver
 * TypeScript implementation with full type safety
 */

import { Device } from 'homey';
import { RenaultApiClient } from '../../api/renault-api-client';
import {
  ApiResponse,
  BatteryStatusResponse,
  LocationResponse,
} from '../../types/renault-api.types';

interface DeviceSettings {
  username: string;
  password: string;
  accountId: string;
  vin: string;
  modelCode: string;
  locale: string;
}

class DaciaSpringDevice extends Device {
  private api?: RenaultApiClient;
  private pollingInterval?: NodeJS.Timeout;
  private hvacTimeout?: NodeJS.Timeout;

  /**
   * Device initialization
   */
  async onInit(): Promise<void> {
    this.log(`Dacia Spring Device initialized: ${this.getName()}`);

    // Setup API client
    await this.setupApiClient();

    // Setup capabilities
    await this.setupCapabilities();

    // Register capability listeners
    this.registerCapabilityListeners();

    // Initial data fetch
    await this.fetchData();

    // Setup polling (every 7 minutes)
    this.pollingInterval = setInterval(() => {
      this.fetchData().catch((err) => {
        this.error('Polling error:', err);
      });
    }, 420000);
  }

  /**
   * Setup API client with credentials
   */
  private async setupApiClient(): Promise<void> {
    const settings = this.getSettings() as DeviceSettings;

    this.api = new RenaultApiClient(
      {
        username: settings.username,
        password: settings.password,
        accountId: settings.accountId,
        vin: settings.vin,
      },
      settings.locale || 'sv-SE'
    );

    // Set vehicle to enable capability detection
    this.api.setVehicle(settings.vin, settings.modelCode);

    this.log('API client configured for VIN:', settings.vin);
  }

  /**
   * Setup device capabilities
   */
  private async setupCapabilities(): Promise<void> {
    const capabilities = [
      'measure_battery',
      'measure_batteryTemperature',
      'measure_batteryAutonomy',
      'measure_batteryAvailableEnergy',
      'measure_batteryCapacity',
      'measure_plugStatus',
      'measure_chargingStatus',
      'measure_chargingRemainingTime',
      'measure_chargingInstantaneousPower',
      'measure_totalMileage',
      'measure_location',
      'measure_location_latitude',
      'measure_location_longitude',
      'measure_isHome',
      'charge_mode',
      'onoff', // For HVAC control
    ];

    for (const capability of capabilities) {
      if (!this.hasCapability(capability)) {
        try {
          await this.addCapability(capability);
          this.log(`Added capability: ${capability}`);
        } catch (err) {
          this.error(`Failed to add capability ${capability}:`, err);
        }
      }
    }
  }

  /**
   * Register listeners for interactive capabilities
   */
  private registerCapabilityListeners(): void {
    // HVAC control (onoff capability)
    this.registerCapabilityListener('onoff', async (value: boolean) => {
      return this.onHvacToggle(value);
    });

    // Charge mode picker
    this.registerCapabilityListener('charge_mode', async (value: string) => {
      return this.onChargeModeChange(value);
    });
  }

  /**
   * HVAC toggle handler
   */
  private async onHvacToggle(enable: boolean): Promise<void> {
    if (!this.api) {
      throw new Error('API client not initialized');
    }

    if (enable) {
      // Check battery level before starting
      const batteryLevel = this.getCapabilityValue('measure_battery') || 0;

      if (batteryLevel < 25) {
        throw new Error(this.homey.__('errors.battery_too_low', { min: 25 }));
      }

      // Start HVAC
      const result = await this.api.startHvac(21);

      if (result.status !== 'ok') {
        throw new Error(result.error || 'Failed to start HVAC');
      }

      await this.setCapabilityValue('onoff', true);

      // Auto-turn off after 10 minutes (safety)
      this.hvacTimeout = setTimeout(() => {
        this.setCapabilityValue('onoff', false);
      }, 600000);

      this.log('HVAC started');
    } else {
      // Note: Renault API doesn't support stopping HVAC reliably
      await this.setCapabilityValue('onoff', false);

      if (this.hvacTimeout) {
        clearTimeout(this.hvacTimeout);
      }

      this.log('HVAC stop requested (may not work on all models)');
    }
  }

  /**
   * Charge mode change handler
   */
  private async onChargeModeChange(mode: string): Promise<void> {
    if (!this.api) {
      throw new Error('API client not initialized');
    }

    const apiMode = mode === 'schedule_mode' ? 'schedule_mode' : 'always_charging';
    const result = await this.api.setChargeMode(apiMode);

    if (result.status !== 'ok') {
      throw new Error(result.error || 'Failed to set charge mode');
    }

    await this.setCapabilityValue('charge_mode', mode);
    this.log('Charge mode set to:', mode);
  }

  /**
   * Fetch all vehicle data
   */
  private async fetchData(): Promise<void> {
    if (!this.api) {
      this.error('API client not initialized');
      return;
    }

    this.log('Fetching vehicle data...');

    try {
      // Fetch data in parallel for better performance
      const [battery, chargeMode, cockpit, location] = await Promise.allSettled([
        this.api.getBatteryStatus(),
        this.api.getChargeMode(),
        this.api.getCockpit(),
        this.api.getLocation(),
      ]);

      // Update battery data
      if (battery.status === 'fulfilled') {
        await this.updateBatteryData(battery.value);
      } else {
        this.error('Battery fetch failed:', battery.reason);
      }

      // Update charge mode
      if (chargeMode.status === 'fulfilled') {
        await this.updateChargeMode(chargeMode.value);
      } else {
        this.error('Charge mode fetch failed:', chargeMode.reason);
      }

      // Update cockpit data
      if (cockpit.status === 'fulfilled') {
        await this.updateCockpitData(cockpit.value);
      } else {
        this.error('Cockpit fetch failed:', cockpit.reason);
      }

      // Update location
      if (location.status === 'fulfilled') {
        await this.updateLocation(location.value);
      } else {
        this.error('Location fetch failed:', location.reason);
      }

      this.log('Data fetch completed');
    } catch (error) {
      this.error('Critical error during data fetch:', error);
    }
  }

  /**
   * Update battery-related capabilities
   */
  private async updateBatteryData(result: ApiResponse<BatteryStatusResponse>): Promise<void> {
    if (result.status === 'notSupported') {
      this.log('Battery status not supported for this vehicle');
      return;
    }

    if (result.status !== 'ok' || !result.data) {
      this.error('Invalid battery data');
      return;
    }

    const attrs = result.data.data.attributes;

    await this.setCapabilityValue('measure_battery', attrs.batteryLevel || 0);

    if (attrs.batteryTemperature !== undefined) {
      await this.setCapabilityValue('measure_batteryTemperature', attrs.batteryTemperature);
    }

    await this.setCapabilityValue('measure_batteryAutonomy', attrs.batteryAutonomy || 0);
    await this.setCapabilityValue(
      'measure_batteryAvailableEnergy',
      attrs.batteryAvailableEnergy || 0
    );
    await this.setCapabilityValue('measure_batteryCapacity', attrs.batteryCapacity || 0);

    // Plug status
    const isPlugged = attrs.plugStatus === 1;
    await this.setCapabilityValue('measure_plugStatus', isPlugged);

    // Charging status
    const isCharging = attrs.chargingStatus === 1.0;
    await this.setCapabilityValue('measure_chargingStatus', isCharging);

    if (isCharging) {
      await this.setCapabilityValue(
        'measure_chargingRemainingTime',
        attrs.chargingRemainingTime || 0
      );
      await this.setCapabilityValue(
        'measure_chargingInstantaneousPower',
        attrs.chargingInstantaneousPower || 0
      );
    } else {
      await this.setCapabilityValue('measure_chargingRemainingTime', 0);
      await this.setCapabilityValue('measure_chargingInstantaneousPower', 0);
    }
  }

  /**
   * Update charge mode capability
   */
  private async updateChargeMode(result: ApiResponse<any>): Promise<void> {
    if (result.status === 'notSupported') {
      this.log('Charge mode not supported for this vehicle');
      return;
    }

    if (result.status !== 'ok' || !result.data) {
      return;
    }

    const chargeMode = result.data.data.attributes.chargeMode || result.data.data.attributes.mode;

    const homeyMode =
      chargeMode === 'scheduled' || chargeMode === 'schedule_mode'
        ? 'schedule_mode'
        : 'always_charging';

    await this.setCapabilityValue('charge_mode', homeyMode);
  }

  /**
   * Update cockpit data (mileage)
   */
  private async updateCockpitData(result: ApiResponse<any>): Promise<void> {
    if (result.status === 'notSupported') {
      this.log('Cockpit not supported for this vehicle');
      return;
    }

    if (result.status !== 'ok' || !result.data) {
      return;
    }

    const totalMileage = result.data.data.attributes.totalMileage || 0;
    await this.setCapabilityValue('measure_totalMileage', totalMileage);
  }

  /**
   * Update location and calculate if home
   */
  private async updateLocation(result: ApiResponse<LocationResponse>): Promise<void> {
    if (result.status === 'notSupported') {
      this.log('Location not supported for this vehicle');
      return;
    }

    if (result.status !== 'ok' || !result.data) {
      return;
    }

    const { gpsLatitude, gpsLongitude } = result.data.data.attributes;

    await this.setCapabilityValue('measure_location_latitude', gpsLatitude.toString());
    await this.setCapabilityValue('measure_location_longitude', gpsLongitude.toString());

    const locationUrl = `https://www.google.com/maps/search/?api=1&query=${gpsLatitude},${gpsLongitude}`;
    await this.setCapabilityValue('measure_location', locationUrl);

    // Calculate if vehicle is home
    try {
      const homeCoords = this.homey.geolocation.getLatLng();
      const distance = this.calculateDistance(
        homeCoords.latitude,
        homeCoords.longitude,
        gpsLatitude,
        gpsLongitude
      );

      const isHome = distance <= 1.0; // Within 1km
      await this.setCapabilityValue('measure_isHome', isHome);
    } catch (error) {
      this.error('Failed to get home coordinates:', error);
      // Set isHome to false if we can't get home coordinates
      await this.setCapabilityValue('measure_isHome', false);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Flow card actions
   */
  async startChargingAction(): Promise<void> {
    if (!this.api) {
      throw new Error('API not initialized');
    }

    const result = await this.api.resumeCharging();
    if (result.status !== 'ok') {
      throw new Error(result.error || 'Failed to start charging');
    }

    this.log('Charging started via flow card');
  }

  async stopChargingAction(): Promise<void> {
    if (!this.api) {
      throw new Error('API not initialized');
    }

    const result = await this.api.pauseCharging();
    if (result.status !== 'ok') {
      throw new Error(result.error || 'Failed to stop charging');
    }

    this.log('Charging stopped via flow card');
  }

  /**
   * Settings change handler
   */
  async onSettings({
    oldSettings: _oldSettings,
    newSettings: _newSettings,
    changedKeys,
  }: {
    oldSettings: DeviceSettings;
    newSettings: DeviceSettings;
    changedKeys: string[];
  }): Promise<void> {
    this.log('Settings changed:', changedKeys);

    // If credentials changed, reinitialize API client
    if (
      changedKeys.includes('username') ||
      changedKeys.includes('password') ||
      changedKeys.includes('locale')
    ) {
      await this.setupApiClient();
      await this.fetchData();
    }
  }

  /**
   * Device added handler
   */
  async onAdded(): Promise<void> {
    this.log('Device added');
  }

  /**
   * Device renamed handler
   */
  async onRenamed(name: string): Promise<void> {
    this.log('Device renamed to:', name);
  }

  /**
   * Device deletion handler
   */
  async onDeleted(): Promise<void> {
    this.log('Device deleted');

    // Cleanup intervals
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    if (this.hvacTimeout) {
      clearTimeout(this.hvacTimeout);
    }
  }
}

export = DaciaSpringDevice;
