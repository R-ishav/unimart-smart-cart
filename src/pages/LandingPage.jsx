import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import scannerIcon from '../assets/scanner.png';
import bgImage from '../assets/Smart cart bg.png';

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
          navigate(`/dashboard/${scannedId}`);
        },
        {
          onDecodeError: () => {},
          preferredCamera: 'environment',
          highlightCodeOutlineColor: '#22c55e',
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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30" style={{ animation: 'float 3s ease-in-out infinite' }}>
              <span className="text-4xl">🛒</span>
            </div>
          </div>
          <h2 className="text-2xl font-light text-white/80 mb-1" style={{ fontFamily: "'Bruno Ace', cursive" }}>
            Welcome to
          </h2>
          <h1 className="text-6xl font-black text-white mb-2" style={{ fontFamily: "'Modak', cursive", textShadow: '0 0 40px rgba(34, 197, 94, 0.5)' }}>
            UniMart
          </h1>
          <p className="text-green-400 text-sm font-medium tracking-widest uppercase">
            Smart Shopping Experience
          </p>
        </div>

        {/* Main Card - Glassmorphism */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          {/* Welcome message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-green-600 text-sm font-medium">Ready to scan</span>
            </div>
            <p className="text-gray-600">Scan the QR code on your cart to begin</p>
          </div>

          {/* QR Scanner View */}
          {scanning && (
            <div className="mb-6">
              <div className="relative rounded-2xl overflow-hidden border-4 border-green-500 shadow-lg shadow-green-500/20">
                <video
                  ref={videoRef}
                  className="w-full"
                  style={{ aspectRatio: '1' }}
                />
                <div className="absolute inset-0 border-[3px] border-white/30 rounded-xl m-4 pointer-events-none"></div>
              </div>
              <p className="text-center text-gray-500 text-sm mt-3 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Align QR code in frame
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 mb-6">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="w-full btn-modern text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 text-lg"
              >
                <img src={scannerIcon} alt="Scan" className="w-6 h-6 brightness-0 invert" />
                <span>Scan QR Code</span>
              </button>
            ) : (
              <button
                onClick={() => setScanning(false)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Stop Scanner</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-gray-400 text-sm font-medium">or enter manually</span>
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualInput} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cart ID</label>
              <input
                type="text"
                placeholder="e.g., 101"
                value={cartId}
                onChange={(e) => setCartId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-medium text-gray-800 placeholder-gray-400 focus:border-green-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Continue Shopping</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/40 text-xs">
            Powered by UniMart • Fast • Secure • Convenient
          </p>
        </div>
      </div>
    </div>
  );
}
