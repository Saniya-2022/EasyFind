import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReportedItems from './ReportedItems'; // Import the component

const StudentProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReported, setShowReported] = useState(false);

  if (!user) {
    return <div className="text-center text-red-500">Please log in to view your profile</div>;
  }

  const extractRollNumber = (email) => {
    const atIndex = email?.indexOf('@');
    if (atIndex === -1) return 'Invalid email';
    return email?.substring(0, atIndex)?.toUpperCase();
  };

  const rollNumber = extractRollNumber(user?.email);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 to-gray-100 p-4">
      <div className="mx-auto mt-8 w-full max-w-xl">
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6 text-center">
            Student Profile
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <label className="w-32 font-medium text-gray-700">Name:</label>
              <span className="text-gray-600">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <label className="w-32 font-medium text-gray-700">Roll Number:</label>
              <span className="text-gray-600">{rollNumber}</span>
            </div>
            <div className="flex items-center">
              <label className="w-64 font-medium text-gray-700">
                Need to check Reported Items? Click here:
              </label>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 transform hover:scale-105"
                onClick={() => setShowReported(true)}
              >
                Show Reported Items
              </button>
            </div>
          </div>

          {/* Conditionally render ReportedItems component */}
          {showReported && <ReportedItems userEmail={user?.email} />}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
