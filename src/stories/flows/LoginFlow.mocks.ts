// LoginFlow — MSW Handlers
import { http, HttpResponse } from 'msw';

const loginFormSuccess = http.post('/api/auth/login', () => {
  return HttpResponse.json({
  "token": "jwt_abc123",
  "user": {
    "id": "u_1",
    "email": "alex@example.com",
    "name": "Alex Smith",
    "avatar": "https://i.pravatar.cc/150?u=alex"
  }
});
});

const loginFormError = http.post('/api/auth/login', () => {
  return HttpResponse.json({
  "code": "invalid_credentials",
  "message": "Invalid email or password. Please try again."
}, { status: 500 });
});

export const handlers = {
  success: [
    loginFormSuccess,
  ],
  error: [
    loginFormError,
  ],
  empty: [
  ],
};