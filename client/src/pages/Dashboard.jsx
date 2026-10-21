import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, MapPin, CalendarDays } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, services: 0, events: 0 });
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [resClients, resServices, resEvents] = await Promise.all([
          axios.get('/api/clients', { headers }),
          axios.get('/api/services', { headers }),
          axios.get('/api/events', { headers })
        ]);
        
        setStats({
          clients: resClients.data.length,
          services: resServices.data.length,
          events: resEvents.data.length
        });
        
        setRecentEvents(resEvents.data.slice(-5).reverse());
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="card-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card glass">
          <div className="stat-icon"><Users /></div>
          <div className="stat-info">
            <h3>Total Clientes</h3>
            <p>{stats.clients}</p>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon"><MapPin /></div>
          <div className="stat-info">
            <h3>Servicios en Catálogo</h3>
            <p>{stats.services}</p>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon"><CalendarDays /></div>
          <div className="stat-info">
            <h3>Eventos Programados</h3>
            <p>{stats.events}</p>
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2>Próximos Eventos</h2>
        {recentEvents.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No hay eventos programados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Cliente</th>
                <th>Costo Estimado</th>
                <th>Fecha Inicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.titulo}</td>
                  <td>{ev.cliente_nombre}</td>
                  <td style={{ color: 'var(--success-color)', fontWeight: 500 }}>${ev.precio_total}</td>
                  <td>{new Date(ev.fecha_hora_inicio).toLocaleString()}</td>
                  <td><span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', fontSize: '0.875rem' }}>{ev.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
