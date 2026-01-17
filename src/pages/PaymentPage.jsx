import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import bgImage from '../assets/Smart cart bg.png';

// Dynamic API URL - uses Render backend in production, Vite proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname !== 'localhost' ? 'https://unimart-backend-hz8v.onrender.com' : '');

// Helper to update checkout status for LCD
const updateCheckoutStatus = async (cartId, status) => {
  try {
    await fetch(`${API_BASE_URL}/api/cart/${cartId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    console.log('Status update error:', err);
  }
};

// Helper to clear cart after payment
const clearCart = async (cartId) => {
  try {
    await fetch(`${API_BASE_URL}/api/cart/${cartId}/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.log('Cart clear error:', err);
  }
};

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
    
    // Update LCD: Payment ongoing
    await updateCheckoutStatus(cartId, 'checkout');

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
      
      // Update LCD: Processing payment
      await updateCheckoutStatus(cartId, 'processing');

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
          // Update LCD: Payment successful
          await updateCheckoutStatus(cartId, 'success');
          
          // Payment successful - navigate to receipt immediately
          // Backend verification happens in background
          console.log('Razorpay payment successful:', response.razorpay_payment_id);
          
          // Fire and forget - verify in background
          fetch(`${API_BASE_URL}/api/payment/verify`, {
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
          }).catch(err => console.log('Verification background error:', err));

          // Update LCD: Receipt generated
          setTimeout(() => updateCheckoutStatus(cartId, 'receipt'), 1000);
          
          // Reset LCD after 5 seconds
          setTimeout(() => updateCheckoutStatus(cartId, 'idle'), 5000);
          
          // Clear cart after successful payment
          await clearCart(cartId);

          // Navigate immediately
          navigate('/receipt', {
            state: {
              cartId,
              items,
              total,
              paymentId: response.razorpay_payment_id,
              email,
            },
          });
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            updateCheckoutStatus(cartId, 'idle');
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
    
    // Update LCD: Payment ongoing
    await updateCheckoutStatus(cartId, 'checkout');

    try {
      // Update LCD: Processing
      await updateCheckoutStatus(cartId, 'processing');
      
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
      
      // Update LCD: Payment successful
      await updateCheckoutStatus(cartId, 'success');
      
      // Update LCD: Receipt generated
      setTimeout(() => updateCheckoutStatus(cartId, 'receipt'), 1000);
      
      // Reset LCD after 5 seconds
      setTimeout(() => updateCheckoutStatus(cartId, 'idle'), 5000);
      
      // Clear cart after successful payment
      await clearCart(cartId);

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
      updateCheckoutStatus(cartId, 'idle');
    }
  };

  return (
    <div 
      className="min-h-screen py-10"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 glass-dark shadow-2xl border-b border-white/10 mb-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-xl">💳</span>
            Payment Details
          </h1>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {error && (
          <div className="mb-8 glass-card border-l-4 border-red-500 rounded-xl p-4">
            <p className="font-semibold text-red-700 flex items-center gap-2">
              ⚠️ {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">👤</span>
                  Contact Information
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">💰</span>
                  Payment Method
                </h2>
              </div>
              <div className="p-2">
                {/* Razorpay Option */}
                <button
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`w-full p-5 rounded-xl transition flex items-center gap-4 text-left mb-2 ${paymentMethod === 'razorpay' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'razorpay' && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">💳 Online Payment</p>
                    <p className="text-sm text-gray-500 mt-1">Credit Card, Debit Card, UPI, Wallet</p>
                  </div>
                </button>

                {/* Cash Option */}
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`w-full p-5 rounded-xl transition flex items-center gap-4 text-left ${paymentMethod === 'cash' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'cash' && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">💵 Cash Payment</p>
                    <p className="text-sm text-gray-500 mt-1">Pay at the counter</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">📋</span>
                Summary
              </h2>

              <div className="space-y-2 border-b border-gray-200 pb-5 mb-5 max-h-48 overflow-y-auto">
                {items.map((item) => {
                  const quantity = item.qty || item.quantity || 1;
                  return (
                    <div key={item.barcode || item.name} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800">₹{(item.price * quantity).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 mb-5 pb-5 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span className="font-semibold text-gray-800">₹0.00</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-100">
                <p className="text-sm font-semibold text-green-700 mb-1">Total Amount</p>
                <p className="text-4xl font-black text-gray-800">₹{total.toFixed(2)}</p>
              </div>

              <button
                onClick={paymentMethod === 'razorpay' ? handleRazorpayPayment : handleCashPayment}
                disabled={processing}
                className="w-full btn-modern text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    Confirm Payment
                  </>
                )}
              </button>

              <button
                onClick={() => navigate(-1)}
                className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
