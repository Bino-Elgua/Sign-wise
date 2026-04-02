
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import UploadArea from './components/UploadArea';
import Dashboard from './components/Dashboard';
import ContractCreator from './components/ContractCreator';
import Settings from './components/Settings';
import { Login } from './src/components/auth/Login';
import { Register } from './src/components/auth/Register';
import { ForgotPassword } from './src/components/auth/ForgotPassword';
import { ProtectedRoute } from './src/components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <UploadArea onUpload={() => {}} />
            </ProtectedRoute>
          } 
        />
        {/* Add other routes here */}
      </Routes>
    </Layout>
  );
};

export default App;
