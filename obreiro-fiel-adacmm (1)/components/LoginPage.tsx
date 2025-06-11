
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // For HashRouter
import { AppContext } from '../App';
import { User, UserAccessLevel } from '../types';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const context = useContext(AppContext);
  const navigate = useNavigate(); // For HashRouter

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (context?.currentUser) {
      navigate('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.currentUser, navigate]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock authentication
    // Admin User: Linked to Worker 'w1' (Pastor João Silva)
    if (username === 'Altar em Chamas' && password === 'Adacmm2020') {
      const user: User = { 
        id: 'userAdmin001', 
        username: 'Altar em Chamas', 
        accessLevel: UserAccessLevel.Admin,
        workerId: 'w1' // Pastor João Silva
      };
      context?.setCurrentUser(user);
      navigate('/dashboard'); 
    } 
    // Obreiro User: Linked to Worker 'w2' (Diácono Carlos Lima)
    else if (username === 'carloslima' && password === 'obreiro123') {
      const user: User = { 
        id: 'userObreiro001', 
        username: 'carloslima', 
        accessLevel: UserAccessLevel.Obreiro,
        workerId: 'w2' // Diácono Carlos Lima
      };
      context?.setCurrentUser(user);
      navigate('/dashboard');
    } 
    // Example Obreiro User: Linked to Worker 'w3' (Missionária Ana Costa)
     else if (username === 'anacosta' && password === 'obreiro456') {
      const user: User = { 
        id: 'userObreiro002', 
        username: 'anacosta', 
        accessLevel: UserAccessLevel.Obreiro,
        workerId: 'w3' // Missionária Ana Costa
      };
      context?.setCurrentUser(user);
      navigate('/dashboard');
    }
    else {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-700 to-slate-900 p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <h1 className="text-4xl font-bold text-center text-sky-600 mb-8">Obreiro Fiel ADACMM</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
              required
              placeholder="Nome de usuário"
              aria-label="Nome de usuário"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow"
              required
              placeholder="Senha"
              aria-label="Senha"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md animate-pulse">{error}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
          >
            Entrar
          </button>
        </form>
        {/* Removed credentials hint */}
      </div>
    </div>
  );
};

export default LoginPage;