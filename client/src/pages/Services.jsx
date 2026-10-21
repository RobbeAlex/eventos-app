import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

const Services = () => {
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', descripcion: '', categoria: 'Lugar', precio: '' });
  const [editingId, setEditingId] = useState(null);

  const categorias = ['Lugar', 'Comida', 'Entretenimiento', 'Extras'];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/services', { headers: { Authorization: `Bearer ${token}` } });
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingId) {
        await axios.put(`/api/services/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/services', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsModalOpen(false);
      setFormData({ id: null, nombre: '', descripcion: '', categoria: 'Lugar', precio: '' });
      setEditingId(null);
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (service) => {
    setFormData(service);
    setEditingId(service.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if(window.confirm('¿Eliminar este servicio? Podría estar vinculado a eventos pasados.')){
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`/api/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchServices();
      } catch (err) {
        alert('Error al eliminar: ' + err.response?.data?.error || err.message);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Catálogo de Servicios</h1>
        <button className="btn btn-primary" onClick={() => { setFormData({ id: null, nombre: '', descripcion: '', categoria: 'Lugar', precio: '' }); setEditingId(null); setIsModalOpen(true); }}>
          <Plus size={20} /> Nuevo Servicio
        </button>
      </div>

      {categorias.map(cat => (
        <div key={cat} style={{ marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            <Tag size={20} className="text-primary" /> {cat}
          </h2>
          <div className="glass" style={{ padding: '1rem', overflowX: 'auto', marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio Unitario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.filter(s => s.categoria === cat).map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.nombre}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.descripcion}</td>
                    <td>${s.precio}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => handleEdit(s)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(s.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {services.filter(s => s.categoria === cat).length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay servicios en esta categoría</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
              <button className="btn" onClick={() => setIsModalOpen(false)}>X</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  value={formData.categoria} 
                  onChange={e => setFormData({...formData, categoria: e.target.value})} 
                  required
                >
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Nombre del Servicio</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  required 
                  placeholder={formData.categoria === 'Lugar' ? "Ej. Salón Jardín Principal" : "Ej. Menú 3 Tiempos Infantil"}
                />
              </div>

              <div className="form-group">
                <label>Precio Unitario</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.precio} 
                  onChange={e => setFormData({...formData, precio: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Descripción / Qué incluye</label>
                <textarea 
                  rows="3"
                  value={formData.descripcion} 
                  onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
