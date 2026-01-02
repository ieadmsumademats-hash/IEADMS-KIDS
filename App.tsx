
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CultoIniciar from './pages/CultoIniciar';
import CultoAtivo from './pages/CultoAtivo';
import CultosLista from './pages/CultosLista';
import CriancasLista from './pages/CriancasLista';
import CriancaCadastro from './pages/CriancaCadastro';
import Estatisticas from './pages/Estatisticas';
import PaisArea from './pages/PaisArea';
import PreCheckin from './pages/PreCheckin';

const PrivateRoute: React.FC<{ children: React.ReactNode; isAdmin: boolean }> = ({ children, isAdmin }) => {
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ieadms_v2_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      localStorage.setItem('ieadms_v2_auth', 'true');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      setIsAdmin(false);
      localStorage.removeItem('ieadms_v2_auth');
    }
  };

  return (
    <Router>
      <Layout isAdmin={isAdmin} onLogout={handleLogout}>
        <Routes>
          {/* Rotas Públicas (Pais) */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/pais" element={<PaisArea />} />
          <Route path="/pais/pre-checkin" element={<PreCheckin />} />
          <Route path="/pais/cadastro" element={<CriancaCadastro />} />

          {/* Rotas Administrativas */}
          <Route path="/" element={<PrivateRoute isAdmin={isAdmin}><Dashboard /></PrivateRoute>} />
          <Route path="/cultos" element={<PrivateRoute isAdmin={isAdmin}><CultosLista /></PrivateRoute>} />
          <Route path="/cultos/iniciar" element={<PrivateRoute isAdmin={isAdmin}><CultoIniciar /></PrivateRoute>} />
          <Route path="/cultos/ativo/:id" element={<PrivateRoute isAdmin={isAdmin}><CultoAtivo /></PrivateRoute>} />
          <Route path="/criancas" element={<PrivateRoute isAdmin={isAdmin}><CriancasLista /></PrivateRoute>} />
          <Route path="/estatisticas" element={<PrivateRoute isAdmin={isAdmin}><Estatisticas /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to={isAdmin ? "/" : "/pais"} replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
