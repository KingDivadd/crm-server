import { redis_url } from './constants';
import { createClient } from 'redis';

if (!redis_url) {
  throw new Error('REDIS URL not found');
}

const redis_client = createClient({
  url: String(redis_url),
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('Too many retries, giving up'.red.bold);
        return new Error('Retry limit reached');
      }
      return Math.min(retries * 100, 3000); 
    }
  }
});

redis_client.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redis_client.on('connect', () => {
  console.log('Redis client connected'.yellow.bold);
});

redis_client.on('reconnecting', (retries) => {
  console.log(`Reconnecting...`);
});

redis_client.on('end', () => {
  console.log('Redis client disconnected'.red.bold);
});

redis_client.connect().catch((err) => {
  console.error('Could not establish a connection with Redis'.red.bold, err);
});

export default redis_client;