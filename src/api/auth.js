// frontend/src/api/auth.js
import api from './client';

export function register(email, password) {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email, password) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token) {
  return api('/me', {
    method: 'GET',
    headers: {
      Authorization: Bearer ,
    },
  });
}
