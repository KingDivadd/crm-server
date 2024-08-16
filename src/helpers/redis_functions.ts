import { v4 as uuidv4 } from 'uuid';
import gen_token from './generate_token';

import { jwt_secret } from './constants';
const jwt = require('jsonwebtoken')
import redis_client from './redis_helper';


export const redis_auth_store = async (user: any, useful_time: number) => {
    try {
        const uuid: string = uuidv4();
        const token = gen_token({ user }, useful_time);
        await (await redis_client).set(`${uuid}`, token, {EX: useful_time});
        return uuid;
    } catch (err) {
        console.error('Error in redis auth store func:', err);
        
    }
}

export const redis_otp_store = async (email: string, sent_otp: string, status: string, useful_time: number) => {
    try {
        const token = gen_token({ email, sent_otp, status }, useful_time)
        await (await redis_client).set(`${email}`, token, {EX: useful_time})
    } catch (err) {
        console.error('Error in redis otp store func:', err);
        
    }
}

export const redis_value_update = async (uuid: string, user: any, useful_time: number) => {
    try {
        const data_exist = await (await redis_client).get(`${uuid}`)
        if (!data_exist) {
            const new_auth_id = await redis_auth_store(user, useful_time)
            return new_auth_id
        } else {
            const token = gen_token({ user }, useful_time);
            const update_redis = await (await redis_client).set(`${uuid}`, token, {EX: useful_time})
            return uuid
        }
    } catch (err) {
        console.error('Error in redis data update : ', err);
        
    }
}

