import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/shared/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PublicReviewPage from './pages/PublicReviewPage';
import NetworkPage from './pages/NetworkPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagesPage from './pages/MessagesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TestFetchPage from './pages/TestFetchPage';
import CounterComponent from './pages/CounterComponent';
import HomePage from './pages/LandingPage'; // Add this import


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

                        {/* NEW ROUTES - Add these */}
                        <Route path="/profile/:userId" element={
                            <PrivateRoute>
                                <PublicProfilePage />
                            </PrivateRoute>
                        } />

                        <Route path="/messages/:userId" element={
                            <PrivateRoute>
                                <MessagesPage />
                            </PrivateRoute>
                        } />
                        

                        // Add to Routes:
                        <Route path="/analytics" element={
                        <PrivateRoute>
                            <AnalyticsPage />
                        </PrivateRoute>
                        } />

                    
                        // Add this route:
                        <Route path="/test" element={
                        <PrivateRoute>
                            <TestFetchPage />
                        </PrivateRoute>
                        } />


                        // Add this route:
                        <Route path="/counting" element={
                        <PrivateRoute>
                            <CounterComponent />
                        </PrivateRoute>
                        } />

                        // Add this route:
                        <Route path="/landing" element={
                        <PrivateRoute>
                            <HomePage />
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