import { useState, useEffect } from 'react';
import axios from 'axios';


const EditItemPage = () => {
    // Cookie-based auth; no localStorage token
    const [items, setItems] = useState([]);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const token = localStorage.getItem('adminAuthToken');

    const filteredItems = items.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/found`, {
                    headers: {
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    withCredentials: true,
                });
                console.log('Fetched items:', res.data); // Debug log
                console.log('First item image:', res.data[0]?.image); // Check image structure
                setItems(res.data);
            } catch (err) {
                setError('Failed to fetch items');
                console.error('Error fetching items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handleEditClick = (item) => {
        setEditItem({ 
            ...item,
            claimerDetails: item.claimerDetails || { name: '', rollNo: '', contact: '' }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setEditItem(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setEditItem(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpdate = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/edit-item/${editItem._id}`,
                editItem,
                {
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  withCredentials: true,
                },
            );
            setItems(items.map(item => item._id === editItem._id ? editItem : item));
            setEditItem(null);
        } catch (err) {
            console.error('Error updating item:', err);
            setError('Failed to update item');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/admin/edit-item/${deleteId}`,
                {
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  withCredentials: true,
                }
            );
            setItems(items.filter((i) => i._id !== deleteId));
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete item');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Found Items</h1>
                    <input
                        type="text"
                        placeholder="Search by name, code, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                    />
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div key={item._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {/* Image Section */}
                                {item.image?.url && (
                                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                        <img 
                                            src={item.image.url} 
                                            alt={item.itemName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.log('Image load error for item:', item._id);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                                            <p className="text-sm text-gray-500 mt-1">Code: {item.code}</p>
                                            <p className="text-sm text-gray-500">Category: {item.category}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            item.status === 'verified' ? 'bg-green-100 text-green-800' :
                                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeleteId(item._id);
                                                setShowDeleteModal(true);
                                            }}
                                            className="inline-flex items-center px-3 py-1.5 border border-red-200 rounded-md text-red-600 hover:bg-red-50"
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                {editItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-semibold">Edit Item Details</h3>
                                <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-gray-500">
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Image Preview Section */}
                            {editItem.image?.url && (
                                <div className="p-6 border-b border-gray-200 bg-gray-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
                                    <div className="flex justify-center">
                                        <img 
                                            src={editItem.image.url} 
                                            alt={editItem.itemName}
                                            className="max-h-64 w-auto object-contain rounded-lg border border-gray-300"
                                            onError={(e) => {
                                                console.log('Modal image error:', editItem);
                                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                                        <input
                                            type="text"
                                            name="itemName"
                                            value={editItem.itemName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={editItem.code}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <select
                                            name="category"
                                            value={editItem.category}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="ID Card/Student Card">ID Card/Student Card</option>
                                            <option value="Keys">Keys</option>
                                            <option value="Calculator">Calculator</option>
                                            <option value="Earbuds/Headphones">Earbuds/Headphones</option>
                                            <option value="Water Bottle/Tumbler">Water Bottle/Tumbler</option>
                                            <option value="USB Drive">USB Drive</option>
                                            <option value="Wallet/Purse">Wallet/Purse</option>
                                            <option value="Watch">Watch</option>
                                            <option value="Sunglasses/Eyeglasses">Sunglasses/Eyeglasses</option>
                                            <option value="Stationery">Stationery</option>
                                            {/* <option value="Professional Camera">Professional Camera</option> */}
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            name="status"
                                            value={editItem.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="verified">Verified</option>
                                            <option value="claimed">Claimed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Found Location</label>
                                        <input
                                            type="text"
                                            name="foundLocation"
                                            value={editItem.foundLocation}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Handover Location</label>
                                        <input
                                            type="text"
                                            name="handoverLocation"
                                            value={editItem.handoverLocation}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={editItem.description}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Claimer Details Section */}
                            <div className="p-6 border-t border-gray-200 bg-green-50">
                                <h4 className="text-lg font-medium text-green-700 mb-4">Claimer Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            name="claimerDetails.name"
                                            value={editItem.claimerDetails?.name || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Roll No</label>
                                        <input
                                            type="text"
                                            name="claimerDetails.rollNo"
                                            value={editItem.claimerDetails?.rollNo || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                                        <input
                                            type="text"
                                            name="claimerDetails.contact"
                                            value={editItem.claimerDetails?.contact || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={() => setEditItem(null)}
                                    className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-xl font-semibold text-red-600">Confirm Deletion</h3>
                            </div>
                            
                            <div className="p-6">
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to delete this item? This action cannot be undone.
                                </p>
                                
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                                    >
                                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditItemPage;