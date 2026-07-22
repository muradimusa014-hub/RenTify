'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [data, setData] = useState({ users: [], properties: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const result = await res.json();
        setError(result.error || 'Failed to load admin data');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdminAction = async (action, id) => {
    setActionLoading(true);
    setActionMessage('');
    try {
      const body = { action };
      if (['approve_payment', 'reject_payment', 'complete_booking'].includes(action)) {
        body.bookingId = id;
      } else if (['flag_property', 'unflag_property', 'delete_property'].includes(action)) {
        body.propertyId = id;
      } else if (action === 'delete_user') {
        body.userId = id;
      }

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Action failed');
      }

      setActionMessage(result.message);
      await loadData();
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      requested: 'badge-requested',
      payment_pending: 'badge-payment_pending',
      paid: 'badge-paid',
      completed: 'badge-completed',
      rejected: 'badge-rejected',
      available: 'badge-available',
      pending: 'badge-pending',
      taken: 'badge-taken',
    };
    return map[status] || 'badge-available';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Manage users, properties, and booking verifications across Rentify Zaria.</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary btn-auto" disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{data.users.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)' }}>🏢</div>
            <div className="stat-info">
              <span className="stat-label">Total Properties</span>
              <span className="stat-value">{data.properties.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--highlight)' }}>📋</div>
            <div className="stat-info">
              <span className="stat-label">Pending Payments</span>
              <span className="stat-value">{data.bookings.filter(b => b.status === 'payment_pending').length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--accent)' }}>✓</div>
            <div className="stat-info">
              <span className="stat-label">Completed Bookings</span>
              <span className="stat-value">{data.bookings.filter(b => b.status === 'completed').length}</span>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div style={{
          background: actionMessage.includes('successfully') || actionMessage.includes('marked') || actionMessage.includes('flagged') ? '#DCFCE7' : '#FEE2E2',
          color: actionMessage.includes('successfully') || actionMessage.includes('marked') || actionMessage.includes('flagged') ? '#15803D' : '#B91C1C',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          fontWeight: 500,
          fontSize: '0.95rem',
        }}>
          {actionMessage.includes('successfully') || actionMessage.includes('marked') || actionMessage.includes('flagged') ? '✓' : '✗'} {actionMessage}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-light)' }}>
          Loading admin dashboard...
        </div>
      ) : error ? (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius)' }}>
          ✗ {error}
        </div>
      ) : (
        <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          >
            Payment Reviews ({data.bookings.filter(b => b.status === 'payment_pending').length})
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          >
            Properties ({data.properties.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            Users ({data.users.length})
          </button>
        </div>
      )}

      {!loading && !error && activeTab === 'bookings' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No bookings yet.</td></tr>
              ) : (
                data.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>{booking.property.title}</strong>
                      <br />
                      <small style={{ color: 'var(--text-light)' }}>{booking.property.location}</small>
                    </td>
                    <td>{booking.tenant.email}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {booking.receiptImage ? (
                        <a href={booking.receiptImage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                          View Receipt
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td>
                      {booking.status === 'payment_pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleAdminAction('approve_payment', booking.id)}
                            disabled={actionLoading}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAdminAction('reject_payment', booking.id)}
                            disabled={actionLoading}
                            className="btn btn-danger"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {booking.status === 'paid' && (
                        <button
                          onClick={() => handleAdminAction('complete_booking', booking.id)}
                          disabled={actionLoading}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                        >
                          Mark Inspected
                        </button>
                      )}
                      {(booking.status === 'requested' || booking.status === 'completed' || booking.status === 'rejected') && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && activeTab === 'properties' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Price</th>
                <th>Status</th>
                <th>Flagged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.properties.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No properties yet.</td></tr>
              ) : (
                data.properties.map((property) => (
                  <tr key={property.id}>
                    <td><strong>{property.title}</strong></td>
                    <td>{property.owner.email}</td>
                    <td>{property.location}</td>
                    <td>₦{property.price.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(property.status)}`}>
                        {property.status}
                      </span>
                    </td>
                    <td>
                      {property.isSuspicious ? (
                        <span className="badge badge-rejected">⚠ Flagged</span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Clean</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {!property.isSuspicious ? (
                          <button
                            onClick={() => handleAdminAction('flag_property', property.id)}
                            disabled={actionLoading}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                          >
                            Flag
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdminAction('unflag_property', property.id)}
                            disabled={actionLoading}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                          >
                            Unflag
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this property and all related data?')) {
                              handleAdminAction('delete_property', property.id);
                            }
                          }}
                          disabled={actionLoading}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && activeTab === 'users' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No users yet.</td></tr>
              ) : (
                data.users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.email}</strong></td>
                    <td>
                      <span className={`badge badge-${u.role === 'admin' ? 'paid' : u.role === 'landlord' ? 'pending' : 'requested'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.id !== user.id ? (
                        <button
                          onClick={() => {
                            if (confirm(`Delete user ${u.email}? This cannot be undone.`)) {
                              handleAdminAction('delete_user', u.id);
                            }
                          }}
                          disabled={actionLoading}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                        >
                          Delete
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>You</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
