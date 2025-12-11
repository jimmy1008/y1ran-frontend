import { useState } from 'react';
import { apiFetch } from './api/client';

export default function App() {
  const [mode, setMode] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Loading...");

    try {
      const res = await apiFetch(`/auth/${mode}`, {
        method: 'POST',
        body: { email, password },
      });

      setToken(res.token);
      setUser(res.user || null);
      setStatus(`${mode} success`);

    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  }

  async function loadMe() {
    try {
      const res = await apiFetch('/me', { token });
      setUser(res.user);
      setStatus('Loaded /me');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Auth Test Panel</h1>

      <p>API Base: {import.meta.env.VITE_API_BASE_URL}</p>

      <div>
        <button onClick={() => setMode('register')}>Register</button>
        <button onClick={() => setMode('login')}>Login</button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />

        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />

        <button type="submit">{mode.toUpperCase()}</button>
      </form>

      <hr />

      <button onClick={loadMe} disabled={!token}>
        Get /me
      </button>

      <pre>{JSON.stringify({ token, user, status }, null, 2)}</pre>
    </div>
  );
}
