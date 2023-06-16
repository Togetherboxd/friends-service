const express = require('express');
const app = express();
const amqp = require('amqplib');
const config = require('./config');
const db = require('./models');
const { UsersInFriends } = require('./models');
const friendRequestsRouter = require('./friends');

app.use(express.json());
app.use('/', friendRequestsRouter);

async function consumeMessages() {
  const connection = await amqp.connect(config.rabbitMQ.url);
  const channel = await connection.createChannel();

  const exchangeName = config.rabbitMQ.exchangeName;
  await channel.assertExchange(exchangeName, 'direct');

  const q = await channel.assertQueue('InfoQueue');

  await channel.bindQueue(q.queue, config.rabbitMQ.exchangeName, 'Info');
  await channel.bindQueue(q.queue, config.rabbitMQ.exchangeName, 'UserDeleted');

  channel.consume(q.queue, async (msg) => {
    const data = JSON.parse(msg.content);
    console.log(data);

    // Handle the message based on the routing key
    switch (data.logType) {
      case 'Info':
        // Handle the UserRegistered message
        try {
          await UsersInFriends.create({
            username: data.username,
          });
          console.log(`User ${data.username} added to the friends database.`);
        } catch (error) {
          console.error(
            `Failed to add user ${data.username} to the friends database:`,
            error
          );
        }
        break;
      case 'UserDeleted':
        try {
          await UsersInFriends.destroy({
            where: {
              username: data.username,
            },
          });
          console.log(`User ${data.username} deleted from the friends database.`);
        } catch (error) {
          console.error(
            `Failed to delete user ${data.username} from the friends database:`,
            error
          );
        }
        break;
      default:
        console.log(`Unsupported message type: ${data.logType}`);
        break;
    }

    channel.ack(msg);
  });
}

async function consumeFriendRequestResponses() {
  const connection = await amqp.connect(config.rabbitMQ.url);
  const channel = await connection.createChannel();

  const exchangeName = config.rabbitMQ.friendExchangeName;
  await channel.assertExchange(exchangeName, 'direct');

  const q = await channel.assertQueue('FriendRequestResponseQueue');

  await channel.bindQueue(q.queue, exchangeName, 'friendRequestResponse');

  channel.consume(q.queue, async (msg) => {
    const data = JSON.parse(msg.content);
    console.log('Received friend request response:', data);

    // process the friend request response

    channel.ack(msg);
  });
}

async function startServer() {
  await consumeMessages();
  await consumeFriendRequestResponses();

  db.sequelize.sync().then(() => {
    app.listen(3002, () => {
      console.log('Friends service running on port 3002');
    });
  });
}

startServer().catch((error) => {
  console.error('Failed to start Friends service:', error);
});

module.exports = app;
