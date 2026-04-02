
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import UploadArea from './components/UploadArea';
import DocumentUpload from './components/DocumentUpload';
import AnalysisPage from './components/AnalysisPage';
import Dashboard from './components/Dashboard';
import ContractCreator from './components/ContractCreator';
import Settings from './components/Settings';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
              <DocumentUpload />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <DocumentUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyze/:docId"
          element={
            <ProtectedRoute>
              <AnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy"
          element={
            <ProtectedRoute>
              <UploadArea onUpload={() => {}} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
};

export default App;
