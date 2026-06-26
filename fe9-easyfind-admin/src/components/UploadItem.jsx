import { useState, useEffect, useRef } from "react";
import axios from "axios";

const categories = [
  "ID Card/Student Card",
  "Keys",
  "Calculator",
  "Earbuds/Headphones",
  "Mobile / Laptop",
  "Water Bottle/Tumbler",
  "USB Drive",
  "Wallet/Purse",
  "Watch",
  "Sunglasses/Eyeglasses",
  "Other"
];

function UploadItem() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [reportedDate, setReportedDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup image preview
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Camera handling
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
      return () => stopCamera();
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setErrorMessage("Camera access denied. Please allow camera permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);
    
    canvas.toBlob(blob => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      handleFileChange(file);
      setIsCameraActive(false);
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (fileOrEvent) => {
    let file;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      file = fileOrEvent.target.files[0];
    }
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image too large (max 5MB)");
      return;
    }

    setErrorMessage("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setErrorMessage("");
    setIsSuccess(false);

    const currentDate = new Date().toISOString().split('T')[0];
    if (reportedDate > currentDate) {
      setErrorMessage("Date Found cannot be in the future");
      return;
    }

    const requiredFields = [
      !itemName && "Item Name",
      !category && "Category",
      !foundLocation && "Found Location",
      !image && "Image",
      !reportedDate && "Date Found"
    ].filter(Boolean);

    if (requiredFields.length > 0) {
      setErrorMessage(`Missing: ${requiredFields.join(", ")}`);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("itemName", itemName);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("foundLocation", foundLocation);
    formData.append("image", image);
    formData.append("reportedDate", reportedDate);

    try {
      const token = localStorage.getItem("adminAuthToken");
      await axios.post(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      setIsSuccess(true);
      setItemName("");
      setCategory("");
      setFoundLocation("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
      setReportedDate("");
      setFileInputKey(Date.now());
    } catch (error) {
      let errorMsg = "Submission failed. Please try again.";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-2xl font-semibold text-gray-700 mb-4 text-center">Upload Found Item</h3>

      {isSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4">
          ✅ Item uploaded successfully!
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
          ❌ Error: {errorMessage}
        </div>
      )}

<form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Item Name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </div>

        <div>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="text"
            placeholder="Found Location"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={foundLocation}
            onChange={(e) => setFoundLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Date Found
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={reportedDate}
            onChange={(e) => setReportedDate(e.target.value)}
            required
          />
        </div>

        <div>
          <textarea
            placeholder="Description"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                key={fileInputKey}
              />
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choose File
            </label>
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setIsCameraActive(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use Camera
            </button>
          </div>

          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-32 w-32 object-contain border rounded-md cursor-pointer hover:opacity-80"
                onClick={() => setEnlargedImage(imagePreview)}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition relative"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
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
              Uploading...
            </div>
          ) : (
            "Upload Item"
          )}
        </button>
      </form>

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={captureImage}
                className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                📸 Capture
              </button>
              <button
                onClick={() => setIsCameraActive(false)}
                className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={enlargedImage}
              alt="Enlarged Preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadItem;