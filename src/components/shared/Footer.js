import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="logo">
                    <i className="fas fa-graduation-cap"></i>
                    <span>Scholaria</span>
                </div>
                <div className="footer-links">
                    <Link to="/about">About</Link>
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms">Terms</Link>
                    <Link to="/contact">Contact</Link>
                    <Link to="/help">Help</Link>
                </div>
                <div className="copyright">© {currentYear} Scholaria. All rights reserved.</div>
            </div>
        </footer>
    );
};

export default Footer;