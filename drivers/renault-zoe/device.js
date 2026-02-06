'use strict';

const Homey = require('homey');
const api = require('../../lib/api');

module.exports = class RenaultZoeDevice extends Homey.Device {

  async onInit() {
    this.log('RenaultZoeDevice has been initialized for: ', this.getName());

    this.SetCapabilities();

    this.hvacState = 'off';
    this.setCapabilityValue('onoff', false)
    this.registerCapabilityListener('onoff', this.onCapabilityButton.bind(this));

    this.chargeStart = 'off';

    this.setCapabilityValue('charge_mode', 'always_charging')
    this.registerCapabilityListener('charge_mode', this.onCapabilityPicker.bind(this));

    this.fetchData()
      .catch(err => {
        this.error(err);
      });

    this.pollingInterval = this.homey.setInterval(() => { this.fetchData(); }, 420000);
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Settings were changed', changedKeys);
    
    // If username or password changed, clear cached tokens to force re-authentication
    if (changedKeys.includes('username') || changedKeys.includes('password')) {
      this.log('Credentials changed, will re-authenticate on next API call');
      // Token will be refreshed automatically on next API call due to the caching mechanism in api.js
    }
  }

  SetCapabilities() {
    if (this.hasCapability('charge_mode') === false) {
      this.log('Added charge_mode capabillity ');
      this.addCapability('charge_mode');
    }
    if (this.hasCapability('measure_isHome') === false) {
      this.log('Added measure_isHome capabillity ');
      this.addCapability('measure_isHome');
    }
    if (this.hasCapability('measure_location') === false) {
      this.log('Added measure_location capabillity ');
      this.addCapability('measure_location');
    }
    if (this.hasCapability('measure_location_latitude') === false) {
      this.log('Added measure_location_latitude capabillity ');
      this.addCapability('measure_location_latitude');
    }
    if (this.hasCapability('measure_location_longitude') === false) {
      this.log('Added measure_location_longitude capabillity ');
      this.addCapability('measure_location_longitude');
    }
    if (this.hasCapability('measure_batteryCapacity') === false) {
      this.log('Added measure_batteryCapacity capabillity ');
      this.addCapability('measure_batteryCapacity');
    }
    if (this.hasCapability('measure_batteryAvailableEnergy') === false) {
      this.log('Added measure_batteryAvailableEnergy capabillity ');
      this.addCapability('measure_batteryAvailableEnergy');
    }
    if (this.hasCapability('measure_chargingInstantaneousPower') === false) {
      this.log('Added measure_chargingInstantaneousPower capabillity ');
      this.addCapability('measure_chargingInstantaneousPower');
    }
    if (this.hasCapability('measure_gpsDirection') === false) {
      this.log('Added measure_gpsDirection capabillity ');
      this.addCapability('measure_gpsDirection');
    }
    if (this.hasCapability('measure_lastUpdateTime') === false) {
      this.log('Added measure_lastUpdateTime capabillity ');
      this.addCapability('measure_lastUpdateTime');
    }
  }

  async setLocation(result) {
    this.log('-> setLocation run');
    try {
      let lat = result.data.data.attributes.gpsLatitude;
      let lng = result.data.data.attributes.gpsLongitude;
      let direction = result.data.data.attributes.gpsDirection;
      let lastUpdate = result.data.data.attributes.lastUpdateTime;
      
      const HomeyLat = this.homey.geolocation.getLatitude();
      const HomeyLng = this.homey.geolocation.getLongitude();
      const settings = this.getSettings();
      let renaultApi = new api.RenaultApi(this.getSettings());
      const setLocation = renaultApi.calculateHome(HomeyLat, HomeyLng, lat, lng);
      
      await this.setCapabilityValue('measure_isHome', setLocation <= 1);
      await this.setCapabilityValue('measure_location', 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng);
      await this.setCapabilityValue('measure_location_latitude', String(lat));
      await this.setCapabilityValue('measure_location_longitude', String(lng));
      
      if (direction !== null && direction !== undefined) {
        await this.setCapabilityValue('measure_gpsDirection', direction);
      }
      
      if (lastUpdate) {
        await this.setCapabilityValue('measure_lastUpdateTime', lastUpdate);
      }
    } catch (error) {
      this.homey.app.log(error);
    }
  }

  async chargeModeActionRunListener(args, state) {
    this.log('-> chargeModeActionRunListener run');
    const settings = this.getSettings();
    let renaultApi = new api.RenaultApi(this.getSettings());
    renaultApi.setChargeMode(args.mode)
      .then(result => {
        this.log(result);
        this.setCapabilityValue('charge_mode', args.mode)
      });
  }

  async chargeStartActionRunListener(opts) {
    this.log('-> onCapabilityChargeButton is clicked');
      this.log('Start Charging');
        const settings = this.getSettings();
        let renaultApi = new api.RenaultApi(this.getSettings());
        renaultApi.chargingStart()
          .then(result => {
            this.log(result);
            this.setChargeStatus('on');
            this.data = this.homey.setTimeout(() => { this.setChargeStatus('off'); }, 600000);
          })
          .catch((error) => {
            this.log(error);
            this.setChargeStatus('off');
            throw new Error('An error occured when trying to start charging.', error);
          });      
    }

  async chargeStopActionRunListener(opts) {
      this.log('Stop Charging');
      const settings = this.getSettings();
      let renaultApi = new api.RenaultApi(this.getSettings());
      renaultApi.chargingStop()
        .then(result => {
          this.log(result);
          this.setChargeStatus('off');
          this.data = this.homey.setTimeout(() => { this.setChargeStatus('off'); }, 600000);
        })
        .catch((error) => {
          this.log(error);
          this.setChargeStatus('off');
          throw new Error('An error occured when trying to stop charging.', error);
        });      
  }


  async onCapabilityPicker(opts) {
    this.log('-> onCapabilityPicker is changeed');
    const settings = this.getSettings();
    let renaultApi = new api.RenaultApi(this.getSettings());
    renaultApi.setChargeMode(opts)
      .then(result => {
        this.log(result);
        this.setCapabilityValue('charge_mode', opts)
      });
  }

  async onCapabilityButton(opts) {
    this.log('-> onCapabilityButton is clicked');
    if (opts === true) {
      this.log('Start AC');
      let batterylevel = this.getCapabilityValue('measure_battery');
      if (batterylevel > 24) { // Zoe internal app can not run heater below 40 - we will be a bit nicer
        const settings = this.getSettings();
        let renaultApi = new api.RenaultApi(this.getSettings());
        renaultApi.startAC(21)
          .then(result => {
            this.log(result);
            this.setHvacStatus('on');
            this.data = this.homey.setTimeout(() => { this.setHvacStatus('off'); }, 600000);
          })
          .catch((error) => {
            this.log(error);
            this.setHvacStatus('off');
            throw new Error('An error occured when trying to start heater.', error);
          });
      }
      else {
        this.log('Battery level to low o start.');
        this.setHvacStatus('off');
        throw new Error('Your car need some more charging before using heater, not started 25% is needed).');
      }
    }
    else {
      this.log('Stop AC');
      this.setHvacStatus('on');
      throw new Error('There is no way to stop a stated heater session on current Zoe implementation.');
    }
  }

  setHvacStatus(status) {
    this.log('-> setHvacStatus');
    this.log({ 'oldValue': this.hvacState, 'newValue': status })
    this.hvacState = status;
    if (status === 'on') {
      this.setCapabilityValue('onoff', true)
    }
    else {
      this.setCapabilityValue('onoff', false)
    }
  }

  setChargeStatus(status) {
    this.log('-> setChargeStatus');
    this.log({ 'oldValue': this.chargeStart, 'newValue': status })
    this.chargeStart = status;
    if (status === 'on') {
      this.setCapabilityValue('onoff', true)
    }
    else {
      this.setCapabilityValue('onoff', false)
    }
  }

  async fetchData() {
    this.log('-> enter fetchCarData');
    let renaultApi = new api.RenaultApi(this.getSettings());
    renaultApi.getBatteryStatus()
      .then(result => {
        this.log(result);
        if (result.status == 'notSupported') {
          this.setCapabilityValue('measure_battery', 0);
          this.setCapabilityValue('measure_batteryTemperature', 0);
          this.setCapabilityValue('measure_batteryAvailableEnergy', 0);
          this.setCapabilityValue('measure_batteryCapacity', 0);
          this.setCapabilityValue('measure_batteryAutonomy', 0);
          this.setCapabilityValue('measure_plugStatus', false);
          this.setCapabilityValue('measure_chargingStatus', false);
          this.setCapabilityValue('measure_chargingRemainingTime', 0);
          this.setCapabilityValue('measure_chargingInstantaneousPower', 0);
        }
        else {
          this.setCapabilityValue('measure_battery', result.data.data.attributes["batteryLevel"] ?? 0);
          this.setCapabilityValue('measure_batteryTemperature', result.data.data.attributes["batteryTemperature"] ?? 20);
          this.setCapabilityValue('measure_batteryAvailableEnergy', result.data.data.attributes["batteryAvailableEnergy"] ?? 0);
          this.setCapabilityValue('measure_batteryCapacity', result.data.data.attributes["batteryCapacity"] ?? 0);
          this.setCapabilityValue('measure_batteryAutonomy', result.data.data.attributes["batteryAutonomy"] ?? 0);
          
          let plugStatus = false;
          if (result.data.data.attributes["plugStatus"] === 1) {
            plugStatus = true;
          }
          this.setCapabilityValue('measure_plugStatus', plugStatus);

          let chargingRemainingTime = 0;
          let chargingInstantaneousPower = 0;
          let chargingStatus = false;
          if (result.data.data.attributes["chargingStatus"] === 1) {
            chargingStatus = true;
            chargingRemainingTime = result.data.data.attributes["chargingRemainingTime"] ?? 0;
            chargingInstantaneousPower = result.data.data.attributes["chargingInstantaneousPower"] ?? 0;
            if (renaultApi.reportsChargingPowerInWatts()) {
              chargingInstantaneousPower = chargingInstantaneousPower / 1000;
            }
          }
          this.setCapabilityValue('measure_chargingStatus', chargingStatus);
          this.setCapabilityValue('measure_chargingRemainingTime', chargingRemainingTime);
          this.setCapabilityValue('measure_chargingInstantaneousPower', chargingInstantaneousPower);
        }
        renaultApi.getChargeMode()
          .then(result => {
            this.log(result);
            if (result.status == 'ok') {
              const chargeMode = result.data.data.attributes["chargeMode"] || result.data.data.attributes["mode"];
              // Support both old and new format
              if (chargeMode === 'scheduled' || chargeMode === 'schedule_mode') {
                this.setCapabilityValue('charge_mode', 'schedule_mode')
              }
              else {
                this.setCapabilityValue('charge_mode', 'always_charging')
              }
            }
          })
          .catch((error) => {
            this.log('getChargeMode error (feature may not be supported):', error.message);
          })
          .finally(() => {
            renaultApi.getCockpit()
              .then(result => {
                this.log(result);
                if (result.status == 'ok') {
                  this.setCapabilityValue('measure_totalMileage', result.data.data.attributes["totalMileage"] ?? 0);
                  if (renaultApi.supportFuelStatus() == true) {
                    this.setCapabilityValue('measure_batteryAutonomy', result.data.data.attributes["fuelAutonomy"] ?? 0);
                  }
                }
                renaultApi.getACStatus()
                  .then(result => {
                    this.log(result);
                    if (result.status == 'ok') {
                      this.setHvacStatus(result.data.hvacStatus);
                    }
                    renaultApi.getLocation()
                      .then(result => {
                        this.log(result);
                        if (result.status == 'ok') {
                          this.setLocation(result);
                        }
                      })
                      .catch((error) => {
                        this.log(error);
                      });
                  })
                  .catch((error) => {
                    this.log(error);
                  });
              })
              .catch((error) => {
                this.log(error);
              });
          });
      })
      .catch((error) => {
        this.log(error);
      });
  }

  async onAdded() {
    this.log('MyDevice has been added');
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Device settings changed:', changedKeys);
    // Note: Account credentials are managed in App Settings
  }

  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  async onDeleted() {
    this.log('MyDevice has been deleted');
    clearInterval(this.pollingInterval);
  }
}