import { redis_url } from './constants';
import { createClient } from 'redis';

if (!redis_url) {
    throw new Error('REDIS URL not found');
}

const redis_client = createClient({
    url: String(redis_url),
    pingInterval: 3000
    })
    .on('error', err => console.log('Redis Client Error', err))
    .connect();


export default redis_client;