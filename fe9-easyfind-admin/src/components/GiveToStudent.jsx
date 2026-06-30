import { useState, useEffect, useRef } from "react";
import axios from "axios";

function GiveToStudent() {
  const [items, setItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [filterStatus, setFilterStatus] = useState("verified");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendError, setBackendError] = useState("");
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [verifiedQR, setVerifiedQR] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (enlargedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [enlargedImage]);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraActive]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("adminAuthToken");
      console.log("🔄 Fetching items...");
      
      // Fetch all items
      const response = await axios.get(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`,
        {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          withCredentials: true,
        }
      );
      
      console.log("📦 All items received:", response.data);
      console.log("📊 Total items:", response.data.length);
      
      // Filter by status - show items ready for handover (reserved or verified)
      const verifiedItems = response.data.filter(item => {
        console.log(`  Item: ${item.itemName}, Status: ${item.status}`);
        return item.status === "reserved" || item.status === "verified";
      });
      
      const claimedItemsList = response.data.filter(item => {
        return item.status === "claimed";
      });
      
      console.log("✅ Verified items:", verifiedItems.length);
      console.log("✅ Claimed items:", claimedItemsList.length);
      
      setItems(verifiedItems);
      setClaimedItems(claimedItemsList);
    } catch (error) {
      console.error("❌ Error fetching items:", error);
      const message = error.response?.data?.message || error.message;
      setBackendError(`Failed to load items: ${message}`);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMessage("Camera access denied. Please allow camera permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      handleFileChange({ target: { files: [file] } });
      setIsCameraActive(false);
    }, 'image/jpeg', 0.9);
  };

  const validateFile = (file) => file && file.size <= 5 * 1024 * 1024;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      setErrorMessage("File size too large (max 5MB)");
      return;
    }

    setProofImage(file);
    setProofImagePreview(URL.createObjectURL(file));
    setIsCameraActive(false);
  };

  const verifyQRToken = async (token) => {
    setIsVerifying(true);
    setErrorMessage("");
    setVerifiedQR(null);

    try {
      const authToken = localStorage.getItem("adminAuthToken");
      const response = await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/qr/scan`,
        { token },
        {
          headers: { Authorization: `Bearer ${authToken}` },
          withCredentials: true,
        }
      );

      const qrData = response.data;
      setVerifiedQR(qrData);
      setErrorMessage("");
      
      // Auto-populate item details
      if (qrData.item && selectedItemId) {
        const item = items.find(i => i._id === selectedItemId);
        if (item) {
          // Item already selected, just update verifiedQR
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "QR verification failed";
      setErrorMessage(errorMsg);
      setVerifiedQR(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualTokenSubmit = () => {
    if (!manualToken.trim()) {
      setErrorMessage("Please enter a QR token");
      return;
    }
    verifyQRToken(manualToken.trim());
  };

  const handleConfirmHandover = async () => {
    if (!selectedItemId || !proofImage || !verifiedQR) {
      setErrorMessage("Please verify QR code and upload proof image");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("adminAuthToken");
      const formData = new FormData();
      formData.append("image", proofImage);
      formData.append("qrToken", verifiedQR.qrCode.token);

      const response = await axios.put(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/${selectedItemId}/handover`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }
      );

      // Refresh items
      fetchItems();
      
      // Reset form
      setSelectedItemId(null);
      setProofImage(null);
      setProofImagePreview(null);
      setVerifiedQR(null);
      setManualToken("");
      setShowManualEntry(false);
      setIsSuccess(true);
      setErrorMessage("");

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Handover failed";
      setBackendError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHandoverForm = (itemId) => {
    setSelectedItemId(prev => prev === itemId ? null : itemId);
    setErrorMessage("");
    setBackendError("");
    setVerifiedQR(null);
    setManualToken("");
    setShowManualEntry(false);
    setProofImage(null);
    setProofImagePreview(null);
    setIsCameraActive(false);
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

  const filteredItems = items
    .filter(item =>
      (searchCode ? item.code.toLowerCase().includes(searchCode.toLowerCase()) : true) &&
      (searchStudent ? item.claimerDetails?.name?.toLowerCase().includes(searchStudent.toLowerCase()) : true)
    )
    .sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));

  const filteredClaimedItems = claimedItems
    .filter(item =>
      (searchCode ? item.code.toLowerCase().includes(searchCode.toLowerCase()) : true) &&
      (searchStudent ? item.claimerDetails?.name?.toLowerCase().includes(searchStudent.toLowerCase()) : true)
    )
    .sort((a, b) => new Date(b.claimerDetails?.dateHandovered) - new Date(a.claimerDetails?.dateHandovered));

  const LoadingSpinner = () => (
    <span className="flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {isVerifying ? "Verifying QR..." : "Processing..."}
    </span>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Give To Student</h1>

      {isSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4">
          ✅ Item handed over successfully!
        </div>
      )}
      {errorMessage && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md mb-4">
          ⚠️ {errorMessage}
        </div>
      )}
      {backendError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          ❌ Error: {backendError}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Item Code"
            className="border px-3 py-2 rounded-md flex-1 min-w-[200px]"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by Student Name"
            className="border px-3 py-2 rounded-md flex-1 min-w-[200px]"
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-md capitalize ${
              filterStatus === "verified"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterStatus("verified")}
          >
            Pending Handover ({items.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md capitalize ${
              filterStatus === "claimed"
                ? "bg-green-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => setFilterStatus("claimed")}
          >
            Claimed ({claimedItems.length})
          </button>
        </div>
      </div>

      {/* Pending Handover Items */}
      {filterStatus === "verified" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending Handovers</h2>
          {filteredItems.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <p className="text-gray-600">No pending handovers found</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                      <h3 className="text-lg font-semibold">{item.itemName}</h3>
                      <span className="text-sm text-gray-500">(Code: {item.code})</span>
                      {item.image?.url && (
                        <img 
                          src={item.image.url} 
                          alt="Item" 
                          className="w-12 h-12 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setEnlargedImage(item.image.url)}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Category:</label>
                        <p className="font-medium">{item.category}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Status:</label>
                        <p className="capitalize font-medium">{item.status}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Reported Date:</label>
                        <p className="font-medium">{formatDate(item.reportedDate)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Found Location:</label>
                        <p className="capitalize font-medium">{item.foundLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                      onClick={() => toggleHandoverForm(item._id)}
                    >
                      {selectedItemId === item._id ? "Close" : "Handover"}
                    </button>
                  </div>
                </div>

                {/* QR Verification and Handover Form */}
                {selectedItemId === item._id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-lg font-semibold mb-4">QR Code Verification</h4>

                    {/* QR Scanning Section */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h5 className="font-semibold mb-3">Scan Student's QR Code</h5>
                      
                      {!isCameraActive ? (
                        <button
                          onClick={() => setIsCameraActive(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md mb-3"
                        >
                          📷 Scan QR Code
                        </button>
                      ) : (
                        <div className="mb-3">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 object-cover rounded-md bg-black"
                          />
                          <canvas ref={canvasRef} className="hidden" width="1280" height="720" />
                          <button
                            onClick={captureImage}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md mt-2"
                          >
                            📸 Capture QR
                          </button>
                        </div>
                      )}

                      <div className="text-center my-3 text-gray-500">- OR -</div>

                      <button
                        onClick={() => setShowManualEntry(!showManualEntry)}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md"
                      >
                        🔤 Enter Token Manually
                      </button>

                      {showManualEntry && (
                        <div className="mt-3">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                            <p className="text-sm text-yellow-800">
                              <strong>📋 How to get the token:</strong>
                            </p>
                            <ol className="text-sm text-yellow-700 mt-1 list-decimal list-inside space-y-1">
                              <li>Ask student to open "My QR Pass" page</li>
                              <li>Click "Full Screen QR" to view their QR</li>
                              <li>Scroll down to see the "Token" field</li>
                              <li>Copy the token (64-character hex string)</li>
                              <li>Paste it below</li>
                            </ol>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Paste the 64-character token here"
                              className="border px-3 py-2 rounded-md flex-1 font-mono text-sm"
                              value={manualToken}
                              onChange={(e) => setManualToken(e.target.value)}
                            />
                            <button
                              onClick={handleManualTokenSubmit}
                              disabled={isVerifying || manualToken.length !== 64}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isVerifying ? <LoadingSpinner /> : "Verify"}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Token should be 64 characters (letters and numbers)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verified QR Details */}
                    {verifiedQR && selectedItemId && (
                      <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg mb-4">
                        <h5 className="font-semibold text-green-900 mb-3">✅ QR Verified Successfully</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="text-gray-600">Student Name:</label>
                            <p className="font-semibold">{verifiedQR.student?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Roll Number:</label>
                            <p className="font-semibold">{verifiedQR.student?.rollNo || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Item Name:</label>
                            <p className="font-semibold">{verifiedQR.item?.name || items.find(i => i._id === selectedItemId)?.itemName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Item Code:</label>
                            <p className="font-mono font-semibold">{verifiedQR.item?.code || items.find(i => i._id === selectedItemId)?.code || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Generated:</label>
                            <p className="font-medium">{formatDate(verifiedQR.qrCode?.generatedAt)}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">Expires:</label>
                            <p className="font-medium text-orange-600">{formatDate(verifiedQR.qrCode?.expiryTime)}</p>
                          </div>
                          <div>
                            <label className="text-gray-600">QR Status:</label>
                            <p className="font-semibold text-green-600">✓ Active</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proof Upload Section */}
                    {verifiedQR && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Upload Handover Proof *</label>
                        <div className="flex gap-2">
                          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                              Choose File
                          </label>
                          
                          <button
                            onClick={() => setIsCameraActive(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Use Camera
                          </button>
                        </div>
                        {proofImagePreview && (
                          <div className="mt-2">
                            <img
                              src={proofImagePreview}
                              alt="Proof preview"
                              className="w-32 h-32 object-contain rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setEnlargedImage(proofImagePreview)}
                            />
                            <p className="text-sm text-gray-500 mt-1">Click image to enlarge</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confirm Handover Button */}
                    {verifiedQR && (
                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleConfirmHandover}
                        disabled={isLoading || !proofImage}
                      >
                        {isLoading ? <LoadingSpinner /> : "✓ Confirm Handover"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Claimed Items */}
      {filterStatus === "claimed" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Claimed Items</h2>
          {filteredClaimedItems.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <p className="text-gray-600">No claimed items found</p>
            </div>
          ) : (
            filteredClaimedItems.map(item => (
              <div key={item._id} className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                      <h3 className="text-lg font-semibold">{item.itemName}</h3>
                      <span className="text-sm text-gray-500">(Code: {item.code})</span>
                      {item.image?.url && (
                        <img 
                          src={item.image.url} 
                          alt="Item" 
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <label className="text-gray-500">Category:</label>
                        <p className="font-medium">{item.category}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Status:</label>
                        <p className="capitalize font-medium text-green-600">Claimed</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Student Name:</label>
                        <p className="font-medium">{item.claimerDetails?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Roll Number:</label>
                        <p className="font-medium">{item.claimerDetails?.rollNo || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Pickup Date:</label>
                        <p className="font-medium">{formatDate(item.claimerDetails?.dateHandovered)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Contact:</label>
                        <p className="font-medium">{item.claimerDetails?.contact || 'N/A'}</p>
                      </div>
                    </div>
                    {item.proofImage && (
                      <div>
                        <label className="text-sm text-gray-500">Proof Image:</label>
                        <div className="mt-1">
                          <img
                            src={item.proofImage}
                            alt="Handover proof"
                            className="w-32 h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setEnlargedImage(item.proofImage)}
                          />
                          <p className="text-xs text-gray-500 mt-1">Click to enlarge</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" width="1280" height="720" />
            
            <div className="flex gap-4 mt-4 justify-center">
              <button
                onClick={captureImage}
                className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setIsCameraActive(false)}
                className="bg-red-500 p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={enlargedImage} 
              alt="Enlarged preview" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              className="absolute -top-8 right-0 text-white hover:text-gray-200 transition-colors"
              onClick={() => setEnlargedImage(null)}
              aria-label="Close enlarged view"
            >
              <svg 
                className="w-8 h-8"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GiveToStudent;