import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MyMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    fetchMyMatches();
  }, []);

  const fetchMyMatches = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userEmail = JSON.parse(atob(token.split('.')[1]))?.email;
      
      // Get user's lost items using the email
      const lostItemsResponse = await axios.get(`http://localhost:3115/api/items/lost-items/${userEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const lostItems = lostItemsResponse.data || [];
      
      // Get all verified found items
      const foundItemsResponse = await axios.get('http://localhost:3115/api/items/found', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const foundItems = foundItemsResponse.data || [];
      
      // Match lost items with found items based on category and semantic similarity
      const matchedItems = [];
      
      for (const lostItem of lostItems) {
        for (const foundItem of foundItems) {
          if (foundItem.status === 'verified' && 
              foundItem.category === lostItem.category) {
            matchedItems.push({
              foundItem,
              lostItem,
              matchScore: calculateMatchScore(lostItem, foundItem)
            });
          }
        }
      }
      
      setMatches(matchedItems);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
      setLoading(false);
    }
  };

  const calculateMatchScore = (lostItem, foundItem) => {
    // Simple matching based on category and description keywords
    let score = 50; // Base score for category match
    
    const lostKeywords = (lostItem.description || '').toLowerCase().split(' ');
    const foundKeywords = (foundItem.description || '').toLowerCase().split(' ');
    
    const commonWords = lostKeywords.filter(word => 
      foundKeywords.some(fWord => fWord.includes(word) || word.includes(fWord))
    );
    
    score += Math.min(commonWords.length * 5, 50);
    
    return Math.min(score, 100);
  };

  const handleClaimItem = async (foundItemId, lostItemId) => {
    if (!window.confirm('Are you sure you want to claim this item? This will submit a claim for admin review.')) {
      return;
    }

    try {
      setClaiming(foundItemId);
      const token = localStorage.getItem('authToken');
      
      await axios.post(
        'http://localhost:3115/api/claims',
        { foundItemId, lostItemId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('✅ Claim submitted successfully! You can track it in "My Claims".');
      fetchMyMatches(); // Refresh matches
    } catch (err) {
      console.error('Error claiming item:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit claim';
      alert(`❌ ${errorMsg}`);
    } finally {
      setClaiming(null);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading matches...</div>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Matches</h1>
        <p className="text-gray-600">
          Items that match your lost item reports
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matches Found</h3>
          <p className="text-gray-600 mb-4">
            We'll notify you when we find items matching your lost item reports.
          </p>
          <Link
            to="/dashboard/search-item"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            Browse Found Items
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <h3 className="font-semibold text-lg truncate">
                  {match.foundItem.itemName}
                </h3>
                <p className="text-blue-100 text-sm">
                  {match.foundItem.category}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Item Image */}
                {match.foundItem.image?.url && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={match.foundItem.image.url}
                      alt={match.foundItem.itemName}
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                  </div>
                )}

                {/* Match Score */}
                <div className="mb-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getMatchScoreColor(match.matchScore)}`}>
                    {match.matchScore}% Match
                  </span>
                </div>

                {/* Item Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Found Location:</span>
                    <p className="font-medium">{match.foundItem.foundLocation}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date Found:</span>
                    <p className="font-medium">{formatDate(match.foundItem.reportedDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Item Code:</span>
                    <p className="font-mono font-bold text-blue-600">
                      {match.foundItem.code}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {match.foundItem.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {match.foundItem.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link
                    to={`/dashboard/search-item`}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span>👁️</span>
                    View Details
                  </Link>
                  <button
                    onClick={() => handleClaimItem(match.foundItem._id, match.lostItem._id)}
                    disabled={claiming === match.foundItem._id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>✓</span>
                    {claiming === match.foundItem._id ? 'Submitting...' : 'Claim This Item'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-semibold text-blue-900 mb-2">📋 How It Works</h4>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>We automatically match found items with your lost item reports</li>
          <li>Click "Claim This Item" to submit a claim for admin review</li>
          <li>Admin will review and approve/reject your claim</li>
          <li>If approved, you'll receive a QR code via email for pickup</li>
          <li>Visit the security office with your QR code and college ID</li>
        </ol>
      </div>
    </div>
  );
};

export default MyMatches;