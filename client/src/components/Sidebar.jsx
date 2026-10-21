import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, CalendarDays, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Logo" style={{ maxHeight: '45px', width: 'auto' }} />
      </div>
      
      <nav style={{ flex: 1 }}>
        <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/clients" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Clientes
        </NavLink>
        <NavLink to="/services" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <MapPin size={20} /> Servicios
        </NavLink>
        <NavLink to="/events" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <CalendarDays size={20} /> Eventos
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Usuario: {user?.username}
        </p>
        <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}>
          <LogOut size={16} /> Salir
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
