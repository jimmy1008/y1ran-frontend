// src/api/auth.js
import { apiFetch } from './client';

// 註冊
export async function register(email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

// 登入
export async function login(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// 取得 /me
export async function getMe(token) {
  return apiFetch('/me', {
    method: 'GET',
    token,
  });
}
