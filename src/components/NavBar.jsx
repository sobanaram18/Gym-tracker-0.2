import { NavLink } from 'react-router-dom';
import './NavBar.css';

const navItems = [
    { to: '/', icon: '🏠', label: 'Home' },
    { to: '/today', icon: '🏋️', label: 'Today' },
    { to: '/muscle-groups', icon: '💪', label: 'Groups' },
    { to: '/schedule', icon: '📅', label: 'Schedule' },
];

export default function NavBar() {
    return (
        <nav className="navbar" id="main-navigation">
            {navItems.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                        `navbar-item ${isActive ? 'navbar-item--active' : ''}`
                    }
                    id={`nav-${item.label.toLowerCase()}`}
                >
                    <span className="navbar-icon">{item.icon}</span>
                    <span className="navbar-label">{item.label}</span>
                    <div className="navbar-indicator" />
                </NavLink>
            ))}
        </nav>
    );
}
