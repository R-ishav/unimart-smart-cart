# 🛒 Store Carts Configuration

## Your 5 Shopping Carts

| Cart # | Cart ID | Status | QR Code | Location |
|--------|---------|--------|---------|----------|
| 1 | 10000 | Active | [Generate] | Entrance |
| 2 | 10001 | Active | [Generate] | Produce Section |
| 3 | 10002 | Active | [Generate] | Dairy Section |
| 4 | 10003 | Active | [Generate] | Checkout Counter |
| 5 | 10004 | Active | [Generate] | Customer Service |

---

## How to Use

### Testing Locally
Visit http://localhost:5174 and enter:
- Cart ID: `10000` → Test cart 1
- Cart ID: `10001` → Test cart 2
- Cart ID: `10002` → Test cart 3
- Cart ID: `10003` → Test cart 4
- Cart ID: `10004` → Test cart 5

### Generate QR Codes
Use any QR code generator (free online):
1. Go to: https://www.qr-code-generator.com
2. Enter text: `10000`
3. Generate QR code
4. Download & print
5. Attach to physical cart

Or use this format for customers scanning from phone:
```
https://smartcart.yourstore.com/?cartId=10000
```

### Sample QR Code Content
Each QR code should contain just the ID:
```
10000
10001
10002
10003
10004
```

---

## Testing Workflow

### Test Cart 10000
1. Open http://localhost:5174
2. Enter Cart ID: `10000`
3. Click "Continue with Cart ID"
4. Dashboard loads
5. Scan items or add manually
6. Proceed to payment
7. Get receipt

**Repeat for carts 10001-10004**

---

## Customer Journey with These IDs

```
Customer arrives at store
        ↓
Picks up cart (e.g., Cart 10002)
        ↓
Scans QR code on cart
        ↓
Sees dashboard for cart 10002
        ↓
Dashboard URL: http://localhost:5174/dashboard/10002
        ↓
Shops and scans items
        ↓
Checks out
        ↓
Enters email & phone
        ↓
Selects payment
        ↓
Gets receipt for cart 10002
```

---

## Next Steps

1. **Create QR Codes**
   - Use free QR generator
   - One code per cart ID (10000-10004)
   - Print on stickers

2. **Attach to Carts**
   - Stick QR code on each shopping cart
   - Make it easily visible for customers

3. **Test System**
   - Try each cart ID
   - Verify items update correctly
   - Test payment flow

4. **Train Staff**
   - Show customers how to scan QR code
   - Or manually enter cart ID
   - Explain how to proceed

---

## References for QR Code Generators

### Free Online Tools
- https://www.qr-code-generator.com
- https://qr.net/
- https://www.the-qr-code-generator.com/
- https://goqr.me/

### How to Use (Step-by-step)
1. Visit any QR generator
2. Paste: `10000`
3. Click "Generate"
4. Click "Download"
5. Print the image
6. Attach to cart

---

## Production Deployment

When you deploy to production:

Update in `.env`:
```
FRONTEND_URL=https://smartcart.yourstore.com
```

QR codes will then link to:
```
https://smartcart.yourstore.com/dashboard/10000
https://smartcart.yourstore.com/dashboard/10001
https://smartcart.yourstore.com/dashboard/10002
https://smartcart.yourstore.com/dashboard/10003
https://smartcart.yourstore.com/dashboard/10004
```

---

## Support

**Issue: "Cart not found"**
- Verify you entered the correct ID
- Check for typos (10000, not 10000O)

**Issue: "Items not showing"**
- Ensure backend is running: `node server.js`
- Check Arduino RFID scanner is connected to COM7
- Verify Arduino is sending correct data format

**Issue: "Payment failing"**
- Add Razorpay keys to `.env`
- Or use Cash payment option

---

**Your smart store is ready! 🚀 Start with cart 10000**
