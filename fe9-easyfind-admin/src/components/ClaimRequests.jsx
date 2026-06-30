import { useState, useEffect } from 'react';
import axios from 'axios';

const ClaimRequests = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const fetchPendingClaims = async () => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      const response = await axios.get('http://localhost:3115/api/claims/pending', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClaims(response.data.claims || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Failed to load claim requests');
      setLoading(false);
    }
  };

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setShowDetailModal(true);
  };

  const handleApprove = async (claimId) => {
    if (!window.confirm('Are you sure you want to approve this claim? A QR code will be generated and sent to the student.')) {
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('adminAuthToken');
      const reviewNotes = prompt('Enter review notes (optional):', '');
      
      await axios.patch(
        `http://localhost:3115/api/claims/${claimId}/approve`,
        { reviewNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('✅ Claim approved successfully! QR code has been sent to the student.');
      setShowDetailModal(false);
      fetchPendingClaims();
    } catch (err) {
      console.error('Error approving claim:', err);
      alert(err.response?.data?.message || 'Failed to approve claim');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (claimId) => {
    if (!window.confirm('Are you sure you want to reject this claim?')) {
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('adminAuthToken');
      const reviewNotes = prompt('Enter reason for rejection (optional):', '');
      
      await axios.patch(
        `http://localhost:3115/api/claims/${claimId}/reject`,
        { reviewNotes },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Claim rejected. Student has been notified.');
      setShowDetailModal(false);
      fetchPendingClaims();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      alert(err.response?.data?.message || 'Failed to reject claim');
    } finally {
      setProcessing(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading claim requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '18px', color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Claim Requests
        </h1>
        <p style={{ color: '#6b7280' }}>
          Review and process student claims for found items
        </p>
      </div>

      {claims.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            No Pending Claims
          </h3>
          <p style={{ color: '#6b7280' }}>
            All claims have been processed. New claims will appear here.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Student Info
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Lost Item
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Found Item
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Match Score
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Submitted
                </th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {claim.studentDetails?.name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {claim.studentDetails?.rollNo}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {claim.studentDetails?.contact}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        {claim.lostItemId?.itemName || 'N/A'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {claim.lostItemId?.category}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        {claim.foundItemId?.itemName || 'N/A'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {claim.foundItemId?.category}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        backgroundColor: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginTop: '4px',
                        display: 'inline-block'
                      }}>
                        Code: {claim.foundItemId?.code}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {claim.matchScore !== null ? (
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchScoreColor(claim.matchScore)}`}>
                        {claim.matchScore}%
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(claim.createdAt)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleViewDetails(claim)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleApprove(claim._id)}
                        disabled={processing}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: processing ? 'not-allowed' : 'pointer',
                          opacity: processing ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(claim._id)}
                        disabled={processing}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: processing ? 'not-allowed' : 'pointer',
                          opacity: processing ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedClaim && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                Claim Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Lost Item */}
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                  📌 Lost Item
                </h3>
                {selectedClaim.lostItemId?.image?.url && (
                  <img
                    src={selectedClaim.lostItemId.image.url}
                    alt={selectedClaim.lostItemId.itemName}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                  />
                )}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Name: </span>
                  <span style={{ color: '#1f2937' }}>{selectedClaim.lostItemId?.itemName}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Category: </span>
                  <span style={{ color: '#1f2937' }}>{selectedClaim.lostItemId?.category}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Location: </span>
                  <span style={{ color: '#1f2937' }}>{selectedClaim.lostItemId?.location}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Description: </span>
                  <p style={{ color: '#1f2937', marginTop: '4px' }}>{selectedClaim.lostItemId?.description}</p>
                </div>
              </div>

              {/* Found Item */}
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                  📦 Found Item
                </h3>
                {selectedClaim.foundItemId?.image?.url && (
                  <img
                    src={selectedClaim.foundItemId.image.url}
                    alt={selectedClaim.foundItemId.itemName}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                  />
                )}
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Name: </span>
                  <span style={{ color: '#1f2937' }}>{selectedClaim.foundItemId?.itemName}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Category: </span>
                  <span style={{ color: '#1f2937' }}>{selectedClaim.foundItemId?.category}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Code: </span>
                  <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{selectedClaim.foundItemId?.code}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Location: </span>
                  <span style={{ color: '#1f2937' }}>{selectedClaim.foundItemId?.foundLocation}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Description: </span>
                  <p style={{ color: '#1f2937', marginTop: '4px' }}>{selectedClaim.foundItemId?.description}</p>
                </div>
              </div>
            </div>

            {/* Match Info */}
            {selectedClaim.matchScore !== null && (
              <div style={{
                backgroundColor: '#e0f2fe',
                borderLeft: '4px solid #0284c7',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0c4a6e', marginBottom: '8px' }}>
                  🎯 Semantic Match Score: {selectedClaim.matchScore}%
                </h4>
                {selectedClaim.matchReason && (
                  <p style={{ fontSize: '14px', color: '#075985' }}>{selectedClaim.matchReason}</p>
                )}
              </div>
            )}

            {/* Student Info */}
            <div style={{
              backgroundColor: '#f0fdf4',
              borderLeft: '4px solid #16a34a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#14532d', marginBottom: '8px' }}>
                👤 Student Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Name: </span>
                  <span style={{ color: '#14532d' }}>{selectedClaim.studentDetails?.name}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Roll No: </span>
                  <span style={{ color: '#14532d' }}>{selectedClaim.studentDetails?.rollNo}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Email: </span>
                  <span style={{ color: '#14532d' }}>{selectedClaim.studentDetails?.email}</span>
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Contact: </span>
                  <span style={{ color: '#14532d' }}>{selectedClaim.studentDetails?.contact}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedClaim._id)}
                disabled={processing}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1
                }}
              >
                ✗ Reject Claim
              </button>
              <button
                onClick={() => handleApprove(selectedClaim._id)}
                disabled={processing}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.5 : 1
                }}
              >
                ✓ Approve & Generate QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimRequests;