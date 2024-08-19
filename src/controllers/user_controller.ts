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

        const user_id = req.user.user_id

        const [admin_user, available_admin_users, last_user, last_notification] = await Promise.all ([
            prisma.user.findUnique({ where: {user_id }, include: {company: true}}),
        
            prisma.user.count({where: {user_role: 'admin'}}),

            prisma.user.findFirst({orderBy: {created_at: 'desc'}}),

            prisma.notification.findFirst({orderBy: {created_at: 'desc'}})
        ])

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_user_number = last_user ? parseInt(last_user.user_ind.slice(2)) : 0;
        const new_user_number = last_user_number + 1;
        const new_user_ind = `US${new_user_number.toString().padStart(4, '0')}`;
        

        req.body.user_ind = new_user_ind

        const otp = generate_otp()

        const encrypted_password = await bcrypt.hash(req.body.password, salt_round);

        req.body.password = encrypted_password
        req.body.company_id = admin_user?.company_id
        req.body.created_at = converted_datetime()
        req.body.updated_at = converted_datetime()
        req.body.company_id = req.user.company_id

        if (req.body.user_role == 'admin' && (admin_user?.company?.number_of_admin == available_admin_users )){
            return res.status(400).json({err: 'Maximum number of admins already reached.'})
        }

        const create_user = await prisma.user.create({data: req.body })

        if (create_user){
            await prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    message: `Your account has been successfully created.`,
                    subject: `Welcome to the CRM.`,
                    user_id: create_user.user_id,
                    source_id: req.user.user_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })
        }

        await redis_otp_store(req.body.email, otp, 'unverified', 60 * 60 * 2/6)

        created_user_welcome_mail(create_user, otp)

        return res.status(201).json({msg: 'User created successfully, an email containing a verification code has been sent to the user', new_user: create_user})
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

        const user = await prisma.user.findUnique({where: {user_id}})

        if (!user){ return res.status(404).json({err: 'User already deleted, kindly refresh your page.'})}

        if (user?.user_role === 'admin' ) {return res.status(401).json({err: `Not authorized to delete an admin`})}



        const updated_user_data = await prisma.user.delete({  where: {user_id },  })

        // now we are going to delete casecade...

        admin_delete_user_data_mail(updated_user_data)

        return res.status(200).json({msg: `Account deleted successfully `, user: updated_user_data})
        
    } catch (err:any) {
        console.log('Error occured while deleteing user data ', err);
        return res.status(500).json({err: 'Error occured while deleteing data ', error: err})
    }
}

export const all_sales_staff = async(req: CustomRequest, res: Response, next:NextFunction)=>{
    try {
        
        const staffs = await prisma.user.findMany({
            where: {user_role: 'sales'}
        })

        return res.status(200).json({nbHit: staffs.length, staffs})

    } catch (err:any) {
        console.log('Error occured while fetching all sales staffs', err);
        return res.status(500).json({err: 'Error occured while fetching all sales staff ', error: err})
    }
}