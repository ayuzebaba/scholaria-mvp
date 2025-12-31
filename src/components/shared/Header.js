import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
            const name = user.user_metadata.full_name || user.user_metadata.name;
            const names = name.split(' ');
            if (names.length >= 2) {
                return (names[0][0] + names[1][0]).toUpperCase();
            }
            return names[0].substring(0, 2).toUpperCase();
        }
        return user?.email?.substring(0, 2).toUpperCase() || 'U';
    };

    // Get user display name
    const getUserDisplayName = () => {
        return user?.user_metadata?.full_name || 
               user?.user_metadata?.name || 
               user?.email?.split('@')[0] || 
               'Scholar';
    };

    return (
        <header>
            <div className="container header-content">
                {/* Logo on the left */}
                <div className="logo">
                    <i className="fas fa-graduation-cap"></i>
                    <span>Scholaria</span>
                </div>
                
                {/* Navigation in the center */}
                <div className="nav-section">
                    <nav className="main-nav">
                        <Link to="/dashboard" className="nav-item active">
                            <i className="fas fa-home"></i>
                            Dashboard
                        </Link>
                        <Link to="/research" className="nav-item">
                            <i className="fas fa-book"></i>
                            Research
                        </Link>
                        <Link to="/network" className="nav-item">
                            <i className="fas fa-network-wired"></i>
                            Network
                        </Link>
                        <Link to="/analytics" className="nav-item">
                            <i className="fas fa-chart-bar"></i>
                            Analytics
                        </Link>
                    </nav>
                </div>
                
                {/* User menu on the far right */}
                <div className="user-menu">
                    <div className="user-avatar">
                        {getInitials()}
                    </div>
                    <span className="user-name">
                        {getUserDisplayName()}
                    </span>
                    <a href="#" className="user-menu-logout" onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                    }}>
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </a>
                </div>
            </div>
        </header>
    );
};

export default Header;