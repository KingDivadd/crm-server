import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser, { text } from 'body-parser';
import webpush from 'web-push'
import apn from 'apn'
import cors from 'cors';
import colors from 'colors';
require('colors')
import dotenv from 'dotenv'; 
import index from './routes/index';
import notFound from './middlewares/notFound';
import networkAvailability from './middlewares/networkAvailability';
import { CORS_OPTION, jwt_secret, port, redis_url } from './helpers/constants';
import connectToMongoDB from './config/mongodb';

import redis_client from './helpers/redis_helper';
const jwt = require('jsonwebtoken')


dotenv.config();

const app = express();

const server = http.createServer(app);

const io:any = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors(CORS_OPTION));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// config webpush.js


export {io}

// middleware
app.use(networkAvailability);

// test_send_email()

// routes
app.use('/api/v1/app', index);

app.use(notFound);


const start = async () => {
    const PORT = port || 5000;
    try {
        await connectToMongoDB();
        server.listen(PORT, () => console.log(`Crm server started and running on port ${PORT}`.cyan.bold));
    } catch (err) {
        console.log(`something went wrong`.red.bold);
    }
}

start();