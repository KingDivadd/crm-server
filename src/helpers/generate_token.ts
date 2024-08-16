const jwt = require('jsonwebtoken');
import { jwt_secret, jwt_lifetime } from "./constants";



const gen_token = (payload: any, useful_time:number) => {
    return jwt.sign(payload, jwt_secret, {
        expiresIn: useful_time
    });
}

export default gen_token;
