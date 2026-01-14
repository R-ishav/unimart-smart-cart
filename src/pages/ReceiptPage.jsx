import { useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import html2pdf from 'html2pdf.js';

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
    <div className="min-h-screen py-10 flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#f7fee7' }}>
      <div className="max-w-2xl w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2" style={{ color: '#65a30d' }}>Payment Successful!</h1>
          <p className="text-xl" style={{ color: '#65a30d' }}>Thank you for your purchase</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8" ref={receiptRef}>
          {/* Header */}
          <div className="text-white px-8 py-8" style={{ background: 'linear-gradient(to right, #84cc16, #65a30d)' }}>
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Smart Cart Receipt</h2>
              <p className="text-lime-100 text-sm">Order Receipt & Summary</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Order Details */}
            <div className="grid grid-cols-2 gap-6 mb-8 pb-8" style={{ borderBottom: '2px solid #d9f99d' }}>
              <div>
                <p className="text-sm font-semibold uppercase mb-1" style={{ color: '#65a30d' }}>Receipt #</p>
                <p className="text-2xl font-bold" style={{ color: '#1f2937' }}>{paymentId || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold uppercase mb-1" style={{ color: '#65a30d' }}>Cart ID</p>
                <p className="text-2xl font-bold" style={{ color: '#1f2937' }}>{cartId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase mb-1" style={{ color: '#65a30d' }}>Date & Time</p>
                <p className="font-semibold" style={{ color: '#1f2937' }}>{currentDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold uppercase mb-1" style={{ color: '#65a30d' }}>Payment</p>
                <p className="font-semibold" style={{ color: '#1f2937' }}>{method}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mb-8 pb-8" style={{ borderBottom: '2px solid #d9f99d' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: '#65a30d' }}>
                Items Purchased
              </h3>
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const quantity = item.qty || item.quantity || 1;
                  return (
                    <div key={item.barcode || idx} className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: '#ffffff', border: '2px solid #d9f99d' }}>
                      <div>
                        <p className="font-semibold" style={{ color: '#1f2937' }}>{item.name}</p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>Unit Price: ₹{item.price.toFixed(2)}</p>
                        {item.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f7fee7', color: '#65a30d' }}>{item.category}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: '#6b7280' }}>Qty: {quantity}</p>
                        <p className="font-bold text-lg" style={{ color: '#1f2937' }}>
                          ₹{(item.price * quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between" style={{ color: '#374151' }}>
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#374151' }}>
                <span className="font-medium">Tax (0%):</span>
                <span className="font-semibold">₹0.00</span>
              </div>
              <div className="flex justify-between" style={{ color: '#374151' }}>
                <span className="font-medium">Discount:</span>
                <span className="font-semibold">₹0.00</span>
              </div>
              <div className="pt-4 flex justify-between items-center p-4 rounded-lg" style={{ borderTop: '2px solid #d9f99d', backgroundColor: '#ffffff', border: '2px solid #d9f99d' }}>
                <span className="text-lg font-bold" style={{ color: '#1f2937' }}>Total Amount:</span>
                <span className="text-5xl font-black" style={{ color: '#84cc16' }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6" style={{ borderTop: '2px solid #d9f99d' }}>
              <p className="font-semibold mb-2" style={{ color: '#374151' }}>Thank you for shopping with Smart Cart!</p>
              {email && email !== 'walk-in' && email !== 'Walk-in Customer' && (
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  Receipt copy sent to: <span className="font-semibold">{email}</span>
                </p>
              )}
              <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                This is an electronically generated receipt
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={printReceipt}
            className="text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: '#84cc16' }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#65a30d'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = '#84cc16'; }}
          >
            Print Receipt
          </button>
          <button
            onClick={generatePDF}
            className="text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: '#84cc16' }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#65a30d'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = '#84cc16'; }}
          >
            Download PDF
          </button>
        </div>

        {/* Return Button */}
        <button
          onClick={() => {
            // Reset cart on backend
            fetch('http://localhost:3000/api/bill/reset', { method: 'POST' });
            navigate('/');
          }}
          className="w-full text-white font-bold py-4 rounded-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 text-lg"
          style={{ background: 'linear-gradient(to right, #84cc16, #65a30d)' }}
          onMouseEnter={(e) => { e.target.style.background = 'linear-gradient(to right, #65a30d, #5a9c0d)'; }}
          onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(to right, #84cc16, #65a30d)'; }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
