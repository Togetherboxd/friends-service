const request = require('supertest');
const app = require('../app');
const { UsersInFriends } = require('../models');

describe('Friends Service', () => {
  beforeEach(async () => {
    // Clear the UsersInFriends table before each test
    await UsersInFriends.destroy({ truncate: true });
  });

  afterAll(async () => {
    // Close the app server connection after all tests
    await app.close();
  });

  test('should add a user to the friends database on receiving an "Info" message', async () => {
    const message = {
      logType: 'Info',
      username: 'testuser',
    };

    const response = await request(app)
      .post('/info')
      .send(message);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe(`User ${message.username} added to the friends database.`);

    // Verify that the user was added to the database
    const user = await UsersInFriends.findOne({ where: { username: message.username } });
    expect(user).toBeTruthy();
  });

  test('should delete a user from the friends database on receiving a "UserDeleted" message', async () => {
    // Create a user in the database
    const existingUser = await UsersInFriends.create({ username: 'existinguser' });

    const message = {
      logType: 'UserDeleted',
      username: existingUser.username,
    };

    const response = await request(app)
      .post('/info')
      .send(message);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe(`User ${message.username} deleted from the friends database.`);

    // Verify that the user was deleted from the database
    const user = await UsersInFriends.findOne({ where: { username: message.username } });
    expect(user).toBeNull();
  });

  test('should handle unsupported message types', async () => {
    const message = {
      logType: 'Unsupported',
      username: 'testuser',
    };

    const response = await request(app)
      .post('/info')
      .send(message);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe(`Unsupported message type: ${message.logType}`);
  });
});
