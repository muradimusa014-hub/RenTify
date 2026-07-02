'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'properties' | 'users'
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Action processing state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load admin logs');
      }
      const data = await res.json();
      setUsers(data.users || []);
      setProperties(data.properties || []);
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdminAction = async (payload, identifier) => {
    if (payload.action === 'delete_user' && !confirm('Are you sure you want to delete this user? This is permanent.')) return;
    if (payload.action === 'delete_property' && !confirm('Are you sure you want to delete this listing?')) return;
    
    setActionLoadingId(identifier);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Platform Console</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Verify manual payments, complete booking inspection loops, and audit system properties or users.</p>
        </div>
        <button onClick={loadData} className="btn btn-outline" style={{ width: 'auto' }}>
          🔄 Refresh Console
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-nav" style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          Bookings & Receipts ({bookings.length})
        </button>
        <button 
          onClick={() => setActiveTab('properties')}
          className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
        >
          Property Listings ({properties.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          User Accounts ({users.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-light)' }}>
          Loading administrative console...
        </div>
      ) : error ? (
        <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1.25rem', borderRadius: 'var(--radius)', fontWeight: 500 }}>
          ✗ {error}
        </div>
      ) : activeTab === 'bookings' ? (
        /* Bookings Tab */
        bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>No bookings found in database logs.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Receipt Screenshot</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div>
                        <Link href={`/properties/${booking.property.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {booking.property.title}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          📍 {booking.property.location} • ₦{booking.property.price.toLocaleString()}/yr
                        </div>
                      </div>
                    </td>
                    <td>{booking.tenant.email}</td>
                    <td>
                      <span className={`badge badge-${booking.status}`}>{booking.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      {booking.receiptImage ? (
                        <a 
                          href={booking.receiptImage} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--secondary)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textDecoration: 'underline'
                          }}
                        >
                          🖼 View Receipt Image
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Not uploaded</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {booking.status === 'payment_pending' && (
                          <>
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handleAdminAction({ action: 'approve_payment', bookingId: booking.id }, booking.id + '_app')}
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto' }}
                            >
                              {actionLoadingId === booking.id + '_app' ? '...' : 'Approve Payment'}
                            </button>
                            <button
                              disabled={actionLoadingId !== null}
                              onClick={() => handleAdminAction({ action: 'reject_payment', bookingId: booking.id }, booking.id + '_rej')}
                              className="btn btn-danger"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto' }}
                            >
                              {actionLoadingId === booking.id + '_rej' ? '...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {booking.status === 'paid' && (
                          <button
                            disabled={actionLoadingId !== null}
                            onClick={() => handleAdminAction({ action: 'complete_booking', bookingId: booking.id }, booking.id + '_comp')}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto', background: 'var(--accent)' }}
                          >
                            {actionLoadingId === booking.id + '_comp' ? '...' : 'Mark Completed (Inspection Done)'}
                          </button>
                        )}
                        {(booking.status === 'completed' || booking.status === 'rejected' || booking.status === 'requested') && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            No action required
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'properties' ? (
        /* Properties Tab */
        properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>No properties in database logs.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Listing Title</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th>Owner</th>
                  <th>Security Flags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td>
                      <img 
                        src={property.images.split(',')[0]} 
                        alt={property.title} 
                        style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                    </td>
                    <td>
                      <Link href={`/properties/${property.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {property.title}
                      </Link>
                    </td>
                    <td>{property.location}</td>
                    <td>₦{property.price.toLocaleString()}</td>
                    <td>{property.owner.email}</td>
                    <td>
                      {property.isSuspicious ? (
                        <span className="badge badge-rejected">🚩 Suspicious / Hidden</span>
                      ) : (
                        <span className="badge badge-available">✓ Clear</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {property.isSuspicious ? (
                          <button
                            disabled={actionLoadingId !== null}
                            onClick={() => handleAdminAction({ action: 'unflag_property', propertyId: property.id }, property.id + '_flag')}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto' }}
                          >
                            Unflag
                          </button>
                        ) : (
                          <button
                            disabled={actionLoadingId !== null}
                            onClick={() => handleAdminAction({ action: 'flag_property', propertyId: property.id }, property.id + '_flag')}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          >
                            Flag Suspicious
                          </button>
                        )}
                        <button
                          disabled={actionLoadingId !== null}
                          onClick={() => handleAdminAction({ action: 'delete_property', propertyId: property.id }, property.id + '_del')}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Users Tab */
        users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>No users in database logs.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Registered Role</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>{u.id}</td>
                    <td style={{ fontWeight: 600 }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-completed' : u.role === 'landlord' ? 'badge-pending' : 'badge-requested'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        disabled={actionLoadingId !== null || u.id === user.id}
                        onClick={() => handleAdminAction({ action: 'delete_user', userId: u.id }, u.id + '_del')}
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto', opacity: u.id === user.id ? 0.4 : 1 }}
                      >
                        {u.id === user.id ? 'Self' : 'Delete User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
