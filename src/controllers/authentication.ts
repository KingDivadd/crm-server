import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { salt_round } from '../helpers/constants'
import  { redis_value_update, redis_auth_store, redis_otp_store } from '../helpers/redis_functions'
import generate_otp from '../helpers/generate_otp'
import {otp_messanger, welcome_mail_messanger} from '../helpers/email'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
const bcrypt = require('bcrypt')


export const admin_signup = async(req:Request, res: Response, next: NextFunction)=>{
    const {last_name, first_name, email, password, phone_number} = req.body

    try {

        const encrypted_password = await bcrypt.hash(password, salt_round);

        const last_user = await prisma.user.findFirst({ orderBy: {created_at: 'desc'}})

        const last_user_number = last_user ? parseInt(last_user.user_ind.slice(2)) : 0;
        const new_user_number = last_user_number + 1;
        const new_user_ind = `US${new_user_number.toString().padStart(4, '0')}`;

        const staff = await prisma.user.create({
            data: {
                user_ind: new_user_ind, first_name, last_name, email, 
                password: encrypted_password, user_role: 'super_admin', phone_number,

                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        welcome_mail_messanger(staff)

        const new_auth_id = await redis_auth_store(staff, 60 * 60 * 24 )

        if(new_auth_id){
            res.setHeader('x-id-key', new_auth_id)
        }

        return res.status(201).json({msg: `Account created successfully.`})
        
    } catch (err:any) {
        console.log(`Error during admin signup `,err)
        return res.status(500).json({err: 'Error occured during signup ', error: err})
        
    }
}

export const user_login = async(req: Request, res: Response, next: NextFunction)=>{
    const {email, password} = req.body
    try {
        const [staff, last_tracking] = await Promise.all([
            prisma.user.findUnique({ where: {email}, include: {company: true} }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'} })
        ]) 

        if (!staff){return res.status(404).json({err: 'Incorrect email address, please check email and try again.'})}

        if (!staff.is_verified ){ return res.status(402).json({err: 'Account not verified yet.'}) }

        const encrypted_password = staff.password
        const match_password: boolean = await bcrypt.compare(password, encrypted_password)

        if (!match_password) { console.log('Incorrect password'); return res.status(401).json({ err: `Incorrect password` }); }

        const new_auth_id:any = await redis_auth_store(staff, 60 * 60 * 23)
        
        res.setHeader('x-id-key', new_auth_id)

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        await prisma.user_Tracking.create({
            data: {
                tracking_ind: new_tracking_ind,
                user: {connect: {user_id: staff.user_id}},
                action_type: 'login',
                action_details: {
                    login_time: converted_datetime(),
                },
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        });

        return res.status(200).json({msg:'Login successful', user: staff})
        
    } catch (err:any) {
        console.log('Error during login ',err)
        return res.status(500).json({err: `Error occured during login `, error: err})
    }
}

export const admin_complete_signup = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {phone_number, country_code, company_name, company_address, company_phone, organization_size} = req.body
    try {

        const user_id = req.user.user_id

        const [user_company, last_company] = await Promise.all([
            prisma.user.findUnique({where: {user_id}, select: {company_id:true}}),
            prisma.company.findFirst({orderBy: {created_at: 'desc'}})
        ]) 

        // first check if their's is a company associated with a user

        const last_company_number = last_company ? parseInt(last_company.company_ind.slice(2)) : 0;
        const new_company_number = last_company_number + 1;
        const new_company_ind = `CP${new_company_number.toString().padStart(4, '0')}`;

        if (user_company?.company_id == null){

            req.body.created_at = converted_datetime()
            req.body.updated_at = converted_datetime()
    
            const create_company = await prisma.company.create({ 
                data: {company_ind: new_company_ind, company_name, company_address, company_phone, organization_size, created_at: converted_datetime(), updated_at: converted_datetime()} 
            })

            const updated_admin_model = await prisma.user.update({
                where: {user_id},
                data: {company_id: create_company.company_id, phone_number, country_code, updated_at: converted_datetime() },
                include: {company: true}
            })

            req.user = updated_admin_model

            return next()
        }else if (user_company && user_company.company_id) {

            // If a company already exist, just go ahead and update that
            
            const [updated_admin_model, updated_company] = await Promise.all([
                prisma.user.update({ where: {user_id}, data: {phone_number, country_code, updated_at: converted_datetime()}, include: {company: true}}),
                
                prisma.company.update({
                    where: {company_id: user_company.company_id}, 
                    data: {company_name, company_address, company_phone, organization_size, created_at: converted_datetime(), updated_at: converted_datetime()} 
                })
            ])
            
            
            req.user = updated_admin_model
            
            return next()
        }
        
    } catch (err:any) {
        console.log('Error during admin signup completion ',err)
        return res.status(500).json({err: 'Error occured during admin signup completion ', error: err})
    }
}

export const signup_generate_user_otp = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const email = req.user.email
        const otp = generate_otp()

        const passed_info = req.user

        if (!email){ return res.status(422).json({err: 'Email is required'}) }

        const user = await prisma.user.findUnique({ where: {email} })

        if (!user){return res.status(401).json({err: 'Invalid email entered'})}

        await redis_otp_store(email, otp, 'unverified', 60 * 60 * 2/6)
        
        otp_messanger(user, otp)
        
        return res.status(201).json({ msg: `A six digit unique code has been sent to your email, and it is only valid for 20min`, updated_info: passed_info})
    } catch (err) {
        console.error('Error during token generation : ', err);
        return res.status(500).json({ err: 'Internal server error.' });
    }

}

export const generate_user_otp = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {email} = req.body
    try {
        const otp = generate_otp()

        if (!email){ return res.status(422).json({err: 'Email is required'}) }

        const user = await prisma.user.findUnique({ where: {email} })

        if (!user){return res.status(401).json({err: 'Invalid email entered'})}

        await redis_otp_store(email, otp, 'unverified', 60 * 60 * 2/6)
        
        otp_messanger(user, otp)
        
        return res.status(201).json({ msg: `A six digit unique code has been sent to your email, and it is only valid for 20min`})
    } catch (err) {
        console.error('Error during token generation : ', err);
        return res.status(500).json({ err: 'Internal server error.' });
    }

}

export const resend_otp = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const otp = generate_otp()

        const email = req.user.email

        await redis_otp_store(email, otp, 'unverified', 60 * 60 * 2/6)
        
        otp_messanger(req.user, otp)
        
        return res.status(201).json({ msg: `A six digit unique code has been sent to your email, and it is only valid for 20min`})

        
    } catch (err:any) {
        console.log('Error re-generating otp ', err);
        return res.status(500).json({err: 'Error regenerating otp ', error: err})
    }
}

export const verify_user_otp = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const {otp, email} = req.body
    try {

        const user = await prisma.user.update({ where: {email}, data: {is_verified: true, updated_at: converted_datetime()}})

        const auth_id = await redis_auth_store(user, 60 * 60 * 23);

        if (auth_id) {   
            res.setHeader('x-id-key', auth_id)
        }

        return res.status(200).json({ msg: 'Verification successful' })

    } catch (err) {
        console.error('Error during token generation : ', err);
        return res.status(500).json({ err: 'Internal server error.' });
    }

}

export const reset_password = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {new_password} = req.body
    try {

        const auth_id = req.headers['x-id-key'];

        const encrypted_password = await bcrypt.hash(new_password, salt_round);

        const updated_user = await prisma.user.update({
            where: { user_id: req.user.user_id },

            data: { password: await encrypted_password, updated_at: converted_datetime()  }
        })

        await redis_value_update(auth_id, updated_user, 60 * 60 * 23)

        return res.status(200).json({msg: 'Password updated successfully ', user: updated_user})
        
    } catch (err:any) {
        console.log('Error occured whiile reseting user password ', err);
        return res.status(500).json({err: 'Error occured while resetting user password ', error: err})
    }
}





