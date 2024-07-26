import { redis_url } from './constants';
import { createClient } from 'redis';

if (!redis_url) {
  throw new Error('REDIS URL not found');
}

const redis_client = createClient({
  url: String(redis_url),
  socket: {
    reconnectStrategy: (retries) => {
      // Return the number of milliseconds before reconnecting
      if (retries > 10) {
        console.log('Too many retries, giving up');
        return new Error('Retry limit reached');
      }
      return Math.min(retries * 100, 3000); // exponential backoff
    }
  }
});

redis_client.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redis_client.on('connect', () => {
  console.log('Redis client connected');
});

redis_client.on('reconnecting', (retries) => {
  console.log(`Reconnecting attempt #${retries}`);
});

redis_client.on('end', () => {
  console.log('Redis client disconnected');
});

redis_client.connect().catch((err) => {
  console.error('Could not establish a connection with Redis', err);
});

export default redis_client;
