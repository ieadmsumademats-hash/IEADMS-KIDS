
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_CREDENTIALS, ICONS } from '../constants';

interface LoginProps {
  onLogin: (success: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      onLogin(true);
      navigate('/');
    } else {
      setError('Credenciais incorretas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-purple-dark flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-main/20 via-purple-dark to-purple-dark">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 md:p-14 border-b-8 border-yellow-main">
          <div className="text-center mb-12">
            <div className="bg-purple-main inline-block p-5 rounded-3xl shadow-xl mb-6 transform hover:rotate-6 transition-transform">
              <img src="https://api.dicebear.com/7.x/shapes/svg?seed=ieadms" alt="Logo" className="w-20 h-20" />
            </div>
            <h1 className="kids-font text-4xl font-bold text-purple-dark mb-2">IEADMS Kids</h1>
            <p className="text-gray-text font-bold uppercase tracking-widest text-xs">Administração</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-2 px-1">E-mail de Acesso</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-main group-focus-within:text-yellow-main transition-colors">
                  {ICONS.Users}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none px-14 py-5 rounded-3xl transition-all font-bold"
                  placeholder="exemplo@ieadms.com.br"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-text uppercase tracking-widest mb-2 px-1">Senha</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-main group-focus-within:text-yellow-main transition-colors">
                  {ICONS.Key}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-light border-2 border-transparent focus:border-purple-main outline-none px-14 py-5 rounded-3xl transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-black text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-purple-main hover:bg-purple-dark text-white font-black py-5 rounded-3xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              ENTRAR NO PAINEL
              {ICONS.ChevronRight}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
          <button 
            onClick={() => navigate('/pais')}
            className="text-white/60 hover:text-white font-bold transition-colors underline decoration-yellow-main/40 underline-offset-4"
          >
            Voltar para Área dos Pais
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
