import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/shared/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PublicReviewPage from './pages/PublicReviewPage'; // Added import
import NetworkPage from './pages/NetworkPage-BACKUP';
import './styles/globals.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        
                        <Route path="/dashboard" element={
                            <PrivateRoute>
                                <DashboardPage />
                            </PrivateRoute>
                        } />
                        
                        {/* ADD THIS ROUTE */}
                        <Route path="/publicreview" element={
                            <PrivateRoute>
                                <PublicReviewPage />
                            </PrivateRoute>
                        } />

                        <Route path="/network" element={
                            <PrivateRoute>
                                <NetworkPage />
                        </PrivateRoute>
                        } />
                        
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;