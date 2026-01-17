import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import scannerIcon from '../assets/scanner.png';

export default function LandingPage() {
  const videoRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cartId, setCartId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const startScanner = async () => {
    try {
      setScanning(true);
      setError('');
      
      // Wait for video element to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        setError('Video element not ready. Please try again.');
        setScanning(false);
        return;
      }
      
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          const scannedId = result.data;
          setCartId(scannedId);
          qrScanner.stop();
          setScanning(false);
          
          // Navigate to dashboard with cart ID
          navigate(`/dashboard/${scannedId}`);
        },
        {
          onDecodeError: () => {
            // Silently ignore decode errors
          },
          preferredCamera: 'environment', // Use back camera for mobile devices
          highlightCodeOutlineColor: 'rgb(249, 115, 22)',
          highlightScanRegion: true,
        }
      );
      
      await qrScanner.start();
    } catch (err) {
      console.error('Scanner error:', err);
      setError(`Camera error: ${err.message || 'Please allow camera permissions and try again.'}`);
      setScanning(false);
    }
  };

  const handleManualInput = (e) => {
    e.preventDefault();
    if (!cartId.trim()) {
      setError('Please enter a cart ID');
      return;
    }
    navigate(`/dashboard/${cartId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#f7fee7' }}>
      {/* Simple lime themed background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ background: 'linear-gradient(to bottom right, #d9f99d, #bef264)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" style={{ background: 'linear-gradient(to bottom right, #bef264, #a3e635)' }}></div>
      </div>

      <div className="relative z-10 w-full animate-fadeInUp">
        {/* Header */}
        <div className="text-center mb-1">
          <h2 className="text-3xl" style={{ color: '#111827', fontFamily: "'Bruno Ace', cursive",marginTop: '8rem', marginBottom: '-2.5rem', lineHeight: '1' }}>Welcome to</h2>
          <h1 className="font-black" style={{ letterSpacing: '0.05em', color: '#65a30d', fontSize: '4rem', fontFamily: "'Modak', cursive", lineHeight: '1', marginBottom: '-2rem' }}>
            UniMart
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>The Smart Shopping Experience</p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl p-30 max-w-md mx-auto" style={{ borderColor: '#d9f99d' }}>
          {/* Welcome Section */}
          <div className="rounded-xl p-6 mb-8" style={{ borderColor: '#d9f99d' }}>
            <div className="text-center">
              <p className="text-base" style={{ color: '#374151' }}>Scan the QR code on the Cart.</p>
            </div>
          </div>

          {/* QR Scanner */}
          {scanning && (
            <div className="mb-8 flex justify-center">
              <video
                ref={videoRef}
                className="rounded-2xl border-4 shadow-lg"
                style={{ aspectRatio: '1', borderColor: '#84cc16', maxWidth: '300px', width: '100%' }}
              />
            </div>
          )}

          {scanning && (
            <p className="text-center text-sm mb-4" style={{ color: '#4b5563' }}>Align the QR code in the frame</p>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="w-full text-white font-bold py-5 rounded-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 flex items-center justify-center"
                style={{ backgroundColor: '#84cc16', borderColor: '#65a30d' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#65a30d'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#84cc16'}
              >
                <img src={scannerIcon} alt="Scanner" style={{ width: '24px', height: '24px' }} />
              </button>
            ) : (
              <button
                onClick={() => setScanning(false)}
                className="w-full text-white font-bold py-5 rounded-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-4"
                style={{ backgroundColor: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                <span className="text-lg">Stop Scanner</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#d9f99d' }}></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-sm font-medium" style={{ backgroundColor: '#f7fee7', color: '#4b5563' }}>Or enter manually</span>
            </div>
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualInput} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>Cart ID<br></br></label>
              <input
                type="text"
                placeholder="e.g., 10000"
                value={cartId}
                onChange={(e) => setCartId(e.target.value)}
                className="w-full px-5 py-4 border-2 rounded-lg transition-all duration-200 text-lg font-medium"
                style={{ backgroundColor: 'transparent', borderColor: '#d9f99d', color: '#111827' }}
              />
            </div>
            <button
              type="submit"
              className="w-full text-white font-bold py-5 rounded-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 flex items-center justify-center"
              style={{ backgroundColor: '#84cc16' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#65a30d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#84cc16'}
            >
              Continue Shopping
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 border rounded-lg p-4" style={{ backgroundColor: 'transparent', borderColor: '#fca5a5' }}>
              <p className="text-sm text-center" style={{ color: '#b91c1c' }}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-8 left-0 right-0 text-center">
          <p style={{ color: '#6b7280', fontSize: '0.6rem' }}>
            Powered by UniMart • Fast • Secure • Convenient
          </p>
        </div>
      </div>
    </div>
  );
}
