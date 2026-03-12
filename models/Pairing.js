const mongoose = require('mongoose');

const pairingSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  source: { 
    type: String, 
    enum: ['web', 'bot', 'manual'], 
    default: 'web' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'connected', 'pairing_code', 'sent', 'expired', 'failed', 'existing', 'logged_out', 'stopped'], 
    default: 'pending' 
  },
  code: { type: String, default: null },
  requestedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(+new Date() + 5 * 60 * 1000) }
});

module.exports = mongoose.model('Pairing', pairingSchema);
