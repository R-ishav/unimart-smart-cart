import { useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import bgImage from '../assets/Smart cart bg.png';

export default function ReceiptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  const {
    cartId,
    items = [],
    total = 0,
    paymentId,
    email,
    method = 'ONLINE',
  } = location.state || {};

  const currentDate = new Date().toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const generatePDF = () => {
    const element = receiptRef.current;
    const opt = {
      margin: 10,
      filename: `receipt_${cartId}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().set(opt).from(element).save();
  };

  const printReceipt = () => {
    const element = receiptRef.current;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<pre>');
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</pre>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div 
      className="min-h-screen py-10 flex flex-col items-center justify-center px-6"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40" style={{ animation: 'float 3s ease-in-out infinite' }}>
            <span className="text-5xl">✓</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2" style={{ textShadow: '0 0 40px rgba(34, 197, 94, 0.5)' }}>Payment Successful!</h1>
          <p className="text-green-400 font-medium">Thank you for your purchase</p>
        </div>

        {/* Receipt Card */}
        <div className="glass-card rounded-3xl overflow-hidden mb-8" ref={receiptRef}>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">Smart Cart Receipt</h2>
              <p className="text-green-100 text-sm">Order Receipt & Summary</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Order Details */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold uppercase text-green-600 mb-1">Receipt #</p>
                <p className="text-lg font-bold text-gray-800">{paymentId || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-green-600 mb-1">Cart ID</p>
                <p className="text-lg font-bold text-gray-800">{cartId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-green-600 mb-1">Date & Time</p>
                <p className="font-medium text-gray-800">{currentDate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase text-green-600 mb-1">Payment</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${method === 'CASH' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {method}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-sm font-bold text-green-600 uppercase tracking-wide mb-4">Items Purchased</h3>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const quantity = item.qty || item.quantity || 1;
                  return (
                    <div key={item.barcode || idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} × {quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800 text-lg">₹{(item.price * quantity).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (0%):</span>
                <span className="font-semibold text-gray-800">₹0.00</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 mt-4">
                <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                <span className="text-3xl font-black text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-5 border-t border-gray-200">
              <p className="font-semibold text-gray-700 mb-2">Thank you for shopping with Smart Cart!</p>
              {email && email !== 'walk-in' && email !== 'Walk-in Customer' && (
                <p className="text-sm text-gray-500">Receipt copy sent to: <span className="font-semibold text-green-600">{email}</span></p>
              )}
              <p className="text-xs mt-2 text-gray-400">This is an electronically generated receipt</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={printReceipt}
            className="glass text-white font-bold py-4 px-6 rounded-xl transition-all hover:bg-white/20 flex items-center justify-center gap-2"
          >
            <span>🖨️</span> Print
          </button>
          <button
            onClick={generatePDF}
            className="glass text-white font-bold py-4 px-6 rounded-xl transition-all hover:bg-white/20 flex items-center justify-center gap-2"
          >
            <span>📄</span> Download PDF
          </button>
        </div>

        {/* Return Button */}
        <button
          onClick={() => {
            fetch('http://localhost:3000/api/bill/reset', { method: 'POST' });
            navigate('/');
          }}
          className="w-full btn-modern text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return to Home
        </button>
      </div>
    </div>
  );
}
