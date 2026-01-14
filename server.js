import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
// Serial port disabled - now using ESP32 WiFi instead
// import { SerialPort, ReadlineParser } from 'serialport';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Transaction, Bill } from './models.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const COM_PORT = process.env.COM_PORT;
const ENABLE_SERIAL = process.env.ENABLE_SERIAL === 'true'; // Flag to enable legacy serial mode
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ALLOW_ALL_ORIGINS = process.env.ALLOW_ALL_ORIGINS === 'true'; // For ngrok/public hosting
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// ========================================
// PRODUCT INVENTORY - Load from CSV
// ========================================
const products = {};  // barcode -> { barcode, name, category, price }

function loadInventory() {
  try {
    const inventoryPath = path.join(__dirname, 'inventory.csv');
    if (!fs.existsSync(inventoryPath)) {
      console.log('[Inventory] inventory.csv not found, creating sample...');
      return;
    }
    
    const csvData = fs.readFileSync(inventoryPath, 'utf-8');
    const lines = csvData.trim().split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 4) {
        const barcode = parts[0].trim();
        const name = parts[1].trim();
        const category = parts[2].trim();
        const price = parseFloat(parts[3].trim());
        
        if (barcode && name && !isNaN(price)) {
          products[barcode] = { barcode, name, category, price };
        }
      }
    }
    
    console.log(`[Inventory] Loaded ${Object.keys(products).length} products from inventory.csv`);
  } catch (err) {
    console.error('[Inventory Error]', err.message);
  }
}

// Load inventory on startup
loadInventory();

// ========================================
// CART SESSIONS - In-memory storage
// ========================================
const carts = {};  // cartId -> { cartId, items: [], total, paymentStatus, verifiedStatus }

function getOrCreateCart(cartId) {
  if (!carts[cartId]) {
    carts[cartId] = {
      cartId,
      items: [],  // [{ barcode, name, category, price, qty }]
      total: 0,
      paymentStatus: false,
      verifiedStatus: false,
    };
    console.log(`[Cart] Created new cart: ${cartId}`);
  }
  return carts[cartId];
}

function recalculateTotal(cart) {
  cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  return cart.total;
}

// Initialize Nodemailer transporter
let transporter;
if (EMAIL_USER && EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
  console.log('[Startup] Email service initialized');
} else {
  console.log('[Startup] Email service not configured (provide EMAIL_USER and EMAIL_PASSWORD)');
}

// Initialize Razorpay (optional if keys are provided)
let razorpay;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log('[Startup] Razorpay initialized');
} else {
  console.log('[Startup] Razorpay not configured (provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)');
}

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('[Startup Error] MONGODB_URI environment variable is required.');
  process.exit(1);
}

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('[Startup] Connected to MongoDB');
  })
  .catch((err) => {
    console.error('[Startup Error] MongoDB connection error:', err.message);
    process.exit(1);
  });

// In-memory cart state: { item: { price, count } }
const cart = {};

// Initialize Express app
const app = express();
app.use(cors({
  origin: ALLOW_ALL_ORIGINS ? true : FRONTEND_ORIGINS, // Allow all origins when public hosting
  credentials: true,
}));
app.use(express.json());

// Helper function to send receipt email
async function sendReceiptEmail(email, cartId, items, total, paymentId, paymentMethod) {
  if (!transporter) {
    console.log('[Email] Email service not configured, skipping email');
    return;
  }

  try {
    const itemsHTML = items
      .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #d9f99d;">${item.name}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #d9f99d;">₹${item.price.toFixed(2)}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #d9f99d;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #d9f99d;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f7fee7; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 12px; }
          .header { background: linear-gradient(to right, #84cc16, #65a30d); color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .receipt-number { margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background-color: #f7fee7; padding: 10px; text-align: left; border-bottom: 2px solid #84cc16; }
          .totals { margin: 20px 0; }
          .total-amount { font-size: 24px; font-weight: bold; color: #84cc16; margin-top: 15px; padding-top: 15px; border-top: 2px solid #d9f99d; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Smart Cart Receipt</h1>
            <p>Thank you for your purchase!</p>
          </div>
          <div class="content">
            <div class="receipt-number">
              <p><strong>Receipt #:</strong> ${paymentId || 'N/A'}</p>
              <p><strong>Cart ID:</strong> ${cartId}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN')}</p>
            </div>
            <h3 style="color: #65a30d;">Items Purchased</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            <div class="totals">
              <p style="display: flex; justify-content: space-between;"><span>Subtotal:</span> <span>₹${total.toFixed(2)}</span></p>
              <p style="display: flex; justify-content: space-between;"><span>Tax (0%):</span> <span>₹0.00</span></p>
              <p style="display: flex; justify-content: space-between;"><span>Discount:</span> <span>₹0.00</span></p>
              <p class="total-amount">Total: ₹${total.toFixed(2)}</p>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with Smart Cart!</p>
            <p>This is an electronically generated receipt.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: `Smart Cart Receipt - ${cartId}`,
      html: htmlContent,
    });

    console.log('[Email] Receipt sent successfully to', email);
  } catch (err) {
    console.error('[Email Error] Failed to send receipt:', err.message);
  }
}

app.get('/', (req, res) => {
  res.send('Smart Billing and Checkout System Backend is running. (ESP32 + Barcode Scanner Mode)');
});

// ========================================
// NEW: Barcode Scan API (ESP32 WiFi)
// ========================================
// POST /api/scan - Receive barcode scan from ESP32
app.post('/api/scan', async (req, res) => {
  try {
    const { cartId, barcode } = req.body;
    
    if (!cartId || !barcode) {
      return res.status(400).json({ error: 'Missing cartId or barcode' });
    }
    
    console.log(`[Scan] Received: barcode=${barcode}, cartId=${cartId}`);
    
    // Lookup product by barcode
    const product = products[barcode];
    if (!product) {
      console.log(`[Scan] Product not found: ${barcode}`);
      return res.status(404).json({ message: 'Product not found', barcode });
    }
    
    // Get or create cart
    const cart = getOrCreateCart(cartId);
    
    // Check if product already in cart
    const existingItem = cart.items.find(item => item.barcode === barcode);
    if (existingItem) {
      existingItem.qty += 1;
      console.log(`[Scan] Quantity updated: ${product.name} x${existingItem.qty}`);
    } else {
      cart.items.push({
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        price: product.price,
        qty: 1,
      });
      console.log(`[Scan] Product added: ${product.name}`);
    }
    
    // Recalculate total
    recalculateTotal(cart);
    console.log(`[Cart] Total: ₹${cart.total}`);
    
    // Log transaction to MongoDB
    try {
      await Transaction.create({
        action: 'ADD',
        item: product.name,
        price: product.price,
      });
    } catch (err) {
      console.error('[Transaction Error]', err.message);
    }
    
    res.json(cart);
  } catch (err) {
    console.error('[Scan Error]', err.message);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});

// GET /api/cart/:cartId - Get cart by ID
app.get('/api/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  const cart = getOrCreateCart(cartId);
  res.json(cart);
});

// POST /api/cart/:cartId/remove - Remove item from cart
app.post('/api/cart/:cartId/remove', (req, res) => {
  const { cartId } = req.params;
  const { barcode } = req.body;
  
  const cart = getOrCreateCart(cartId);
  const itemIndex = cart.items.findIndex(item => item.barcode === barcode);
  
  if (itemIndex !== -1) {
    if (cart.items[itemIndex].qty > 1) {
      cart.items[itemIndex].qty -= 1;
    } else {
      cart.items.splice(itemIndex, 1);
    }
    recalculateTotal(cart);
    console.log(`[Cart] Item removed: ${barcode}`);
  }
  
  res.json(cart);
});

// POST /api/pay - Mark cart as paid
app.post('/api/pay', (req, res) => {
  const { cartId } = req.body;
  
  if (!cartId) {
    return res.status(400).json({ error: 'Missing cartId' });
  }
  
  const cart = getOrCreateCart(cartId);
  cart.paymentStatus = true;
  console.log(`[Payment] Cart ${cartId} marked as PAID`);
  
  res.json({ success: true, message: 'Payment successful', cart });
});

// POST /api/verify - Verify cart (only if paid)
app.post('/api/verify', (req, res) => {
  const { cartId } = req.body;
  
  if (!cartId) {
    return res.status(400).json({ error: 'Missing cartId' });
  }
  
  const cart = getOrCreateCart(cartId);
  
  if (!cart.paymentStatus) {
    return res.status(400).json({ error: 'Payment not completed', cart });
  }
  
  cart.verifiedStatus = true;
  console.log(`[Verify] Cart ${cartId} VERIFIED`);
  
  res.json({ success: true, message: 'Cart verified', cart });
});

// GET /api/inventory - Get all products (for testing)
app.get('/api/inventory', (req, res) => {
  res.json({
    count: Object.keys(products).length,
    products: Object.values(products),
  });
});

// POST /api/inventory/reload - Reload inventory from CSV
app.post('/api/inventory/reload', (req, res) => {
  // Clear existing products
  Object.keys(products).forEach(key => delete products[key]);
  loadInventory();
  res.json({ 
    success: true, 
    message: `Loaded ${Object.keys(products).length} products` 
  });
});

// GET /api/cart - returns current cart state
app.get('/api/cart', (req, res) => {
  const items = Object.entries(cart).map(([name, data]) => ({
    name,
    price: data.price,
  }));
  const total = items.reduce((sum, item) => sum + item.price, 0);
  res.json({ items, total });
});

// GET /api/transactions - returns all transactions sorted by latest first
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('[Transactions Error]', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/bill/reset - clears cart, resets bill, clears in-memory data, logs reset
app.post('/api/bill/reset', async (req, res) => {
  // Clear in-memory cart
  for (const key in cart) {
    delete cart[key];
  }
  // Reset bill total in DB and remove duplicates
  try {
    const bills = await Bill.find();
    let bill;
    if (bills.length === 0) {
      bill = await Bill.create({ total: 0 });
    } else {
      bill = bills[0];
      bill.total = 0;
      bill.updatedAt = new Date();
      await bill.save();
      // Remove any duplicate bills
      if (bills.length > 1) {
        const idsToDelete = bills.slice(1).map(b => b._id);
        await Bill.deleteMany({ _id: { $in: idsToDelete } });
      }
    }
    // Log reset event (as a transaction)
    await Transaction.create({ action: 'RESET', item: '-', price: 0 });
    res.json({ success: true });
  } catch (err) {
    console.error('[Bill Error]', err?.message || err);
    res.status(500).json({ error: 'Failed to reset bill/cart' });
  }
});

// ========================================
// LEGACY: Serial Communication (DISABLED)
// ========================================
// This section is disabled by default. ESP32 WiFi is now used instead.
// To enable legacy Arduino serial mode, set ENABLE_SERIAL=true in .env

/*
LEGACY SERIAL CODE - DISABLED FOR ESP32 WIFI MIGRATION
========================================================
The project now uses ESP32 with barcode scanner over WiFi.
ESP32 sends HTTP POST to /api/scan endpoint.

If you need to re-enable Arduino serial mode:
1. Add ENABLE_SERIAL=true to .env
2. Uncomment the serial port imports at top of file
3. Uncomment this section

let port, parser;
if (ENABLE_SERIAL && COM_PORT && COM_PORT.trim() && COM_PORT !== 'COM' && COM_PORT !== '') {
  try {
    console.log('[Serial] Initializing on port:', COM_PORT);
    const { SerialPort, ReadlineParser } = await import('serialport');
    port = new SerialPort({
      path: COM_PORT,
      baudRate: 9600,
    });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    // ... rest of serial handling code
  } catch (err) {
    console.error('[Serial Error]', err?.message || err);
  }
}
*/

console.log('[Startup] Serial port DISABLED - Using ESP32 WiFi mode');
console.log('[Startup] ESP32 should POST to /api/scan endpoint');

// Payment endpoints
app.post('/api/payment/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(400).json({ error: 'Payment gateway not configured' });
    }

    const { amount, cartId, email, phone } = req.body;

    if (!amount || !cartId || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: cartId,
      notes: {
        cartId,
        email,
        phone,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[Payment Error] Failed to create order:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartId, email, items, total, paymentMethod } = req.body;

    // Verify signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Log transaction as PAYMENT
    await Transaction.create({
      action: 'ADD',
      item: 'PAYMENT_COMPLETED',
      price: 0,
    });

    // Send receipt email if email is provided and not a walk-in customer
    if (email && email !== 'walk-in' && email !== 'Walk-in Customer') {
      await sendReceiptEmail(email, cartId, items || [], total || 0, razorpay_payment_id, paymentMethod || 'ONLINE');
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    console.error('[Payment Error] Failed to verify payment:', err.message);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

app.post('/api/payment/cash', async (req, res) => {
  try {
    const { amount, cartId, email, phone, items, paymentMethod } = req.body;

    if (!amount || !cartId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create transaction record for cash payment
    const transaction = await Transaction.create({
      action: 'ADD',
      item: 'CASH_PAYMENT',
      price: amount,
    });

    // Send receipt email if email is provided and not a walk-in customer
    if (email && email !== 'walk-in' && email !== 'Walk-in Customer') {
      await sendReceiptEmail(email, cartId, items || [], amount || 0, transaction._id, paymentMethod || 'CASH');
    }

    res.json({ success: true, transactionId: transaction._id });
  } catch (err) {
    console.error('[Payment Error] Failed to process cash payment:', err.message);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[Startup] Server running on port ${PORT}`);
});
