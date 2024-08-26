import { Request, Response, NextFunction } from 'express'
import prisma from './prisma'
import redis_client from './redis_helper'
import { CustomRequest } from '../helpers/interface'
import { booking_fee, jwt_secret } from './constants'
import convertedDatetime from './date_time_elemets'
const jwt = require('jsonwebtoken')



export const email_exist = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const user_exist = await prisma.user.findUnique({where: {email: req.body.email}})

        if (user_exist) { return res.status(409).json({ err: 'email already registered to another user' }) }

        return next()

    } catch (err) {
        console.log('error in patient email exist check : ', err)
        return res.status(500).json({ err: 'error verifying email availability, due to poor internet connection.' })
    }
}

export const verify_otp = async(req: CustomRequest, res: Response, next: NextFunction)=> {
    const {email, otp} = req.body
    try {

        const value: any = await (await redis_client).get(`${email}`)

        if (!value){ return res.status(401).json({err: "session id has expired, generate a new OTP."}) }

        const otp_data = await jwt.verify(value, jwt_secret)

        if (otp_data.sent_otp !== otp ) {  return res.status(401).json({err: 'Incorrect OTP entered '})  }
        
        return next()
        
    } catch (err:any) {
        console.log('Error while verifying otp')
        return res.status(500).json({err: `Error occured while verifying admin otp`})
    }
}

export const verify_auth_id = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const auth_id = req.headers['x-id-key']

        if (!auth_id) {  return res.status(401).json({ err: 'x-id-key is missing' }) }

        const value = await (await redis_client).get(`${auth_id}`)

        if (!value) { return res.status(402).json({ err: `session expired, please login again to continue.` })  }

        const decoded_value = await jwt.verify(value, jwt_secret)
        
        if (!('user' in decoded_value)){ return res.status(401).json({err: 'Please enter the correct x-id-key'})}

        const user_id = decoded_value.user.user_id || null

        if (user_id == null){return res.status(401).json({err: 'Please provide the correct x-id-key'})}

        req.user = decoded_value.user

        return next()
        
    } catch (err:any) {
        console.log('Error while validating auth key validity ', err)
        return res.status(500).json({err: 'Error while verifying auth key validity ', error: err})
    }
}

export const validate_admin_access = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const auth_id = req.headers['x-id-key']

        if (!auth_id) {  return res.status(401).json({ err: 'x-id-key is missing' }) }

        const value = await (await redis_client).get(`${auth_id}`)

        if (!value) { return res.status(402).json({ err: `session id has expired, please login again to continue.` })  }

        const decoded_value = await jwt.verify(value, jwt_secret)
        
        if (!('user' in decoded_value)){ return res.status(401).json({err: 'Please enter the correct x-id-key'})}

        const user = decoded_value.user

        if (user.user_id == null){return res.status(401).json({err: 'Please provide the correct x-id-key'})}
        

        if (!['admin', 'super_admin'].includes(user.user_role)){ return res.status(401).json({err: 'Only admins and super admin are authorized'}) }

        req.user = decoded_value.user

        return next()
        
    } catch (err:any) {
        console.log('Error while validating admin access', err)
        return res.status(500).json({err: 'Error while validating admin access ', error: err})
    }
}
