import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Dynamic API URL - uses Render backend in production, Vite proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname !== 'localhost' ? 'https://unimart-backend-hz8v.onrender.com' : '');

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartId, items = [], total = 0 } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!cartId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid cart. Please go back.</p>
          <button onClick={() => navigate('/')} className="bg-blue-500 text-white px-6 py-2 rounded">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleRazorpayPayment = async () => {
    if (!email || !phone) {
      setError('Please enter email and phone number');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Create order on backend
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          cartId,
          email,
          phone,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');
      const { orderId, key } = await response.json();

      // Initialize Razorpay
      const options = {
        key,
        amount: total * 100, // Amount in paise
        currency: 'INR',
        name: 'Smart Cart',
        description: `Cart ID: ${cartId}`,
        order_id: orderId,
        prefill: {
          email,
          contact: phone,
        },
        handler: async (response) => {
          // Verify payment on backend
          const verifyResponse = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cartId,
              email,
              items,
              total,
              paymentMethod: 'ONLINE',
            }),
          });

          if (verifyResponse.ok) {
            navigate('/receipt', {
              state: {
                cartId,
                items,
                total,
                paymentId: response.razorpay_payment_id,
                email,
              },
            });
          } else {
            setError('Payment verification failed');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Create cash payment transaction
      const response = await fetch(`${API_BASE_URL}/api/payment/cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          cartId,
          email: email || 'walk-in',
          phone: phone || 'N/A',
          items,
          paymentMethod: 'CASH',
        }),
      });

      if (!response.ok) throw new Error('Failed to process cash payment');
      const { transactionId } = await response.json();

      navigate('/receipt', {
        state: {
          cartId,
          items,
          total,
          paymentId: transactionId,
          email: email || 'Walk-in Customer',
          method: 'CASH',
        },
      });
    } catch (err) {
      setError(err.message || 'Payment processing failed');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: '#f7fee7' }}>
      {/* Header */}
      <div className="text-white shadow-xl mb-10" style={{ background: 'linear-gradient(to right, #84cc16, #65a30d)' }}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            Payment Details
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {error && (
          <div className="mb-8 border-l-4 rounded-lg p-4 shadow-md" style={{ borderColor: '#ef4444' }}>
            <p className="font-semibold flex items-center gap-2" style={{ color: '#b91c1c' }}>
              <span>⚠️</span> {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="text-gray-800 px-8 py-6 border-b" style={{ borderColor: '#d9f99d' }}>
                <h2 className="text-2xl font-bold">
                  Contact Information
                </h2>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition font-medium"
                    style={{ borderColor: '#d9f99d', backgroundColor: '#f7fee7' }}
                    onFocus={(e) => e.target.style.borderColor = '#84cc16'}
                    onBlur={(e) => e.target.style.borderColor = '#d9f99d'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition font-medium"
                    style={{ borderColor: '#d9f99d', backgroundColor: '#f7fee7' }}
                    onFocus={(e) => e.target.style.borderColor = '#84cc16'}
                    onBlur={(e) => e.target.style.borderColor = '#d9f99d'}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="text-gray-800 px-8 py-6 border-b" style={{ borderColor: '#d9f99d' }}>
                <h2 className="text-2xl font-bold">
                  Payment Method
                </h2>
              </div>
              <div className="space-y-2">
                {/* Razorpay Option */}
                <button
                  onClick={() => setPaymentMethod('razorpay')}
                  className="w-full p-4 border-b transition flex items-start gap-4 text-left hover:bg-gray-50"
                  style={{ borderColor: '#d9f99d' }}
                >
                  <input 
                    type="radio" 
                    checked={paymentMethod === 'razorpay'} 
                    readOnly 
                    className="mt-1 flex-shrink-0"
                    style={{ accentColor: '#84cc16' }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">💳 Online Payment (Razorpay)</p>
                    <p className="text-xs text-gray-600 mt-1">Credit Card, Debit Card, UPI, Wallet</p>
                  </div>
                </button>

                {/* Cash Option */}
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className="w-full p-4 transition flex items-start gap-4 text-left hover:bg-gray-50"
                >
                  <input 
                    type="radio" 
                    checked={paymentMethod === 'cash'} 
                    readOnly 
                    className="mt-1 flex-shrink-0"
                    style={{ accentColor: '#84cc16' }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">💵 Cash Payment</p>
                    <p className="text-xs text-gray-600 mt-1">Pay at the counter</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl shadow-lg p-8 sticky top-6 border-2" style={{ borderColor: '#d9f99d' }}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                Summary
              </h2>

              <div className="space-y-3 border-b-2 pb-6 mb-6" style={{ borderColor: '#d9f99d' }}>
                {items.map((item) => {
                  const quantity = item.qty || item.quantity || 1;
                  return (
                    <div key={item.barcode || item.name} className="flex justify-between items-center p-3 rounded-lg border" style={{ borderColor: '#d9f99d', backgroundColor: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {quantity}</p>
                        {item.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f7fee7', color: '#65a30d' }}>{item.category}</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-800">
                        ₹{(item.price * quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 mb-6 pb-6" style={{ borderBottom: '2px solid #d9f99d' }}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-semibold text-gray-800">₹0.00</span>
                </div>
              </div>

              <div className="rounded-xl p-6 mb-6 border-2" style={{ borderColor: '#d9f99d' }}>
                <p className="text-sm font-semibold uppercase tracking-wide mb-1 text-gray-600">Total Amount</p>
                <p className="text-6xl font-black text-gray-800">₹{total.toFixed(2)}</p>
              </div>

              <button
                onClick={
                  paymentMethod === 'razorpay' ? handleRazorpayPayment : handleCashPayment
                }
                disabled={processing}
                className="w-full text-white font-bold transition flex items-center justify-center gap-1"
                style={{ padding: '3px 16px', fontSize: '10px', minHeight: '12px', borderRadius: '8px', backgroundColor: processing ? '#9ca3af' : '#84cc16' }}
                onMouseEnter={(e) => { if (!processing) e.target.style.backgroundColor = '#65a30d'; }}
                onMouseLeave={(e) => { if (!processing) e.target.style.backgroundColor = '#84cc16'; }}
              >
                {processing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="1" fill="white" />
                      <path fillRule="evenodd" d="M12 19a7 7 0 100-14 7 7 0 000 14zm0 2a9 9 0 110-18 9 9 0 010 18z" opacity="0.2" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    Confirm
                  </>
                )}
              </button>
<br></br>
              <button
                onClick={() => navigate(-1)}
                className="w-full mt-2 text-gray-800 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                style={{ padding: '3px 18px', fontSize: '8px', borderRadius: '8px', backgroundColor: '#e5e7eb' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
