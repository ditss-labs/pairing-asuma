const express = require('express');
const session = require('express-session')
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');
const connectDB = require('./config/database');
const Pairing = require('./models/Pairing');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));
connectDB();
app.use(session({
  secret: 'asauma-bot-bogor-ditss-sunda',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 
  }
}))
const checkVerification = (req, res, next) => {
  if (req.session.verified) {
    return next()
  }
  res.redirect('/verifikasi')
}

app.get('/verifikasi', (req, res) => {
  if (req.session.verified) {
    return res.redirect('/')
  }
  
  const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Verifikasi...</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Arial, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                height: 100vh; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
            }
            .loading-container { text-align: center; color: white; }
            .loading-spinner {
                width: 50px; height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .loading-text { font-size: 24px; margin-bottom: 10px; }
            .info { 
                font-size: 14px; 
                opacity: 0.8;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Verifikasi...</div>
            <div class="info">Tunggu 1 detik ya</div>
        </div>
        
        <script>
            setTimeout(() => {
                window.location.href = '/verifikasi/proses';
            }, 1000);
        </script>
    </body>
    </html>
  `
  
  res.send(loadingHtml)
})
app.get('/verifikasi/proses', (req, res) => {
  req.session.verified = true
  req.session.verifiedAt = new Date().toISOString()
  res.redirect('/')
})
/*
app.get('/', checkVerification, (req, res) => {
  res.sendFile(path.join(__dirname, "page", "index.html"))
})*/
app.get('/', checkVerification, (req, res) => {
  res.redirect('https://asuma.my.id/jadibot');
});
app.post('/api/pairing/requestt', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nomor WhatsApp diperlukan' 
      });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nomor tidak valid (10-15 digit)' 
      });
    }
    let pairing = await Pairing.findOne({ phone: cleanPhone });
    
    if (pairing) {
      if (pairing.status === 'pending' || pairing.status === 'processing') {
        return res.json({
          success: true,
          message: 'Nomor sudah dalam antrian',
          data: {
            phone: pairing.phone,
            status: pairing.status,
            source: pairing.source,
            requestedAt: pairing.requestedAt,
            expiresAt: pairing.expiresAt
          }
        });
      }
      await Pairing.deleteOne({ phone: cleanPhone });
    }
    const newPairing = await Pairing.create({
      phone: cleanPhone,
      source: 'web',                    
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    console.log(chalk.green(`✅ Web request: ${cleanPhone} (source: web)`));

    res.json({
      success: true,
      message: 'Permintaan pairing diterima',
      data: {
        phone: newPairing.phone,
        status: newPairing.status,
        source: newPairing.source,
        requestedAt: newPairing.requestedAt,
        expiresAt: newPairing.expiresAt
      }
    });

  } catch (error) {
    console.error('Error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Nomor sudah terdaftar'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
});
app.get('/api/pairing/status/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');
    
    const pairing = await Pairing.findOne({ phone: cleanPhone });
    
    if (!pairing) {
      return res.json({
        success: true,
        data: {
          status: 'not_found',
          message: 'Nomor tidak ditemukan'
        }
      });
    }
    const now = new Date();
    if (pairing.status === 'pending' && now > pairing.expiresAt) {
      pairing.status = 'expired';
      await pairing.save();
    }

    res.json({
      success: true,
      data: {
        phone: pairing.phone,
        status: pairing.status,
        source: pairing.source,         
        code: pairing.code,
        requestedAt: pairing.requestedAt,
        expiresAt: pairing.expiresAt
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server' 
    });
  }
});
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  res.json({
    status: 'ok',
    database: states[dbState],
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Website running at http://localhost:${PORT}`);
});
