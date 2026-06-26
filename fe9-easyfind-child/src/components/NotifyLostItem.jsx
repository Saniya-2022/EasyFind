import { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import LostItems from "./LostItems";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

const categories = [
  "ID Card/Student Card",
  "Keys",
  "Calculator",
  "Earbuds/Headphones",
  "Water Bottle/Tumbler",
  "USB Drive",
  "Wallet/Purse",
  "Watch",
  "Sunglasses/Eyeglasses",
  "Stationery",
  "Other"
];

function NotifyLostItems() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [itemName, setItemName] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user,token } = useAuth();
  const email = user?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!category || !location || !itemName || !dateLost) {
      setMessage({
        type: 'error',
        content: 'Please fill in all required fields'
      });
      setIsSubmitting(false);
      return;
    }

    try {
  await axios.post(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost`,
        { 
          category, 
          location, 
          email, 
          itemName,
          dateLost,
          description 
        },
  { 
    withCredentials: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
      );

      setMessage({
        type: 'success',
        content: "Item reported successfully! 🎉 You'll be notified via email if a match is found."
      });
      
      // Reset form
      setCategory('');
      setLocation('');
      setItemName('');
      setDateLost('');
      setDescription('');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to report item. Please try again.';
      setMessage({
        type: 'error',
        content: errorMsg
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ type: '', content: '' }), 50000);
    }
  };

  const MessageBanner = ({ type, content }) => {
    if (!content) return null;
    
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-600" />,
      error: <AlertCircle className="w-5 h-5 text-red-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />
    };

    const styles = {
      success: 'bg-green-50 border-green-300 text-green-700',
      error: 'bg-red-50 border-red-300 text-red-700',
      info: 'bg-blue-50 border-blue-300 text-blue-700'
    };

    return (
      <div className={`${styles[type]} p-4 rounded-lg border-l-4 mb-6 flex items-start gap-3`}>
        {icons[type]}
        <span className="flex-1">{content}</span>
        <button 
          onClick={() => setMessage({ type: '', content: '' })}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Report Lost Item
          </h1>
          <p className="text-gray-600">
            Help us help you find your lost belongings
          </p>
        </div>

        {message.content && (
          <MessageBanner type={message.type} content={message.content} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select item category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Black leather wallet, ID card"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Known Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Library, JSK Greens"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Lost
              </label>
              <input
                type="date"
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the item (color, brand, distinguishing features)..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32"
              ></textarea>
              <p className="text-sm text-gray-500 mt-1">
                Include details like color, brand, and any unique identifiers
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-all ${
              isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Submitting...
              </span>
            ) : (
              'Report Lost Item'
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <p className="text-sm text-indigo-800">
              Once submitted, our system will automatically notify you via email if 
              a matching item is found. Check your spam folder if you don't see our emails.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <LostItems />
        </div>
      </div>
    </div>
  );
}

export default NotifyLostItems;