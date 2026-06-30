import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:3115/api/claims/my-claims', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClaims(response.data.claims || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Failed to load your claims');
      setLoading(false);
    }
  };

  const handleViewDetails = (claim) => {
    setSelectedClaim(claim);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
            ⏳ Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
            ✓ Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">
            ✗ Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            ✓ Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">
            {status}
          </span>
        );
    }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading your claims...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Claims</h1>
        <p className="text-gray-600">
          Track your claims for found items
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Claims Yet</h3>
          <p className="text-gray-600 mb-4">
            When you claim a found item, it will appear here.
          </p>
          <Link
            to="/dashboard/search-item"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            Search for Items
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {claim.foundItemId?.itemName || 'Found Item'}
                      </h3>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {claim.foundItemId?.category} • Code: {claim.foundItemId?.code}
                    </p>
                  </div>
                  {claim.foundItemId?.image?.url && (
                    <img
                      src={claim.foundItemId.image.url}
                      alt={claim.foundItemId.itemName}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Submitted:</span>
                    <p className="font-medium">{formatDate(claim.createdAt)}</p>
                  </div>
                  {claim.approvedAt && (
                    <div>
                      <span className="text-gray-600">Approved:</span>
                      <p className="font-medium text-green-600">{formatDate(claim.approvedAt)}</p>
                    </div>
                  )}
                  {claim.completedAt && (
                    <div>
                      <span className="text-gray-600">Completed:</span>
                      <p className="font-medium text-blue-600">{formatDate(claim.completedAt)}</p>
                    </div>
                  )}
                  {claim.matchScore !== null && (
                    <div>
                      <span className="text-gray-600">Match Score:</span>
                      <p className="font-medium">
                        <span className={`${claim.matchScore >= 80 ? 'text-green-600' : claim.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {claim.matchScore}%
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {claim.status === 'APPROVED' && claim.qrCodeId && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded mb-4">
                    <p className="text-sm text-green-800 font-semibold mb-1">
                      ✓ Your claim has been approved!
                    </p>
                    <p className="text-sm text-green-700">
                      A QR code has been sent to your email. You can also view it in{' '}
                      <Link to="/dashboard/my-qr-pass" className="text-blue-600 hover:underline font-medium">
                        My QR Pass
                      </Link>
                    </p>
                  </div>
                )}

                {claim.status === 'REJECTED' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
                    <p className="text-sm text-red-800 font-semibold">
                      Your claim has been rejected
                    </p>
                    {claim.reviewNotes && (
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {claim.reviewNotes}
                      </p>
                    )}
                  </div>
                )}

                {claim.status === 'COMPLETED' && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
                    <p className="text-sm text-blue-800 font-semibold">
                      ✓ Item has been handed over
                    </p>
                    {claim.completedAt && (
                      <p className="text-sm text-blue-700 mt-1">
                        Completed on: {formatDate(claim.completedAt)}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(claim)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    View Details
                  </button>
                  {claim.status === 'APPROVED' && (
                    <Link
                      to="/dashboard/my-qr-pass"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors inline-block"
                    >
                      View QR Pass
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedClaim && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Claim Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge(selectedClaim.status)}
              </div>

              {/* Found Item */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📦 Found Item</h3>
                {selectedClaim.foundItemId?.image?.url && (
                  <img
                    src={selectedClaim.foundItemId.image.url}
                    alt={selectedClaim.foundItemId.itemName}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedClaim.foundItemId?.itemName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{selectedClaim.foundItemId?.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Code:</span>
                    <p className="font-mono font-medium text-blue-600">{selectedClaim.foundItemId?.code}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">{selectedClaim.foundItemId?.foundLocation}</p>
                  </div>
                </div>
                {selectedClaim.foundItemId?.description && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Description:</span>
                    <p className="text-gray-800 mt-1">{selectedClaim.foundItemId.description}</p>
                  </div>
                )}
              </div>

              {/* Lost Item */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📌 Your Lost Item</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedClaim.lostItemId?.itemName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{selectedClaim.lostItemId?.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">{selectedClaim.lostItemId?.location}</p>
                  </div>
                </div>
              </div>

              {/* Match Score */}
              {selectedClaim.matchScore !== null && (
                <div className="bg-cyan-50 border-l-4 border-cyan-500 p-3 rounded">
                  <p className="text-sm">
                    <span className="font-semibold">Match Score:</span>{' '}
                    <span className={`font-bold ${selectedClaim.matchScore >= 80 ? 'text-green-600' : selectedClaim.matchScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {selectedClaim.matchScore}%
                    </span>
                  </p>
                  {selectedClaim.matchReason && (
                    <p className="text-sm text-gray-700 mt-1">{selectedClaim.matchReason}</p>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">{formatDate(selectedClaim.createdAt)}</span>
                  </div>
                  {selectedClaim.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed:</span>
                      <span className="font-medium">{formatDate(selectedClaim.reviewedAt)}</span>
                    </div>
                  )}
                  {selectedClaim.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved:</span>
                      <span className="font-medium text-green-600">{formatDate(selectedClaim.approvedAt)}</span>
                    </div>
                  )}
                  {selectedClaim.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium text-blue-600">{formatDate(selectedClaim.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClaims;