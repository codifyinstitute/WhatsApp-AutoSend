const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Create a new instance of express
const app = express();

// Use JSON middleware to parse request bodies
app.use(express.json());

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(), // Used for persistent sessions
    puppeteer: {
        headless: true, // Run in headless mode (no UI)
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Some necessary args for the headless browser
    }
});

// Generate QR code for WhatsApp Web authentication
client.on('qr', qr => {
    qrcode.generate(qr, { small: true }); // Display QR code in terminal for authentication
});

// Log when client is ready
client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

// Start the WhatsApp client
client.initialize();

// Endpoint to send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
    const { mobile, message } = req.body; // Expecting { mobile: 'whatsapp_number', message: 'your_message' }

    if (!mobile || !message) {
        return res.status(400).json({ error: 'Mobile number and message are required' });
    }

    try {
        // Ensure the phone number is formatted correctly with @c.us
        let chatId = mobile.includes('@c.us') ? mobile : `${mobile.replace(/\D/g, '')}@c.us`; // Strip non-digit characters and append @c.us

        // Validate phone number format (example: "+1234567890")
        const phoneRegex = /^\+(\d{1,4})?(\d{10,15})$/;
        if (!phoneRegex.test(mobile)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Send message using WhatsApp client
        await client.sendMessage(chatId, message);
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
