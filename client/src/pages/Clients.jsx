import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', empresa: '', telefono: '', email: '', evento_interes: '', comentarios: '' });

  const fetchClients = async () => {
    const res = await axios.get('/api/clients');
    setClients(res.data);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.id) {
      await axios.put(`/api/clients/${formData.id}`, formData);
    } else {
      await axios.post('/api/clients', formData);
    }
    setIsModalOpen(false);
    fetchClients();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar cliente?')) {
      await axios.delete(`/api/clients/${id}`);
      fetchClients();
    }
  };

  const openModal = (client = null) => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({ id: null, nombre: '', empresa: '', telefono: '', email: '', evento_interes: '', comentarios: '' });
    }
    setIsModalOpen(true);
  };

  const openViewModal = (client) => {
    setFormData(client);
    setIsViewModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} /> Nuevo Cliente</button>
      </div>

      <div className="glass" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Evento de Interés</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.empresa}</td>
                <td>{c.telefono}</td>
                <td>{c.email}</td>
                <td>{c.evento_interes}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary-color)' }} onClick={() => openViewModal(c)} title="Ver Información"><Eye size={16} /></button>
                  <button className="btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => openModal(c)} title="Editar"><Edit size={16} /></button>
                  <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(c.id)} title="Eliminar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Empresa</label>
                <input type="text" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Evento de Interés</label>
                <input type="text" value={formData.evento_interes} onChange={e => setFormData({...formData, evento_interes: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Comentarios</label>
                <textarea rows="3" value={formData.comentarios} onChange={e => setFormData({...formData, comentarios: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>Información del Cliente</h2>
              <button className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }} onClick={() => setIsViewModalOpen(false)}>✕</button>
            </div>
            <div>
              <p><strong>Nombre:</strong> {formData.nombre}</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Empresa:</strong> {formData.empresa}</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Teléfono:</strong> {formData.telefono}</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Email:</strong> {formData.email}</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Evento de Interés:</strong> {formData.evento_interes}</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Comentarios:</strong> {formData.comentarios}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setIsViewModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
