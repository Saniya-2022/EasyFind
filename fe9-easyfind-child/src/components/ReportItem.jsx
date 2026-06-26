import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

const ReportItem = ({ onItemReported }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    foundLocation: '',
    category: '',
    reportedDate: ''
  });
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
      setStatus("Camera access denied. Please allow camera permissions.");
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
      handleImageChange(file);
      setIsCameraActive(false);
    }, 'image/jpeg', 0.9);
  };

  const handleImageChange = (fileOrEvent) => {
    let file;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      file = fileOrEvent.target.files[0];
    }
    
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus("Image too large (max 5MB)");
      return;
    }

    setStatus('');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({ itemName: '', description: '', foundLocation: '', category: '', reportedDate: '' });
    setImage(null);
    setImagePreview(null);
    setStatus('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    if (!image) {
      setStatus('Please upload an image.');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    if (formData.reportedDate > currentDate) {
      setStatus("Date Found cannot be in the future");
      return;
    }

    setLoading(true);
    try {
      const index = user.email?.indexOf('@');
      const rollNo = user.email.substring(0, index);
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.append('reporterRollNo', rollNo);
      data.append('image', image);

    const response = await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/found`, data, {
          withCredentials: true,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      console.log("data is here", response)  
      const res = response.data
      if (res.success) {
        resetForm();
        setSuccessMessage('Item successfully reported! Please remember to submit the physical item to the security office.');
        setTimeout(() => {
          setSuccessMessage('');
          onItemReported?.(res.item);
          navigate('/');
        }, 10000);
      } else {
        throw new Error(res.message || 'Failed to report item');
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-6 px-4 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-blue-700">Report Found Item</h2>
            <p className="text-sm text-gray-500 mt-1">Share a few details to help us match with lost-item reports.</p>
          </div>

          {status && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
              {status}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="e.g., iPhone, Keys, Wallet"
                className="w-full rounded-lg border px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Found Location</label>
              <input
                type="text"
                name="foundLocation"
                value={formData.foundLocation}
                onChange={handleChange}
                placeholder="JSK greens, E block entrance .."
                className="w-full rounded-lg border px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Found</label>
              <input
                type="date"
                name="reportedDate"
                value={formData.reportedDate || ''}
                onChange={handleChange}
                className="w-full rounded-lg border px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Color, brand, distinctive features..."
                rows={3}
                className="w-full rounded-lg border px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  Upload Photo
                </label>
                <button
                  type="button"
                  onClick={() => { setStatus(''); setIsCameraActive(true); }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Take Photo
                </button>
                {image && (
                  <span className="text-sm text-gray-600 self-center truncate max-w-[60%]">
                    {image.name}
                  </span>
                )}
              </div>
              {imagePreview && (
                <div className="mt-3">
                  <img src={imagePreview} alt="Preview" className="h-28 w-28 object-contain border rounded-md" />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Submitting…' : 'Report Found Item'}
              </button>
            </div>
          </form>

          {/* Next Steps */}
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
            <ol className="list-decimal ml-5 text-blue-700 text-sm space-y-1">
              <li>Submit this form with the item details</li>
              <li>Take the item to the Security Office</li>
              <li>We’ll notify the owner if we find a match</li>
              <li>Hand over the item when contacted by security</li>
            </ol>
          </div>
        </div>

        {isCameraActive && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-video rounded-lg bg-black" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={captureImage} className="px-4 py-2 bg-white rounded-md shadow hover:bg-gray-100">Capture</button>
                <button onClick={() => setIsCameraActive(false)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportItem;