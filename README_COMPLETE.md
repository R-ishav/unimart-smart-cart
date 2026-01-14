# 🛒 Smart Cart - Intelligent Shopping System

A modern, full-stack IoT-enabled smart shopping cart system with RFID scanning, real-time cart management, and integrated payment processing.

## 🌟 Features

### Customer Experience
- **QR Code Cart Registration**: Scan unique QR codes on shopping carts to start
- **Real-time Item Scanning**: RFID scanners on carts automatically detect items
- **Live Dashboard**: See items, prices, and quantities in real-time on your phone/browser
- **Quantity Management**: Adjust item quantities before checkout
- **Multiple Payment Options**: Online (Razorpay) or Cash payment
- **Digital Receipts**: Download or print receipts after purchase
- **Email Receipts**: Automatic receipt delivery via email

### Admin Features
- **Transaction Monitoring**: Real-time view of all scanned items
- **Revenue Tracking**: Total revenue and order statistics
- **Transaction Filtering**: Filter by action (ADD, REMOVE, RESET)
- **History Analysis**: Complete transaction audit log

## 🏗️ System Architecture

### Frontend (React + Vite)
```
Landing Page → Scan Cart QR Code → Customer Dashboard → Payment → Receipt
                                        ↓
                                (Real-time updates)
```

**Pages:**
- `/` - Landing page with cart QR scanner
- `/dashboard/:cartId` - Main shopping dashboard
- `/payment` - Payment selection and processing
- `/receipt` - Order confirmation and receipt
- `/admin` - Admin transaction monitoring

### Backend (Node.js + Express)
**API Endpoints:**
- `GET /api/cart` - Get current cart items and total
- `GET /api/transactions` - Get all transaction history
- `POST /api/bill/reset` - Clear cart and reset total
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature
- `POST /api/payment/cash` - Process cash payment

### Hardware Integration
- **Arduino with RFID Reader**: Reads product RFID tags
- **Communication Protocol**: Serial port (9600 baud)
- **Data Format**: CSV messages (ADD,item,price)

### Database (MongoDB Atlas)
**Collections:**
- **Transactions**: Stores all ADD/REMOVE actions with timestamps
- **Bills**: Tracks total cart amounts

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Arduino with RFID reader (optional for demo)
- Razorpay business account (for online payments)

### Step 1: Clone & Install
```bash
git clone <repo-url>
cd BillingCart
npm install
```

### Step 2: Configure Environment
Create `.env` file in root directory:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=cluster

# Serial Communication (Arduino)
COM_PORT=COM7

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Razorpay Payment (Get from https://razorpay.com)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### Step 3: Start Backend
```bash
# Terminal 1
node server.js
# Output: [Startup] Server running on port 3000
```

### Step 4: Start Frontend
```bash
# Terminal 2
npm run dev
# Output: VITE v7.3.1 ready in XXX ms
# ➜ Local: http://localhost:5173/
```

## 📊 Workflow

### Customer Journey
1. **Cart Scanning**: Customer scans unique QR code on shopping cart
2. **Item Scanning**: Walk around store, scanner auto-detects items via RFID
3. **Live Updates**: Real-time updates on dashboard (2-second polling)
4. **Quantity Adjustment**: Increase/decrease quantities as needed
5. **Checkout**: Proceed to payment page
6. **Payment**: Choose online (Razorpay) or cash payment
7. **Receipt**: View, print, or download digital receipt

### Arduino Integration
The Arduino code should:
1. Read RFID tag UID from scanner
2. Map UID to product name and price
3. Send CSV format on serial: `ADD,ProductName,Price\n`
4. Send total after each transaction: `TOTAL,Amount\n`

**Example Arduino Output:**
```
ADD,Milk,50
TOTAL,50
ADD,Bread,30
TOTAL,80
REMOVE,Milk,50
TOTAL,30
```

## 🛠️ Arduino Setup

Install these libraries in Arduino IDE:
```
MFRC522 - by GithubCommunity
LiquidCrystal_I2C - by Frank de Brabander
```

**Wiring:**
- RC522 (RFID): SDA→10, SCK→13, MOSI→11, MISO→12, IRQ→9, GND→GND, 3.3V→3.3V
- LCD: SDA→A4, SCL→A5, GND→GND, 5V→5V

## 📱 API Examples

### Get Cart
```bash
curl http://localhost:3000/api/cart
```
Response:
```json
{
  "items": [
    {"name": "Milk", "price": 50},
    {"name": "Bread", "price": 30}
  ],
  "total": 80
}
```

### Get Transactions
```bash
curl http://localhost:3000/api/transactions
```

### Reset Cart
```bash
curl -X POST http://localhost:3000/api/bill/reset
```

## 💳 Payment Integration

### Razorpay Setup
1. Create account at https://razorpay.com
2. Get API keys from dashboard
3. Add to `.env` file
4. Payment page handles checkout automatically

### Cash Payment
Alternative payment option for offline transactions, recorded in database.

## 🔒 Security Notes

- **API Keys**: Never commit `.env` to git
- **Admin Password**: Change default `admin123` in AdminDashboard.jsx
- **CORS**: Configured for localhost:5173 (update for production)
- **Payment Verification**: Razorpay signature validation on backend

## 📦 Dependencies

**Frontend:**
- react 19.2.0
- react-router-dom 7.12.0
- qr-scanner (QR code reading)
- html2pdf.js (Receipt PDF generation)
- tailwindcss 4.1.18

**Backend:**
- express 5.2.1
- mongoose 8.0.3
- serialport 11.0.1
- razorpay (Payment processing)
- cors 2.8.5
- dotenv 16.4.5

## 🧪 Testing Locally

### Without Arduino
1. Start backend: `node server.js`
2. Start frontend: `npm run dev`
3. Navigate to http://localhost:5173
4. Enter any cart ID to test dashboard
5. Use manual item addition for testing

### With Arduino
1. Upload Arduino sketch to board
2. Connect RFID reader
3. Update COM_PORT in .env
4. Scan items on RFID reader
5. Watch real-time updates on dashboard

## 📊 Admin Dashboard

**Access:** http://localhost:5173/admin
**Password:** admin123 (change in production)

**Features:**
- Real-time transaction monitoring
- Revenue tracking
- Filter by action (ADD/REMOVE)
- Transaction timestamps
- Auto-refresh every 5 seconds

## 🚀 Production Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
# Update FRONTEND_ORIGINS in .env
# Update database connection string
# Deploy with git push
```

## 📝 Project Structure
```
BillingCart/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx (Cart QR scanner)
│   │   ├── CustomerDashboard.jsx (Shopping dashboard)
│   │   ├── PaymentPage.jsx (Checkout)
│   │   ├── ReceiptPage.jsx (Order confirmation)
│   │   └── AdminDashboard.jsx (Transaction monitoring)
│   ├── services/
│   │   └── api.js (Backend API calls)
│   ├── App.jsx (Router configuration)
│   └── index.css (Tailwind styles)
├── server.js (Express backend)
├── models.js (Mongoose schemas)
├── .env (Configuration)
└── package.json
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

**Backend won't start:**
- Check MongoDB URI in .env
- Verify COM port matches Arduino
- Check for duplicate process on port 3000

**QR scanner not working:**
- Allow camera permission in browser
- Check browser console for errors
- Ensure HTTPS in production

**Payment failing:**
- Verify Razorpay API keys
- Check payment amount is valid
- Review Razorpay logs

**Serial port "Access Denied":**
- Close Arduino IDE serial monitor
- Check COM port number
- Restart backend after closing other apps

## 📞 Support

For issues and questions:
- Create GitHub issue
- Email: support@smartcart.com
- Documentation: Wiki

---

**Built with ❤️ for smarter shopping**
