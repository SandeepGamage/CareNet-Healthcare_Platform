const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');

let io;
const userSockets = new Map(); // recipientId -> [socketId1, socketId2]

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware for Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role, ... }
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`User connected to socket: ${userId} (${socket.id})`);

    // Add to mapping
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId).push(socket.id);

    socket.on('disconnect', () => {
      logger.info(`User disconnected from socket: ${userId} (${socket.id})`);
      const sockets = userSockets.get(userId) || [];
      const filtered = sockets.filter((id) => id !== socket.id);
      if (filtered.length === 0) {
        userSockets.delete(userId);
      } else {
        userSockets.set(userId, filtered);
      }
    });
  });

  return io;
};

const sendNotificationToUser = (userId, notification) => {
  if (!io) return;
  
  const sockets = userSockets.get(userId);
  if (sockets && sockets.length > 0) {
    sockets.forEach(socketId => {
      io.to(socketId).emit('new-notification', notification);
    });
    logger.info(`Socket notification emitted to user ${userId}`);
    return true;
  }
  
  logger.info(`No active socket for user ${userId}, notification saved to DB only.`);
  return false;
};

module.exports = { initSocket, sendNotificationToUser };
