const express = require('express');
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
app.get("/l", (req, res) => {
  // Kasih HTML loading dulu
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Loading...</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea, #764ba2);
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
            }
            .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            p {
                color: white;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div style="text-align: center">
            <div class="loader"></div>
            <p>Verifying...</p>
        </div>
        
        <script>
            // Redirect ke halaman yang sama setelah 1 detik
            // Tapi dengan parameter biar ga loading lagi
            setTimeout(() => {
                window.location.href = '/?verified=true';
            }, 1000);
        </script>
    </body>
    </html>
  `)
})
app.get("/", (req, res) => {
  if (req.query.verified === 'true') {
    res.sendFile(path.join(__dirname, "page", "index.html"))
  } else {
    res.redirect('/l')
  }
})
app.post('/api/pairing/request', async (req, res) => {
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
