import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function LostItems() {
  const { user,token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (!user?.email) return;

    const getItems = async () => {
      setLoading(true);
      try {
    const res = await axios.get(
  `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost-items/${user.email}`,
  {
    withCredentials: true,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
);

console.log("Lost Items API Response:", res.data);

setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log(err)
        setError("Failed to fetch lost items.");
      } finally {
        setLoading(false);
      }
    };

    getItems();
  }, [user?.email]);

  const handleDelete = async (id) => {
    const remaining = items.filter((i) => i._id !== id);
    setItems(remaining);
    setConfirmDelete(null);

    try {
    await axios.delete(
        `${import.meta.env.VITE_EASYFIND_BACKEND_URL}/api/items/lost/${id}`,
        {
      withCredentials: true,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
        }
      );
    } catch (err) {
      setError("Failed to delete item.");
      setItems((prev) => [...prev, items.find((i) => i._id === id)]); // optional rollback
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gradient-to-br from-blue-100 to-gray-100 shadow-lg rounded-2xl">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Lost Items</h2>

      {/* {loading && <p className="text-gray-500 text-center animate-pulse">Loading lost items...</p>} */}
      {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
      { !error && items.length === 0 && (
        <p className="text-gray-500 text-center">No lost items reported yet.</p>
      )}

      <ul className="space-y-6">
        {items.map((item) => (
          <li
            key={item._id}
            className="border border-gray-300 bg-white p-5 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold text-gray-900">{item.itemName}</p>
                <p className="text-sm text-gray-600">
                  Category: <span className="font-medium">{item.category}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Location: <span className="font-medium">{item.location}</span>
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete(item._id)}
                className="bg-red-500 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-md hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>

            {confirmDelete === item._id && (
              <div className="mt-4 flex flex-col space-y-3 bg-gray-100 p-4 rounded-lg shadow-inner">
                <p className="text-gray-700 text-sm">Are you sure you want to delete this item?</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="bg-red-600 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-md hover:bg-red-800 transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="bg-gray-400 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-md hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default LostItems;