/**
 * Unit tests for RenaultApiClient
 * Tests authentication, token caching, and API calls
 */

import { RenaultApiClient } from '../renault-api-client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RenaultApiClient', () => {
  let client: RenaultApiClient;
  const mockCredentials = {
    username: 'test@example.com',
    password: 'testpassword',
    accountId: 'test-account-123',
    vin: 'VF1AG000164767503',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup axios mock
    mockedAxios.create = jest.fn().mockReturnValue(mockedAxios as any);
    mockedAxios.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    } as any;

    client = new RenaultApiClient(mockCredentials, 'sv-SE');
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      // Mock Gigya login response
      mockedAxios.post = jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            statusCode: 200,
            sessionInfo: {
              cookieValue: 'test-login-token',
            },
          },
        })
        // Mock JWT response
        .mockResolvedValueOnce({
          data: {
            statusCode: 200,
            id_token: 'test-jwt-token',
          },
        });

      const token = await (client as any).getIdToken();

      expect(token).toBe('test-jwt-token');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should cache JWT token', async () => {
      // Mock first authentication
      mockedAxios.post = jest
        .fn()
        .mockResolvedValueOnce({
          data: {
            statusCode: 200,
            sessionInfo: { cookieValue: 'test-token' },
          },
        })
        .mockResolvedValueOnce({
          data: {
            statusCode: 200,
            id_token: 'test-jwt',
          },
        });

      // First call - should authenticate
      await (client as any).getIdToken();

      // Second call - should use cached token
      const cachedToken = await (client as any).getIdToken();

      expect(cachedToken).toBe('test-jwt');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Only initial auth
    });

    it('should handle authentication failure', async () => {
      mockedAxios.post = jest.fn().mockResolvedValueOnce({
        data: {
          statusCode: 403,
          statusReason: 'Invalid credentials',
        },
      });

      await expect((client as any).gigyaLogin()).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Vehicle Data', () => {
    beforeEach(() => {
      // Mock authentication for vehicle data tests
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          statusCode: 200,
          sessionInfo: { cookieValue: 'token' },
          id_token: 'jwt-token',
        },
      });

      // Set vehicle
      client.setVehicle('VF1AG000164767503', 'X102VE');
    });

    it('should get battery status', async () => {
      const mockBatteryData = {
        data: {
          type: 'Car',
          id: 'VF1AG000164767503',
          attributes: {
            timestamp: '2026-02-06T12:00:00Z',
            batteryLevel: 75,
            batteryAutonomy: 250,
            batteryAvailableEnergy: 45,
            plugStatus: 0,
            chargingStatus: 0,
          },
        },
      };

      mockedAxios.get = jest.fn().mockResolvedValueOnce({
        data: mockBatteryData,
      });

      const result = await client.getBatteryStatus();

      expect(result.status).toBe('ok');
      expect(result.data?.data.attributes.batteryLevel).toBe(75);
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should return notSupported for unsupported features', async () => {
      // Set vehicle with no capabilities
      client.setVehicle('TEST123', 'XJA1VP'); // Kangoo EV - no battery support

      const result = await client.getBatteryStatus();

      expect(result.status).toBe('notSupported');
      expect(result.data).toBeNull();
    });

    it('should get charge mode with fallback on 400/404 errors', async () => {
      // Mock axios.isAxiosError to recognize our error objects
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // First call fails with 404 (charging-settings not available)
      // Second call succeeds (charge-mode endpoint)
      const axiosError404 = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { error: 'Not found' },
        },
      };

      mockedAxios.get = jest
        .fn()
        .mockRejectedValueOnce(axiosError404)
        .mockResolvedValueOnce({
          data: {
            data: {
              type: 'Car',
              id: 'VF1AG000164767503',
              attributes: {
                chargeMode: 'always_charging',
              },
            },
          },
        });

      const result = await client.getChargeMode();

      expect(result.status).toBe('ok');
      expect(result.data?.data.attributes.chargeMode).toBeTruthy();
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // charging-settings + charge-mode
    });

    it('should NOT fallback on 502 server errors', async () => {
      // Mock axios.isAxiosError to recognize our error objects
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // 502 errors should be returned as errors, not trigger fallback
      const axiosError502 = {
        isAxiosError: true,
        response: {
          status: 502,
          data: {
            type: 'TECHNICAL',
            errors: [{ errorCode: '502000', errorMessage: 'something went wrong' }],
          },
        },
      };

      mockedAxios.get = jest.fn().mockRejectedValueOnce(axiosError502);

      const result = await client.getChargeMode();

      expect(result.status).toBe('error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only charging-settings, no fallback
    });

    it('should handle API errors gracefully', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            type: 'FUNCTIONAL',
            message: 'Not supported',
          },
        },
        isAxiosError: true,
        message: 'Request failed',
      };

      // Spy on axios.isAxiosError to return true for our mock error
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      mockedAxios.get = jest.fn().mockRejectedValueOnce(axiosError);

      const result = await client.getBatteryStatus();

      expect(result.status).toBe('notSupported');
      expect(result.error).toContain('not supported');
    });
  });

  describe('Vehicle Actions', () => {
    beforeEach(() => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          statusCode: 200,
          sessionInfo: { cookieValue: 'token' },
          id_token: 'jwt-token',
        },
      });

      client.setVehicle('VF1AG000164767503', 'X102VE');
    });

    it('should set charge mode', async () => {
      // Mock getIdToken flow: gigyaLogin -> gigyaGetJWT -> setChargeMode action
      mockedAxios.post = jest
        .fn()
        // First call: gigyaLogin
        .mockResolvedValueOnce({
          data: {
            statusCode: 200,
            sessionInfo: { cookieValue: 'gigya-session-token' },
          },
        })
        // Second call: gigyaGetJWT
        .mockResolvedValueOnce({
          data: {
            statusCode: 200,
            id_token: 'jwt-token-123',
          },
        })
        // Third call: setChargeMode action
        .mockResolvedValueOnce({
          data: {
            data: {
              type: 'ChargeMode',
              id: 'action-123',
              attributes: { action: 'setChargeMode' },
            },
          },
        });

      const result = await client.setChargeMode('always_charging');

      expect(result.status).toBe('ok');
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should start HVAC', async () => {
      // X102VE (Zoe Phase 2) does not support HVAC (supportsHvacStatus: false)
      const result = await client.startHvac(22);

      // Should return notSupported since X102VE doesn't support HVAC
      expect(result.status).toBe('notSupported');
      expect(result.error).toContain('not supported');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should pause and resume charging', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { success: true },
      });

      await client.pauseCharging();
      await client.resumeCharging();

      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration', () => {
    it('should load correct configuration for locale', () => {
      const clientSE = new RenaultApiClient(mockCredentials, 'sv-SE');
      expect((clientSE as any).config.countryCode).toBe('SE');

      const clientNO = new RenaultApiClient(mockCredentials, 'nb-NO');
      expect((clientNO as any).config.countryCode).toBe('NO');
    });

    it('should throw error for unsupported locale', () => {
      expect(() => {
        new RenaultApiClient(mockCredentials, 'xx-XX');
      }).toThrow('No configuration found');
    });

    it('should detect model capabilities', () => {
      client.setVehicle('TEST', 'X101VE'); // Zoe Phase 1
      expect((client as any).capabilities.reportsChargingPowerInWatts).toBe(true);

      client.setVehicle('TEST', 'X102VE'); // Zoe Phase 2
      expect((client as any).capabilities.reportsChargingPowerInWatts).toBe(false);
    });
  });
});
