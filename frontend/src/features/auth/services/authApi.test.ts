import { describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../../../lib/api.ts';
import { login } from './authApi.ts';

vi.mock('../../../lib/api.ts', () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

describe('authApi', () => {
  it('appelle la route de connexion sans authentification préalable', async () => {
    mockedApiRequest.mockResolvedValue({ token: 'jwt-token' });

    await expect(login({ email: 'user@example.com', password: 'secret' })).resolves.toEqual({ token: 'jwt-token' });

    expect(mockedApiRequest).toHaveBeenCalledWith('/login', {
      method: 'POST',
      body: { email: 'user@example.com', password: 'secret' },
      auth: false,
    });
  });
});
