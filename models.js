import mongoose from 'mongoose';

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['ADD', 'REMOVE', 'RESET'],
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const Transaction = mongoose.model('Transaction', transactionSchema);

// Bill Schema (Singleton)
const billSchema = new mongoose.Schema({
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one bill document exists
billSchema.statics.getSingleton = async function () {
  let bill = await this.findOne();
  if (!bill) {
    bill = await this.create({ total: 0 });
  }
  return bill;
};

export const Bill = mongoose.model('Bill', billSchema);
