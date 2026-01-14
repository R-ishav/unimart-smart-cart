import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCartById, fetchTransactions, removeFromCart, scanBarcode } from '../services/api';
import breadImg from '../assets/bread.png';
import milkImg from '../assets/milk.png';

export default function CustomerDashboard() {
  const { cartId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  // Fetch cart data every 2 seconds (auto-refresh for ESP32 scans)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartData, txnData] = await Promise.all([
          fetchCartById(cartId || 'CART001'),
          fetchTransactions(),
        ]);

        // Items from new cart structure already have qty
        setItems(cartData.items || []);
        setTotal(cartData.total || 0);
        setTransactions(txnData);
        setError('');
        setLoading(false);
      } catch (err) {
        setError('Unable to reach backend');
        console.error(err);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 2 seconds for real-time ESP32 scan updates
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [cartId]);

  // Handle manual barcode scan (for testing without ESP32)
  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    
    try {
      const result = await scanBarcode(cartId || 'CART001', manualBarcode.trim());
      setItems(result.items || []);
      setTotal(result.total || 0);
      setScanMessage(`✓ Added: ${manualBarcode}`);
      setManualBarcode('');
      setTimeout(() => setScanMessage(''), 3000);
    } catch (err) {
      setScanMessage(`✗ ${err.message}`);
      setTimeout(() => setScanMessage(''), 3000);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (barcode) => {
    try {
      const result = await removeFromCart(cartId || 'CART001', barcode);
      setItems(result.items || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    // Map items to expected format for payment page
    const formattedItems = items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.qty,
      barcode: item.barcode,
      category: item.category,
    }));
    
    navigate('/payment', {
      state: {
        cartId: cartId || 'CART001',
        items: formattedItems,
        total,
      },
    });
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      // Remove all items one by one
      for (const item of items) {
        for (let i = 0; i < item.qty; i++) {
          await removeFromCart(cartId || 'CART001', item.barcode);
        }
      }
      setItems([]);
      setTotal(0);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7fee7' }}>
      {/* Header */}
      <div className="text-white shadow-xl" style={{ background: 'linear-gradient(to right, #84cc16, #65a30d)' }}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Shopping Cart</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Cart ID: <span className="font-mono font-bold">{cartId}</span></p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-white px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg"
            style={{ color: '#65a30d' }}
          >
            ← Back Home
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Manual Barcode Input (for testing without ESP32) */}
        <div className="mb-6 bg-white rounded-xl p-4 shadow-lg border-2" style={{ borderColor: '#d9f99d' }}>
          <form onSubmit={handleManualScan} className="flex gap-4 items-center">
            <label className="text-gray-700 font-semibold whitespace-nowrap">Test Scan:</label>
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode (e.g., 8901000000011)"
              className="flex-1 border-2 rounded-lg px-4 py-2"
              style={{ borderColor: '#d9f99d' }}
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#84cc16' }}
            >
              Scan
            </button>
          </form>
          {scanMessage && (
            <p className={`mt-2 text-sm font-medium ${scanMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {scanMessage}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 border-l-4 rounded-lg p-4 shadow-md" style={{ borderColor: '#ef4444' }}>
            <p className="font-semibold" style={{ color: '#b91c1c' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Section Header */}
              <div className="text-gray-800 px-8 py-6 border-b" style={{ borderColor: '#d9f99d' }}>
                <h2 className="text-2xl font-bold">
                  Your Items
                </h2>
              </div>

              {/* Items List */}
              <div className="p-8">
                {loading && <p className="text-center text-gray-500 py-12">Loading items...</p>}

                {!loading && items.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-lg font-semibold">No items yet</p>
                    <p className="text-sm mt-1">Start scanning products from your cart</p>
                  </div>
                )}

                {!loading && items.length > 0 && (
                  <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', flexWrap: 'nowrap', justifyContent: 'center' }}>
                    {items.map((item) => (
                      <div
                        key={item.barcode}
                        className="bg-white border text-center cursor-pointer"
                        style={{ borderColor: '#d9f99d', width: '180px', minWidth: '180px', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '16px', transition: 'all 0.3s ease' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(132, 204, 22, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Product Image */}
                        <div className="w-full flex items-center justify-center" style={{ height: '110px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                          <img 
                            src={item.name.toLowerCase().includes('bread') ? breadImg : item.name.toLowerCase().includes('milk') ? milkImg : undefined}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>

                        {/* Product Name */}
                        <h3 className="font-bold text-gray-800 text-sm mt-2 mb-1 px-2 uppercase" style={{ letterSpacing: '1px' }}>{item.name}</h3>

                        {/* Category Badge */}
                        <span className="text-xs px-2 py-1 rounded-full mx-auto mb-1" style={{ backgroundColor: '#f7fee7', color: '#65a30d' }}>
                          {item.category}
                        </span>

                        {/* Price */}
                        <p className="text-gray-800 font-bold text-base mb-3">₹{item.price.toFixed(2)}</p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-center gap-4 px-5 py-3 w-full border-t mt-auto" style={{ borderColor: '#d9f99d' }}>
                          <button
                            onClick={() => handleRemoveItem(item.barcode)}
                            className="text-red-500 hover:text-red-700 font-bold w-8 h-8 flex items-center justify-center rounded transition text-sm"
                          >
                            −
                          </button>
                          <span className="px-3 font-semibold text-gray-800 min-w-[30px] text-center text-sm">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => scanBarcode(cartId || 'CART001', item.barcode).then(r => { setItems(r.items); setTotal(r.total); })}
                            className="text-green-500 hover:text-green-700 font-bold w-8 h-8 flex items-center justify-center rounded transition text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl shadow-lg p-8 sticky top-6 border-2" style={{ borderColor: '#d9f99d' }}>
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                Order Summary
              </h2>

              <div className="space-y-4 border-b-2 border-gray-200 pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold text-gray-800">₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-gray-800">₹0.00</span>
                </div>
              </div>

              <div className="rounded-xl p-6 mb-6 border-2" style={{ borderColor: '#d9f99d' }}>
               <h2 className="text-2xl font-bold text-gray-800 mb-8">
                Total Amount
              </h2>
                <p className="text-2xl font-bold text-gray-800">₹{total.toFixed(2)}</p>
                <p className="text-xs mt-2 text-gray-500">
                  Items: {items.reduce((sum, item) => sum + item.qty, 0)}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                  className="w-full text-white font-bold transition transform hover:scale-105 shadow-lg disabled:cursor-not-allowed"
                  style={{ backgroundColor: items.length === 0 ? '#9ca3af' : '#84cc16', padding: '16px 16px', fontSize: '18px', minHeight: '60px', borderRadius: '24px' }}
                  onMouseEnter={(e) => { if (items.length > 0) e.target.style.backgroundColor = '#65a30d'; }}
                  onMouseLeave={(e) => { if (items.length > 0) e.target.style.backgroundColor = '#84cc16'; }}
                >
                  Proceed to Checkout
                </button><br></br>
                <button
                  onClick={handleClearCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition"
                >
                  Clear Cart
                </button>
              </div>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
