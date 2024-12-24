const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal'); // Import qrcode-terminal
const bodyParser = require('body-parser'); // For parsing JSON bodies

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

// Once the QR code is generated, print it in the terminal
client.on('qr', (qr) => {
    // Print the QR code in the terminal using qrcode-terminal
    qrcodeTerminal.generate(qr, { small: true }); // Generates QR code in terminal
});

// Once the client is ready, log success
client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

// Function to send a WhatsApp message
async function sendMessage(mobile, message) {
    try {
        // Format the phone number to include the country code and '@c.us' for WhatsApp
        let chatId = mobile.includes('@c.us') ? mobile : `${mobile.replace(/\D/g, '')}@c.us`; // Format phone number
        
        // Send the message via WhatsApp client
        await client.sendMessage(chatId, message);

        console.log('Message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Define the POST route to send WhatsApp messages
app.post('/send-whatsapp', async (req, res) => {
    const { mobile, message } = req.body;

    if (!mobile || !message) {
        return res.status(400).json({ error: 'Mobile number and message are required' });
    }

    try {
        // Send the message via the sendMessage function
        await sendMessage(mobile, message);

        // Respond with success
        res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

// Initialize the client
client.initialize();

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
