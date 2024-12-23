const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const bodyParser = require('body-parser');

// Create an Express application
const app = express();

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Initialize WhatsApp Web client with LocalAuth for persistent sessions
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Run in headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Necessary args for headless browsers
    }
});

// Serve QR code on a web route so that it can be scanned
client.on('qr', (qr) => {
    // Generate QR code as an image and serve it at /qr endpoint
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Error generating QR code', err);
            return;
        }
        // Save the QR code as a base64 image URL
        qrCodeDataUrl = url;
    });
});

// Once the client is ready, log success
client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

// Initialize the client
client.initialize();

// Serve the QR code at /qr endpoint
app.get('/qr', (req, res) => {
    if (!qrCodeDataUrl) {
        return res.status(400).json({ error: 'QR code is not yet available' });
    }
    res.send(`<img src="${qrCodeDataUrl}" alt="QR Code">`);
});

// Endpoint to send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
    const { mobile, message } = req.body;

    if (!mobile || !message) {
        return res.status(400).json({ error: 'Mobile number and message are required' });
    }

    try {
        // Format phone number correctly
        let chatId = mobile.includes('@c.us') ? mobile : `${mobile.replace(/\D/g, '')}@c.us`; // Format to whatsapp:xxxxxxx@c.us

        // Send the message via WhatsApp client
        await client.sendMessage(chatId, message);

        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
