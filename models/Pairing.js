const mongoose = require('mongoose');

const pairingSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'expired', 'failed'],
    default: 'pending'
  },
  code: {
    type: String,
    default: null
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 5 * 60 * 1000) // 5 menit
  }
});
pairingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('Pairing', pairingSchema);
