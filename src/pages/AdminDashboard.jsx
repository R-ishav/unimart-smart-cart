import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminPassword] = useState('admin123'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    activeOrders: 0,
  });
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      const interval = setInterval(fetchTransactions, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, filter]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();

      // Filter transactions based on selected filter
      let filtered = data;
      if (filter === 'ADD') {
        filtered = data.filter((t) => t.action === 'ADD');
      } else if (filter === 'REMOVE') {
        filtered = data.filter((t) => t.action === 'REMOVE');
      }

      setTransactions(filtered);

      // Calculate stats
      const totalRevenue = filtered
        .filter((t) => t.action === 'ADD')
        .reduce((sum, t) => sum + t.price, 0);

      const totalTransactions = filtered.length;
      const activeOrders = filtered.filter((t) => t.action === 'ADD').length;

      setStats({
        totalRevenue,
        totalTransactions,
        activeOrders,
      });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl backdrop-blur-xl border border-gray-700 p-10 max-w-md w-full z-10">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-400 text-sm">Smart Cart Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mb-6">
            <div>
              <label className="block text-gray-300 font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition font-medium"
              />
            </div>

            {error && (
              <div className="bg-red-900 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-red-200 font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-lg transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              Login to Admin
            </button>
          </form>

          <div className="pt-6 border-t border-gray-700 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center justify-center gap-2 w-full py-2 transition hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back to Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-100 text-sm mt-1">Smart Cart Management System</p>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              navigate('/');
            }}
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg"
          >
            ← Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Revenue Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-semibold uppercase mb-2">Total Revenue</p>
                  <p className="text-5xl font-black">₹{stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-6xl opacity-30">💰</div>
              </div>
            </div>
            <div className="px-6 py-4 bg-green-50">
              <p className="text-xs text-green-700 font-semibold">Total items sold</p>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold uppercase mb-2">Total Transactions</p>
                  <p className="text-5xl font-black">{stats.totalTransactions}</p>
                </div>
                <div className="text-6xl opacity-30">📊</div>
              </div>
            </div>
            <div className="px-6 py-4 bg-blue-50">
              <p className="text-xs text-blue-700 font-semibold">Add + Remove operations</p>
            </div>
          </div>

          {/* Active Orders Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-6 py-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-semibold uppercase mb-2">Active Orders</p>
                  <p className="text-5xl font-black">{stats.activeOrders}</p>
                </div>
                <div className="text-6xl opacity-30">🛒</div>
              </div>
            </div>
            <div className="px-6 py-4 bg-purple-50">
              <p className="text-xs text-purple-700 font-semibold">Items currently in carts</p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z"/>
              </svg>
              Transaction History
            </h2>

            <div className="flex gap-2">
              {['ALL', 'ADD', 'REMOVE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-bold transition transform hover:scale-105 ${
                    filter === f
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left font-bold text-gray-800">Action</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-800">Item Name</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-800">Price</th>
                  <th className="px-6 py-4 text-left font-bold text-gray-800">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-600">
                      <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z"/>
                      </svg>
                      <p className="text-lg font-semibold">No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 50).map((txn, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span
                          className={`px-4 py-2 rounded-full text-xs font-bold ${
                            txn.action === 'ADD'
                              ? 'bg-green-100 text-green-700'
                              : txn.action === 'REMOVE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {txn.action === 'ADD' ? '✓ ' : txn.action === 'REMOVE' ? '✗ ' : '⟲ '}
                          {txn.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{txn.item}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">
                        ₹{txn.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs font-mono">
                        {new Date(txn.timestamp).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-center text-gray-600 text-sm font-semibold">
            Displaying {Math.min(50, transactions.length)} of {transactions.length} total transactions
          </div>
        </div>
      </div>
    </div>
  );
}
