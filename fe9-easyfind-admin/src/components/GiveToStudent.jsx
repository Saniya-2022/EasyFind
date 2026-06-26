import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ClaimedItemDetails from "./ClaimedItemDetails";

function GiveToStudent() {
  const [items, setItems] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [contact, setContact] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("verified");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendError, setBackendError] = useState("");
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem("adminAuthToken");
        console.log("Fetching items with token:", token ? "Token present" : "No token");
        
        const response = await axios.get(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            withCredentials: true,
          }
        );
        console.log("Items fetched successfully:", response.data);
        setItems(response.data);
      } catch (error) {
        console.error("Error fetching items:", error);
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        console.error("Error details:", { status, message });
        
        if (status === 401) {
          setBackendError("Unauthorized: Please login again.");
        } else if (status === 403) {
          setBackendError("Forbidden: You don't have permission to access this resource.");
        } else if (status === 500) {
          setBackendError("Server error: Please try again later or contact support.");
        } else {
          setBackendError(`Failed to load items (Error ${status || 'unknown'}): ${message}`);
        }
      }
    };
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

  const validatePhoneNumber = (number) => /^\d{10}$/.test(number);
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

  const handleSubmitProofs = async () => {
    setErrorMessage("");
    setBackendError("");

    if (!selectedItem || !proofImage || !contact || !rollNo || !name || !handoverDate) {
      setErrorMessage("Please fill all details and upload a proof image.");
      return;
    }

    if (!validatePhoneNumber(contact)) {
      setErrorMessage("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", proofImage);
    formData.append("contact", contact);
    formData.append("rollNo", rollNo);
    formData.append("name", name);
    formData.append("dateHandovered", new Date(handoverDate).toISOString());

    try {
    const token = localStorage.getItem("adminAuthToken");
    const response = await axios.put(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/${selectedItem._id}/handover`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }
      );

      setItems(items.map(item => 
        item._id === selectedItem._id ? { 
          ...item, 
          status: "claimed", 
          claimerDetails: { 
            contact, 
            rollNo, 
            name, 
            dateHandovered: new Date(handoverDate).toISOString() 
          } 
        } : item
      ));

      setSelectedItem(null);
      setProofImage(null);
      setProofImagePreview(null);
      setContact("");
      setRollNo("");
      setName("");
      setHandoverDate("");
      setIsSuccess(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An unexpected error occurred";
      setBackendError(errorMsg);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsSuccess(false);
        setBackendError("");
      }, 5000);
    }
  };

  const toggleHandoverForm = (item) => {
    setSelectedItem(prev => prev?._id === item._id ? null : item);
    setErrorMessage("");
    setBackendError("");
    setName("");
    setRollNo("");
    setContact("");
    setHandoverDate("");
    setProofImage(null);
    setProofImagePreview(null);
  };

  const toggleItemDetails = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredItems = items
    .filter(item =>
      (searchCode ? item.code.includes(searchCode) : true) &&
      (searchCategory ? item.category.toLowerCase().includes(searchCategory.toLowerCase()) : true) &&
      item.status === filterStatus
    )
    .sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));

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
      Processing...
    </span>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Give To Student</h1>

      {isSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4">
          ✅ Handover successful!
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

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Item Code"
            className="border px-3 py-2 rounded-md flex-1 min-w-[200px]"
            onChange={(e) => setSearchCode(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by Category"
            className="border px-3 py-2 rounded-md flex-1 min-w-[200px]"
            onChange={(e) => setSearchCategory(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["verified", "claimed"].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-md capitalize ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-4">
        {filteredItems.map(item => (
          <li key={item._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${
                    item.status === 'verified' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></span>
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
                  
                  {(item.status === "claimed" || expandedItems[item._id]) && (
                    <>
                      <div>
                        <label className="text-gray-500">Reported Date:</label>
                        <p className="font-medium">{formatDate(item.reportedDate)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Found Location:</label>
                        <p className="capitalize font-medium">{item.foundLocation}</p>
                      </div>
                    </>
                  )}
                  
                  {item.status === "claimed" && (
                    <div>
                      <label className="text-gray-500">Handover Date:</label>
                      <p className="font-medium">{formatDate(item.claimerDetails?.dateHandovered)}</p>
                    </div>
                  )}
                </div>
                
                {item.status === "verified" && (
                  <div className="mt-2">
                    {!expandedItems[item._id] ? (
                      <button
                        onClick={() => toggleItemDetails(item._id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Details
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleItemDetails(item._id)}
                        className="text-gray-600 hover:underline text-sm"
                      >
                        Hide Details
                      </button>
                    )}
                  </div>
                )}
                
                {item.status === "claimed" && <ClaimedItemDetails item={item} />}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {item.status === "verified" && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                    onClick={() => toggleHandoverForm(item)}
                  >
                    {selectedItem?._id === item._id ? "Close" : "Handover"}
                  </button>
                )}
              </div>
            </div>

            {selectedItem?._id === item._id && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-lg font-semibold mb-4">Handover Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Student Name</label>
                    <input
                      type="text"
                      className="border px-3 py-2 rounded-md w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Roll Number</label>
                    <input
                      type="text"
                      className="border px-3 py-2 rounded-md w-full"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Number</label>
                    <input
                      type="tel"
                      className="border px-3 py-2 rounded-md w-full"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Handover Date</label>
                    <input
                      type="date"
                      className="border px-3 py-2 rounded-md w-full"
                      value={handoverDate}
                      onChange={(e) => setHandoverDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Handover Proof</label>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Choose File
                    </label>
                    
                    <button
                      onClick={() => setIsCameraActive(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
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

                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                  onClick={handleSubmitProofs}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner /> : "Confirm Handover"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

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
                xmlns="http://www.w3.org/2000/svg"
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
    </div>
  );
}

export default GiveToStudent;