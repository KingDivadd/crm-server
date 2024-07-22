import { Request, Response,NextFunction } from "express";
import prisma from "../helpers/prisma";

import {test_email} from '../helpers/email'
import { email_passowrd, email_username } from "../helpers/constants";

export const test_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {

        return res.status(200).json({msg: 'Server connected successfully.'})
        
    } catch (err:any) {
        console.log('Error occured while testing connection ', err);
        return res.status(500).json({err: 'Error occured while testing server connection'})
    }
}

export const test_db_connection = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        const users = await prisma.user.findMany({ include: {company: true}})

        return res.status(200).json({number_of_users:users.length, crm_users: users})
    } catch (err:any) {
        console.log('Error occured while testing server db connection ', err);
        return res.status(500).json({err: 'Error occured while testing server db connection'})
    }
}


export const test_send_email = async()=>{
    try {

        console.log('here', process.env.EMAIL_USERNAME, email_passowrd, );
        

        console.log('should have been sent by now');
        
    } catch (err:any) {
        console.log('Error occured while sending email');
        return {statusCode: 500, err: 'Error occured while sending email'}
        
    }
}