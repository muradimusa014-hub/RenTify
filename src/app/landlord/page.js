'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const ZARIA_AREAS = [
  'Samaru',
  'Sabon Gari',
  'Gyellesu',
  'Tudun Wada',
  'Zaria City',
  'GRA',
  'Kongo',
  'Danmagaji',
  'Shika',
  'Palladan'
];

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'bookings'
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null); // null means "Create new"
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState('Samaru');
  const [formImages, setFormImages] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      // 1. Load Landlord Listings
      const propRes = await fetch(`/api/properties?ownerId=${user.id}`);
      let landlordProperties = [];
      if (propRes.ok) {
        const propData = await propRes.json();
        landlordProperties = propData.properties;
        setProperties(landlordProperties);
      }

      // 2. Load Bookings on landlord properties
      const bookRes = await fetch('/api/bookings');
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookings(bookData.bookings);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingProperty(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormLocation('Samaru');
    setFormImages(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (property) => {
    setEditingProperty(property);
    setFormTitle(property.title);
    setFormDescription(property.description);
    setFormPrice(property.price);
    setFormLocation(property.location);
    setFormImages(null); // Images will only be replaced if new ones are selected
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    setFormImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!formTitle || !formDescription || !formPrice || !formLocation) {
      setFormError('All text fields are required');
      setFormLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', formTitle);
    formData.append('description', formDescription);
    formData.append('price', formPrice);
    formData.append('location', formLocation);

    if (formImages) {
      for (let i = 0; i < formImages.length; i++) {
        formData.append('images', formImages[i]);
      }
    }

    try {
      let res;
      if (editingProperty) {
        // Edit property
        res = await fetch(`/api/properties/${editingProperty.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Create property
        if (!formImages || formImages.length === 0) {
          throw new Error('At least one property image is required');
        }
        res = await fetch('/api/properties', {
          method: 'POST',
          body: formData,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server request failed');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this listing? This will also remove any related bookings.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Landlord Control Panel</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Manage your rental listings in Zaria and view tenant booking requests.</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ width: 'auto' }}>
          ➕ List New Property
        </button>
      </div>

      {/* Landlord Stats Section */}
      {!loading && !error && (
        <div className="stats-grid" style={{ marginTop: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-info">
              <span className="stat-label">Properties Listed</span>
              <span className="stat-value">{properties.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)' }}>📋</div>
            <div className="stat-info">
              <span className="stat-label">Booking Requests</span>
              <span className="stat-value">{bookings.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)' }}>🔑</div>
            <div className="stat-info">
              <span className="stat-label">Rentals Completed</span>
              <span className="stat-value">
                {bookings.filter(b => b.status === 'completed').length}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>₦</div>
            <div className="stat-info">
              <span className="stat-label">Projected Annual Income</span>
              <span className="stat-value">
                ₦{properties.reduce((acc, curr) => acc + curr.price, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="tabs-nav" style={{ marginTop: '2rem' }}>
        <button 
          onClick={() => setActiveTab('listings')}
          className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
        >
          My Listed Properties ({properties.length})
        </button>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          Tenant Booking Requests ({bookings.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-light)' }}>
          Loading dashboard data...
        </div>
      ) : error ? (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius)' }}>
          ✗ {error}
        </div>
      ) : activeTab === 'listings' ? (
        /* Listings Tab */
        properties.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>No Listings Yet</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>You haven't listed any rentals in Zaria yet. Get started now!</p>
            <button onClick={handleOpenCreateModal} className="btn btn-secondary" style={{ width: 'auto' }}>
              Add Property Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="property-card" style={{ height: '100%' }}>
                <div className="property-card-img-wrapper">
                  <img src={property.images.split(',')[0]} alt={property.title} className="property-card-img" />
                  <span className={`badge badge-${property.status} property-card-badge`}>{property.status}</span>
                  {property.isSuspicious && (
                    <span className="badge badge-rejected" style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
                      ⚠ FLAGGED
                    </span>
                  )}
                </div>
                
                <div className="property-card-content">
                  <div className="property-card-location">📍 {property.location}</div>
                  <h3 className="property-card-title">{property.title}</h3>
                  <div className="property-card-price">₦{property.price.toLocaleString()}<span>/year</span></div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {property.description}
                  </p>
                </div>
                
                <div className="property-card-footer" style={{ gap: '0.5rem' }}>
                  <button onClick={() => handleOpenEditModal(property)} className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(property.id)} className="btn btn-danger" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Booking Requests Tab */
        bookings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>No Requests Yet</h3>
            <p style={{ color: 'var(--text-light)' }}>Tenants haven't made booking requests for your properties yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Location</th>
                  <th>Tenant Email</th>
                  <th>Status</th>
                  <th>Date Requested</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <Link href={`/properties/${booking.property.id}`} style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                        {booking.property.title}
                      </Link>
                    </td>
                    <td>{booking.property.location}</td>
                    <td>{booking.tenant.email}</td>
                    <td>
                      <span className={`badge badge-${booking.status}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                      {booking.id.split('-')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Property Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              {editingProperty ? 'Edit Property Listing' : 'List a New Property'}
            </h2>

            {formError && (
              <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>
                ✗ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Property Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Modern Self-Contain student hostel"
                  className="form-control"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Rent Price (₦/year)</label>
                  <input 
                    type="number"
                    required
                    placeholder="e.g. 150000"
                    className="form-control"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Zaria Location Area</label>
                  <select 
                    className="form-control"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  >
                    {ZARIA_AREAS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Property Description</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Provide property features e.g. running water, fenced compound, tile floors, distance to campus gates, electricity conditions..."
                  className="form-control"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Property Images {editingProperty && '(optional - leave empty to retain original)'}</label>
                <input 
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!editingProperty}
                  style={{ fontSize: '0.85rem' }}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  You can upload multiple files at once.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <button type="submit" disabled={formLoading} className="btn btn-primary">
                  {formLoading ? 'Saving...' : editingProperty ? 'Save Changes' : 'Publish Listing'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
