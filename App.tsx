
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CultoIniciar from './pages/CultoIniciar';
import CultoAtivo from './pages/CultoAtivo';
import CultosLista from './pages/CultosLista';
import CriancasLista from './pages/CriancasLista';
import Estatisticas from './pages/Estatisticas';
import PaisArea from './pages/PaisArea';
import PreCheckin from './pages/PreCheckin';
import { storageService } from './services/storageService';

const PrivateRoute: React.FC<{ children: React.ReactNode; isAdmin: boolean }> = ({ children, isAdmin }) => {
  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('ieadms_v2_auth') === 'true';
  });

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      localStorage.setItem('ieadms_v2_auth', 'true');
    }
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      setIsAdmin(false);
      localStorage.removeItem('ieadms_v2_auth');
    }
  };

  return (
    <Router>
      <Layout isAdmin={isAdmin} onLogout={handleLogout}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/pais" element={<PaisArea />} />
          <Route path="/pais/pre-checkin" element={<PreCheckin />} />
          <Route path="/pais/cadastro" element={<CriancasLista />} /> {/* Reaproveitando o CRM para cadastro público */}

          {/* Rotas Administrativas */}
          <Route path="/" element={<PrivateRoute isAdmin={isAdmin}><Dashboard /></PrivateRoute>} />
          <Route path="/cultos" element={<PrivateRoute isAdmin={isAdmin}><CultosLista /></PrivateRoute>} />
          <Route path="/cultos/iniciar" element={<PrivateRoute isAdmin={isAdmin}><CultoIniciar /></PrivateRoute>} />
          <Route path="/cultos/ativo/:id" element={<PrivateRoute isAdmin={isAdmin}><CultoAtivo /></PrivateRoute>} />
          <Route path="/criancas" element={<PrivateRoute isAdmin={isAdmin}><CriancasLista /></PrivateRoute>} />
          <Route path="/estatisticas" element={<PrivateRoute isAdmin={isAdmin}><Estatisticas /></PrivateRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to={isAdmin ? "/" : "/pais"} />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
