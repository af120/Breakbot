import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Scissors } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="text-center mb-4">
          <Scissors size={48} className="text-primary mx-auto mb-2" />
          <h2>BarberManager</h2>
          <p className="text-muted">Sign in to your account</p>
        </div>
        {error && <div className="badge badge-danger w-full text-center mb-3 p-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">Sign In</button>
        </form>
      </div>
    </div>
  );
}
