// API service functions for Smart Cart
// Updated for ESP32 + Barcode Scanner architecture

// Dynamic API URL:
// - With explicit VITE_API_URL: use that URL
// - In production (Vercel): use Render backend
// - In development: use empty string (Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname !== 'localhost' ? 'https://unimart-backend-hz8v.onrender.com' : '');

const api = {};

// ========================================
// NEW: Cart API with cartId support
// ========================================

// Fetch cart by cartId
export async function fetchCartById(cartId) {
  const res = await fetch(`${API_BASE_URL}/api/cart/${cartId}`);
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

// Scan barcode (for testing from frontend)
export async function scanBarcode(cartId, barcode) {
  const res = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId, barcode }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to scan barcode');
  }
  return res.json();
}

// Remove item from cart
export async function removeFromCart(cartId, barcode) {
  const res = await fetch(`${API_BASE_URL}/api/cart/${cartId}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode }),
  });
  if (!res.ok) throw new Error('Failed to remove item');
  return res.json();
}

// Pay for cart
export async function payCart(cartId) {
  const res = await fetch(`${API_BASE_URL}/api/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId }),
  });
  if (!res.ok) throw new Error('Failed to process payment');
  return res.json();
}

// Verify cart
export async function verifyCart(cartId) {
  const res = await fetch(`${API_BASE_URL}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId }),
  });
  if (!res.ok) throw new Error('Failed to verify cart');
  return res.json();
}

// Get inventory (for testing)
export async function getInventory() {
  const res = await fetch(`${API_BASE_URL}/api/inventory`);
  if (!res.ok) throw new Error('Failed to fetch inventory');
  return res.json();
}

// ========================================
// LEGACY: Old cart API (kept for compatibility)
// ========================================

// Fetch cart data (legacy - no cartId)
export async function fetchCart() {
  const res = await fetch(`${API_BASE_URL}/api/cart`);
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

// Fetch transactions
export async function fetchTransactions() {
  const res = await fetch(`${API_BASE_URL}/api/transactions`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

// Reset bill
export async function resetBill() {
  const res = await fetch(`${API_BASE_URL}/api/bill/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset bill');
  return res.json();
}

export default api;
