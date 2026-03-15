const mongoose = require('mongoose');

const pairingSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  source: { 
    type: String, 
    enum: ['web', 'bot', 'manual'], 
    default: 'web' 
  },
  status: { 
    type: String, 
    enum: [
      'pending',      // 0. Menunggu diproses
      'processing',    // 1. Sedang diproses bot
      'pairing_code',  // 2. Kode pairing siap
      'connected',     // 3. Bot sudah connect (kode dipakai)
      'sent',          // 4. Kode sudah dikirim (alternatif)
      'expired',       // 5. Kode expired
      'failed',        // 6. Gagal
      'existing',      // 7. Bot sudah ada
      'logged_out',    // 8. Bot logout
      'stopped'        // 9. Bot dihentikan
    ], 
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
  connectedAt: { type: Date },
  welcomed: { type: Boolean, default: false },
expiresAt: { 
  type: Date, 
  default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
}
});

module.exports = mongoose.model('Pairing', pairingSchema);
