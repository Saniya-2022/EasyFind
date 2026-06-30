import { useState, useEffect } from 'react';
import axios from 'axios';

const MyQRPass = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    fetchMyQRCodes();
  }, []);

  const fetchMyQRCodes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:3115/api/qr/my-qr-passes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQrCodes(response.data.qrCodes || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching QR codes:', err);
      setError('Failed to load QR passes');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
            ✓ Active
          </span>
        );
      case 'USED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            ✓ Collected
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">
            ⏰ Expired
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

  const downloadQR = async (qrId, itemCode) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:3115/api/qr/${qrId}/image`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `EasyFind_${itemCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR:', err);
      alert('Failed to download QR code');
    }
  };

  const openFullScreen = (qr) => {
    setSelectedQR(qr);
    setShowFullScreen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading QR passes...</div>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My QR Passes</h1>
        <p className="text-gray-600">
          View and download your QR passes for item pickup
        </p>
      </div>

      {qrCodes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No QR Passes Yet</h3>
          <p className="text-gray-600">
            When your claim is approved, you'll receive a QR pass via email.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr) => (
            <div
              key={qr._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h3 className="font-semibold text-lg truncate">
                  {qr.claimId?.foundItemId?.itemName || 'Found Item'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {qr.claimId?.foundItemId?.category || 'N/A'}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Item Image */}
                {qr.claimId?.foundItemId?.image?.url && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={qr.claimId.foundItemId.image.url}
                      alt={qr.claimId.foundItemId.itemName}
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Item Code:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {qr.claimId?.foundItemId?.code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Generated:</span>
                    <span className="font-medium">{formatDate(qr.generatedAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium text-orange-600">
                      {formatDate(qr.expiryTime)}
                    </span>
                  </div>
                  {qr.status === 'USED' && qr.usedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Collected:</span>
                      <span className="font-medium text-green-600">
                        {formatDate(qr.usedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  {getStatusBadge(qr.status)}
                </div>

                {/* Status Messages */}
                {qr.status === 'USED' && (
                  <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-green-800 font-semibold">
                      ✓ Item Collected Successfully
                    </p>
                    {qr.usedBy && (
                      <p className="text-xs text-green-700 mt-1">
                        By: {qr.usedBy.name || 'Admin'}
                      </p>
                    )}
                  </div>
                )}

                {qr.status === 'EXPIRED' && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="text-sm text-red-800">
                      This QR has expired. Contact the administrator.
                    </p>
                  </div>
                )}

                 {/* QR Code Image */}
                 {qr.status !== 'USED' && (
                   <div className="mb-4 flex justify-center">
                     <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                       {qr.qrImage ? (
                         <img
                           src={qr.qrImage}
                           alt="QR Code"
                           className="w-40 h-40"
                         />
                       ) : (
                         <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded">
                           <span className="text-gray-500 text-sm">QR Not Generated</span>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                {/* Action Buttons */}
                {qr.status !== 'USED' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => openFullScreen(qr)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🔍</span>
                      Full Screen QR
                    </button>
                    <button
                      onClick={() => downloadQR(qr._id, qr.claimId?.code)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📥</span>
                      Download QR
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Screen QR Modal */}
      {showFullScreen && selectedQR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullScreen(false)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Your QR Pass
              </h2>
              <button
                onClick={() => setShowFullScreen(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>

            {/* Item Details */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedQR.claimId?.itemName}
              </h3>
              <p className="text-gray-600">
                {selectedQR.claimId?.category} • Code: {selectedQR.claimId?.code}
              </p>
            </div>

            {/* Large QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-6 rounded-lg border-4 border-blue-200">
                {selectedQR.qrImage ? (
                  <img
                    src={selectedQR.qrImage}
                    alt="QR Code"
                    className="w-80 h-80"
                  />
                ) : (
                  <div className="w-80 h-80 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-gray-500 text-lg">QR Not Generated</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status and Expiry */}
            <div className="text-center space-y-2 mb-6">
              <div>{getStatusBadge(selectedQR.status)}</div>
              <p className="text-sm text-gray-600">
                Valid Until: {formatDate(selectedQR.expiryTime)}
              </p>
              <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                <p className="text-gray-500 mb-1">Token (for manual entry):</p>
                <p className="font-mono text-gray-700 break-all">{selectedQR.token}</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">📋 How to Use:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Save or screenshot this QR code</li>
                <li>Visit the security office during working hours</li>
                <li>Show this QR code to the security staff</li>
                <li>Staff will scan it to verify and hand over your item</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  downloadQR(selectedQR._id, selectedQR.claimId?.code);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <span>📥</span>
                Download QR
              </button>
              <button
                onClick={() => setShowFullScreen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Important Information</h4>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>QR codes expire after 24 hours from generation</li>
          <li>Each QR code can only be used once</li>
          <li>Download or screenshot your QR code before visiting</li>
          <li>Contact admin office if your QR code has expired</li>
        </ol>
      </div>
    </div>
  );
};

export default MyQRPass;