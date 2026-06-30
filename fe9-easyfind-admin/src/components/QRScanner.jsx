import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Get token from URL if provided
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResult({ token, fromHandover: true });
    }

    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setScanning(true);

      // Initialize scanner
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        config,
        onScanSuccess,
        onScanFailure
      );

      console.log("QR Scanner started successfully");
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Failed to start camera. Please ensure camera permissions are granted.");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && scanning) {
        await html5QrCodeRef.current.stop();
        setScanning(false);
        console.log("QR Scanner stopped");
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };

  const onScanSuccess = (decodedText) => {
    console.log("QR Code detected:", decodedText);
    
    // Extract token from URL if needed
    let token = decodedText;
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      token = pathParts[pathParts.length - 1];
    } catch (e) {
      // If not a URL, use as-is (might be just the token)
    }

    setResult({ token });
    stopScanning();
  };

  const onScanFailure = (error) => {
    // Silently handle scan failures (no QR code in frame)
    // console.log('Scan failure:', error);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const token = e.target.elements.token.value.trim();
    if (!token) {
      setError('Please enter a token');
      return;
    }
    setResult({ token });
  };

  const processQRCode = async () => {
    if (!result?.token) return;

    try {
      setProcessing(true);
      setError('');

      const adminToken = localStorage.getItem('adminAuthToken');
      
      const response = await axios.post(
        'http://localhost:3115/api/qr/scan',
        { token: result.token },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      alert(`✅ ${response.data.message}`);
      
      // Redirect to handovers page after successful scan
      setTimeout(() => {
        window.location.href = '/admin/handovers';
      }, 2000);

    } catch (err) {
      console.error('Error processing QR:', err);
      setError(err.response?.data?.message || 'Failed to process QR code');
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError('');
    setProcessing(false);
    
    // Clear URL parameter
    const url = new URL(window.location);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          QR Code Scanner
        </h1>
        <p style={{ color: '#6b7280' }}>
          Scan QR codes to verify and complete item handovers
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && !processing ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              QR Code Detected
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Token: <code style={{
                backgroundColor: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>{result.token}</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={resetScanner}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Scan Another
            </button>
            <button
              onClick={processQRCode}
              disabled={processing}
              style={{
                flex: 1,
                padding: '12px',
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
              {processing ? 'Processing...' : '✅ Verify & Complete Handover'}
            </button>
          </div>
        </div>
      ) : processing ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Processing...
          </h3>
          <p style={{ color: '#6b7280' }}>Please wait while we verify the QR code.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {/* Manual Token Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Or enter token manually:
            </label>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                name="token"
                placeholder="Enter QR token"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Submit
              </button>
            </form>
          </div>

          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px',
            marginTop: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Or scan QR code with camera
            </h3>

            {!scanning ? (
              <button
                onClick={startScanning}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📷 Start Camera Scanner
              </button>
            ) : (
              <div>
                <div
                  id="qr-reader"
                  ref={scannerRef}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px'
                  }}
                ></div>
                <button
                  onClick={stopScanning}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Stop Scanner
                </button>
              </div>
            )}
          </div>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '4px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e40af',
              marginBottom: '8px'
            }}>
              📋 Instructions:
            </h4>
            <ul style={{
              fontSize: '14px',
              color: '#1e40af',
              marginLeft: '20px',
              lineHeight: '1.6'
            }}>
              <li>Click "Start Camera Scanner" to activate camera</li>
              <li>Point camera at the QR code on the claimant's phone</li>
              <li>QR code will be automatically detected and verified</li>
              <li>Or manually enter the token from the QR code</li>
              <li>Click "Verify & Complete Handover" to finalize</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;