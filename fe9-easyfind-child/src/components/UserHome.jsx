import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FEEDBACK_EMAIL = import.meta.env.VITE_FEEDBACK_EMAIL || 'support@vjstartup.com';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-gray-100 flex flex-col">
      {/* Live Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 text-center">
        <p className="text-sm font-medium">
          🚀 Welcome to EasyFind – Your Trusted Campus Lost &amp; Found Solution
        </p>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome, {user?.name || 'Valued User'}.
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            EasyFind is dedicated to ensuring that every lost item finds its way back to its owner. Please choose an option below to begin.
          </p>
        </div>

        {/* Action Cards */}
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-8 mb-12">
          {/* Report Found Item Card */}
          <div className="bg-white shadow-xl rounded-2xl p-6 w-full md:flex-1 min-h-[40rem] transition-transform transform hover:scale-105">
            <div className="flex flex-col items-center text-center h-full justify-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Discovered an Item?</h2>
              <p className="text-gray-600 mb-4 max-w-sm">
                Kindly report your discovery to assist in reuniting the item with its rightful owner.
              </p>
              <button
                onClick={() => navigate('/dashboard/report-item')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center"
              >
                Report an Item
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search Lost Item Card */}
          <div className="bg-white shadow-xl rounded-2xl p-6 w-full md:flex-1 min-h-[40rem] transition-transform transform hover:scale-105">
            <div className="flex flex-col items-center text-center h-full justify-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7l1.664 12.136A2 2 0 006.648 21h10.704a2 2 0 001.984-1.864L21 7m-18 0a2 2 0 012-2h14a2 2 0 012 2m-18 0h18"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Misplaced an Item?</h2>
              <p className="text-gray-600 mb-4 max-w-sm">
                Please search our verified listings to locate and reclaim your valuable possessions.
              </p>
              <button
                onClick={() => navigate('/dashboard/search-item')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center"
              >
                Search for Items
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 transform hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            How It Works
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Found Item Process */}
            <div className="bg-blue-50 rounded-xl p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-t-xl"/>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">1</span>
                Report the Discovery
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Provide Detailed Information</p>
                    <p className="text-gray-600 text-sm">
                      Complete a concise form outlining the item’s description and attach a photograph.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Deposit the Item</p>
                    <p className="text-gray-600 text-sm">
                      Deliver the item to campus security for formal verification and secure handling.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lost Item Process */}
            <div className="bg-purple-50 rounded-xl p-6 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-t-xl"/>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center">2</span>
                Locate and Reclaim
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-purple-200 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Search the Catalogued Listings</p>
                    <p className="text-gray-600 text-sm">
                      Meticulously review the reported items to identify your lost possession.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-purple-200 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Receive Timely Alerts</p>
                    <p className="text-gray-600 text-sm">
                      Our system will notify you promptly should a matching item be identified.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-purple-200 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Confirm and Reclaim</p>
                    <p className="text-gray-600 text-sm">
                      Once verified, proceed with the secure process to retrieve your item.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Feedback Button */}
      <footer className="mt-auto w-full border-t border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('EasyFind Feedback')}&body=${encodeURIComponent('Hi EasyFind Team,\n\nI would like to share the following feedback:\n\n')}`}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium shadow hover:bg-blue-700 transition-colors"
          >
            Send Feedback
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
