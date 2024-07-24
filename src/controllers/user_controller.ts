import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { salt_round } from '../helpers/constants'
import  { redis_value_update, redis_auth_store, redis_otp_store } from '../helpers/redis_functions'
import generate_otp from '../helpers/generate_otp'
import {active_account_mail, admin_delete_user_data_mail, admin_update_user_data_mail, created_user_welcome_mail, inactive_account_mail, otp_messanger, welcome_mail_messanger} from '../helpers/email'

import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
const bcrypt = require('bcrypt')

export const create_new_user = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const otp = generate_otp()

        const encrypted_password = await bcrypt.hash(req.body.password, salt_round);

        req.body.password = encrypted_password
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()
        req.body.company_id = req.user.company_id

        const create_user = await prisma.user.create({data: req.body })

        await redis_otp_store(req.body.email, otp, 'unverified', 60 * 60 * 2/6)

        created_user_welcome_mail(create_user, otp)

        return res.status(201).json({msg: 'User created successfully, an email containing a verification code has been sent to them', new_user: create_user})
    } catch (err:any) {
        console.log('Error occured while creating a new user ', err);
        return res.status(500).json({err: 'Error occured while creating a new user', error: err})
    }
}

export const change_user_activity_status = async(req: CustomRequest, res: Response, next:NextFunction)=>{
    try {

        const user = await prisma.user.findUnique({where: {user_id: req.body.user_id}})

        if (user?.user_role == 'admin' && req.user.user_id !== user.user_id) {return res.status(401).json({err: `Not authorized to edit data`})}

        req.body.updated_at = converted_datetime()

        const update_user_status = await prisma.user.update({ where: {user_id: req.body.user_id }, data: {active_status: req.body.active_status}})

        if (req.body.active_status == false){
            inactive_account_mail(update_user_status)
        }else if (req.body.active_status == true){
            active_account_mail(update_user_status)
        }

        return res.status(200).json({msg: `User's activity status updated successfully `, user: update_user_status})
        
    } catch (err:any) {
        console.log('Error occured while changing user activity status ', err);
        return res.status(500).json({err: 'Error occured while changing user activity status ', error: err})
    }
}


export const admin_change_user_data = async(req: CustomRequest, res: Response, next:NextFunction)=>{
    try {
        req.body.updated_at = converted_datetime()

        const {user_id} = req.params

        if (!user_id){ return res.status(400).json({err: 'user id is required'})}

        const user = await prisma.user.findUnique({where: {user_id}})        

        if (user?.user_role === 'admin' && req.user.user_id !== user.user_id) {return res.status(401).json({err: `Not authorized to edit data`})}


        req.body.password = await bcrypt.hash(req.body.password, salt_round);

        const updated_user_data = await prisma.user.update({ 
            where: {user_id }, 
            data: {...req.body, updated_at: converted_datetime()}
        })

        admin_update_user_data_mail(updated_user_data)

        return res.status(200).json({msg: `User's data updated successfully `, user: updated_user_data})
        
    } catch (err:any) {
        console.log('Error occured while changing user data ', err);
        return res.status(500).json({err: 'Error occured while changing data ', error: err})
    }
}

export const admin_delete_user_data = async(req: CustomRequest, res: Response, next:NextFunction)=>{
    try {
        const {user_id} = req.params

        if (!user_id){ return res.status(400).json({err: 'user id is required'}) }

        const user = await prisma.user.findUnique({where: {user_id: req.body.user_id}})

        if (!user){ return res.status(404).json({err: 'User already deleted, kindly refresh your page.'})}

        if (user?.user_role === 'admin' ) {return res.status(401).json({err: `Not authorized to delete an admin`})}

        

        const updated_user_data = await prisma.user.delete({  where: {user_id: req.body.user_id },  })

        // now we are going to delete casecade...

        admin_delete_user_data_mail(updated_user_data)

        return res.status(200).json({msg: `User's account deleted successfully `, user: updated_user_data})
        
    } catch (err:any) {
        console.log('Error occured while deleteing user data ', err);
        return res.status(500).json({err: 'Error occured while deleteing data ', error: err})
    }
}