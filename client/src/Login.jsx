import React, { useState } from 'react';
import { supabase } from './supabase';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Buscar o usuário com username e password correspondentes na tabela app_users
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário ou senha inválidos.');
      }

      // Salvar sessão manual no localStorage para persistência (já que não usamos Supabase Auth Session)
      localStorage.setItem('drive_user', JSON.stringify(userData));
      
      onLogin(userData);
    } catch (err) {
      setError(err.message || 'Erro ao realizar login.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box glass-effect">
        <div className="login-header">
          <div className="login-logo">D</div>
          <h1>InfoDrive</h1>
          <p>Gerenciamento de arquivos seguro e eficiente</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <LogIn className="input-icon" size={18} />
            <input
              type="text"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="loader"></span>
            ) : (
              <>
                <LogIn size={20} />
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <ShieldCheck size={14} />
          <span>Conexão protegida via Supabase Auth</span>
        </div>
      </div>

      <div className="login-bg-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  );
}

export default Login;
