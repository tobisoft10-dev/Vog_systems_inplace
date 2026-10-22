import { describe, it, expect } from 'vitest';

describe('Authentication API Integration Tests', () => {
  it('should fail login with invalid credentials', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'wronguser',
        password: 'wrongpassword',
        database_name: 'vog_db'
      })
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('should succeed login with valid credentials and return a valid JWT token', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Vog2026!Premium',
        database_name: 'vog_db'
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    // Verify it is a JWT token (composed of three base64 parts separated by dots)
    expect(data.token.split('.').length).toBe(3);
  });
});
