import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, ShoppingCart, List, Tag, FileText, Loader } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  
  const [formData, setFormData] = useState({ 
    id: null, 
    titulo: '', 
    fecha_hora_inicio: '', 
    fecha_hora_fin: '', 
    cliente_id: '', 
    estado: 'agendado',
    carrito: []
  });
  
  const [serviceToAdd, setServiceToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchClients();
    fetchServices();
  }, []);

  useEffect(() => {
    const total = formData.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    setTotalPrice(total);
  }, [formData.carrito]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/events', { headers: { Authorization: `Bearer ${token}` } });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/services', { headers: { Authorization: `Bearer ${token}` } });
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServiceToCart = () => {
    if (!serviceToAdd) return;
    const s = services.find(srv => srv.id.toString() === serviceToAdd.toString());
    if (!s) return;
    
    const qty = parseInt(quantityToAdd) || 1;
    
    // Check if already in cart
    const existing = formData.carrito.find(item => item.id === s.id);
    if (existing) {
      setFormData({
        ...formData,
        carrito: formData.carrito.map(item => 
          item.id === s.id ? { ...item, cantidad: item.cantidad + qty } : item
        )
      });
    } else {
      setFormData({
        ...formData,
        carrito: [...formData.carrito, { id: s.id, nombre: s.nombre, categoria: s.categoria, precio: s.precio, cantidad: qty }]
      });
    }
    
    setServiceToAdd('');
    setQuantityToAdd(1);
  };

  const handleRemoveFromCart = (serviceId) => {
    setFormData({
      ...formData,
      carrito: formData.carrito.filter(item => item.id !== serviceId)
    });
  };

  const handleEdit = (evento) => {
    const formattedCart = evento.carrito.map(item => ({
      id: item.id,
      nombre: item.nombre,
      categoria: item.categoria,
      cantidad: item.cantidad,
      precio: item.precio_unitario
    }));

    setFormData({
      id: evento.id,
      titulo: evento.titulo,
      fecha_hora_inicio: evento.fecha_hora_inicio,
      fecha_hora_fin: evento.fecha_hora_fin,
      cliente_id: evento.cliente_id,
      estado: evento.estado,
      carrito: formattedCart
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.carrito.length === 0) {
      alert("Debes agregar al menos un servicio al evento.");
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      if (formData.id) {
        await axios.put(`/api/events/${formData.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/events', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      setIsModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const resetForm = () => {
    setFormData({ 
      id: null, titulo: '', fecha_hora_inicio: '', fecha_hora_fin: '', 
      cliente_id: '', estado: 'agendado', carrito: [] 
    });
    setServiceToAdd('');
    setQuantityToAdd(1);
  };

  const handleDelete = async (id) => {
    if(window.confirm('¿Seguro que deseas eliminar este evento?')){
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchEvents();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };
  
  const handleToggleEstado = async (evento) => {
    const estados = ['agendado', 'confirmado', 'liquidado'];
    const nextIndex = (estados.indexOf(evento.estado) + 1) % estados.length;
    const nextEstado = estados[nextIndex];
    
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/events/${evento.id}`, { estado: nextEstado }, { headers: { Authorization: `Bearer ${token}` } });
      fetchEvents();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const openDetails = (ev) => {
    setSelectedEventDetails(ev);
    setIsDetailModalOpen(true);
  };

  const generatePDF = async (ev) => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('pdf-template');
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#f4f1ea'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cotizacion_${ev.titulo.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Agenda de Eventos</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={20} /> Agendar Evento
        </button>
      </div>

      <div className="glass" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Cliente</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id}>
                <td style={{ fontWeight: 500 }}>{ev.titulo}</td>
                <td>{ev.cliente_nombre}</td>
                <td>{new Date(ev.fecha_hora_inicio).toLocaleString()}</td>
                <td>{new Date(ev.fecha_hora_fin).toLocaleString()}</td>
                <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>${ev.precio_total}</td>
                <td>
                  <span 
                    onClick={() => handleToggleEstado(ev)}
                    style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      background: ev.estado === 'liquidado' ? 'rgba(16, 185, 129, 0.2)' : 
                                  ev.estado === 'confirmado' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: ev.estado === 'liquidado' ? 'var(--success-color)' : 
                             ev.estado === 'confirmado' ? 'var(--primary-color)' : '#f59e0b'
                    }}
                  >
                    {ev.estado.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => handleEdit(ev)} title="Editar Evento">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => openDetails(ev)} title="Ver Detalle">
                      <List size={16} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(ev.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Evento' : 'Nuevo Evento'}</h2>
              <button className="btn" onClick={() => setIsModalOpen(false)}>X</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Título del Evento</label>
                  <input type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required placeholder="Ej. Boda Civil de Carlos" />
                </div>
                
                <div className="form-group">
                  <label>Cliente</label>
                  <select value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})} required>
                    <option value="">-- Seleccionar Cliente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Inicio</label>
                  <input type="datetime-local" value={formData.fecha_hora_inicio} onChange={e => setFormData({...formData, fecha_hora_inicio: e.target.value})} required />
                </div>

                <div className="form-group">
                  <label>Fin</label>
                  <input type="datetime-local" value={formData.fecha_hora_fin} onChange={e => setFormData({...formData, fecha_hora_fin: e.target.value})} required />
                </div>
              </div>

              {/* SHOPPING CART UI */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <ShoppingCart size={20} /> Armar Paquete (Servicios)
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Servicio del Catálogo</label>
                    <select value={serviceToAdd} onChange={e => setServiceToAdd(e.target.value)}>
                      <option value="">-- Seleccionar --</option>
                      {['Lugar', 'Comida', 'Entretenimiento', 'Extras'].map(cat => (
                        <optgroup key={cat} label={cat}>
                          {services.filter(s => s.categoria === cat).map(s => (
                            <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Cantidad</label>
                    <input type="number" min="1" value={quantityToAdd} onChange={e => setQuantityToAdd(e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleAddServiceToCart}>
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  {formData.carrito.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>El carrito está vacío</p>
                  ) : (
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '0.5rem' }}>Servicio</th>
                          <th style={{ padding: '0.5rem' }}>Cat.</th>
                          <th style={{ padding: '0.5rem' }}>Cant.</th>
                          <th style={{ padding: '0.5rem' }}>Subtotal</th>
                          <th style={{ padding: '0.5rem' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.carrito.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '0.5rem' }}>{item.nombre}</td>
                            <td style={{ padding: '0.5rem' }}><Tag size={12}/> {item.categoria}</td>
                            <td style={{ padding: '0.5rem' }}>x{item.cantidad}</td>
                            <td style={{ padding: '0.5rem' }}>${(item.precio * item.cantidad).toFixed(2)}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} onClick={() => handleRemoveFromCart(item.id)}>
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    Total Estimado: <span style={{ color: 'var(--success-color)' }}>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}>
                Confirmar y Guardar Evento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedEventDetails && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del Evento</h2>
              <button className="btn" onClick={() => setIsDetailModalOpen(false)}>X</button>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p><strong>Título:</strong> {selectedEventDetails.titulo}</p>
                  <p><strong>Cliente:</strong> {selectedEventDetails.cliente_nombre}</p>
                  <p><strong>Estado:</strong> {selectedEventDetails.estado.toUpperCase()}</p>
                </div>
                <button className="btn btn-primary" onClick={() => generatePDF(selectedEventDetails)} disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? <Loader size={16} className="spin" /> : <FileText size={16} />} 
                  {isGeneratingPDF ? ' Generando...' : ' Descargar PDF'}
                </button>
              </div>
              <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Servicios Contratados</h3>
              <table style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Cant.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEventDetails.carrito.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.nombre} ({item.categoria})</td>
                      <td>{item.cantidad}</td>
                      <td>${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h2 style={{ textAlign: 'right', marginTop: '1rem', color: 'var(--success-color)' }}>
                Gran Total: ${selectedEventDetails.precio_total}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PDF TEMPLATE */}
      {selectedEventDetails && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="pdf-template" style={{ 
            width: '800px', 
            padding: '40px',
            background: '#f4f1ea', 
            color: '#333',
            fontFamily: 'Georgia, serif',
            position: 'relative'
          }}>
            <div style={{
              border: '2px solid #b8976b', 
              padding: '40px',
              minHeight: '1000px',
              position: 'relative'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <img src="/logo_pdf.png" alt="Escenaria Logo" style={{ height: '160px', marginBottom: '10px' }} crossOrigin="anonymous" />
              </div>

              <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'normal', marginBottom: '30px' }}>
                COTIZACIÓN DE EVENTO: {selectedEventDetails.titulo.toUpperCase()}
              </h2>

              <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                Hola <strong>{selectedEventDetails.cliente_nombre}</strong>, aquí tienes la cotización de tu evento:
              </p>

              <div style={{ textAlign: 'center', marginBottom: '30px', fontSize: '16px' }}>
                <p style={{ margin: '5px 0' }}><strong>Fecha y Hora del Evento:</strong> {new Date(selectedEventDetails.fecha_hora_inicio).toLocaleString()}</p>
                <p style={{ margin: '5px 0' }}><strong>Numero de asistentes:</strong> {Math.max(...selectedEventDetails.carrito.map(i => i.cantidad), 1)}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', backgroundColor: '#fff' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #b8976b', borderTop: '2px solid #b8976b', backgroundColor: '#fdfbf7' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderRight: '1px solid #b8976b', color: '#000' }}>SERVICIO</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #b8976b', color: '#000' }}>CATEGORIA</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #b8976b', color: '#000' }}>CANTIDAD</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', borderRight: '1px solid #b8976b', color: '#000' }}>PRECIO UNIT.</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', color: '#000' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEventDetails.carrito.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #b8976b' }}>
                      <td style={{ padding: '12px 8px', borderRight: '1px solid #b8976b' }}>{item.nombre}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #b8976b' }}>{item.categoria}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #b8976b' }}>{item.cantidad}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', borderRight: '1px solid #b8976b' }}>${Number(item.precio_unitario).toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'center', borderTop: '2px solid #b8976b', borderBottom: '2px solid #b8976b', padding: '15px 0', marginBottom: '40px', backgroundColor: '#fdfbf7' }}>
                <h3 style={{ margin: 0, fontSize: '22px' }}>TOTAL ESTIMADO: ${selectedEventDetails.precio_total}</h3>
              </div>

              <p style={{ fontWeight: 'bold', fontSize: '16px', textAlign: 'center', margin: '0 40px', lineHeight: '1.5' }}>
                Te recordamos que para asegurar el lugar y los servicios solicitados es necesario un anticipo del 50%.
              </p>

              <div style={{ position: 'absolute', bottom: '30px', left: 0, width: '100%', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                contacto@escenaria.com | (555) 123-4567 | www.escenaria.com
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Events;
