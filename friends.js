const express = require('express');
const router = express.Router();
const amqp = require("amqplib");
const config = require('./config');

router.post('/friendrequests', async (req, res) => {
  
  try {
    const { requestId, sender, receiver } = req.body; // Destructure the sender and receiver from req.body

    if (!sender || !receiver) {
      // Check if sender or receiver is missing
      return res.status(400).json({ error: 'Sender and receiver are required fields' });
    }

    const connection = await amqp.connect(config.rabbitMQ.url);
    const channel = await connection.createChannel();

    const exchangeName = config.rabbitMQ.friendExchangeName;
    await channel.assertExchange(exchangeName, 'direct');

    const requestData = {
        requestId: requestId,    
        sender: sender,
        receiver: receiver,
    };

    await channel.publish(
      exchangeName,
      'friendRequest',
      Buffer.from(JSON.stringify(requestData)),
      { persistent: true }
    );

    console.log(`Friend request sent: ${sender} -> ${receiver} with request ID ${requestId}`);
    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Failed to send friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

module.exports = router;
