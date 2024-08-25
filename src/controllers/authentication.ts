import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { salt_round } from '../helpers/constants'
import  { redis_value_update, redis_auth_store, redis_otp_store } from '../helpers/redis_functions'
import generate_otp from '../helpers/generate_otp'
import {otp_messanger, welcome_mail_messanger} from '../helpers/email'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
const bcrypt = require('bcrypt')

export const logged_in_user = async(req: CustomRequest, res: Response)=>{
    try {

        const user_id = req.user.user_id

        const [user, notification] = await Promise.all([
            prisma.user.findFirst({where: {user_id}}),

            prisma.notification.findMany({})
        ])

        return res.status(200).json({user, notification})
        
    } catch (err:any) {
        console.log('Error occured while fetching user data', err);
        return res.status(500).json({err:'Error occured while fetching user data', error:err});
        
    }
}

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
                user_ind: new_user_ind,
                first_name, last_name, email, password: encrypted_password, user_role: 'admin', phone_number,

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
        const staff = await prisma.user.findUnique({ where: {email}, include: {company: true} })

        if (!staff){return res.status(404).json({err: 'Incorrect email address, please check email and try again.'})}

        if (!staff.is_verified ){ return res.status(401).json({err: 'Account not verified yet.'}) }

        const encrypted_password = staff.password
        const match_password: boolean = await bcrypt.compare(password, encrypted_password)

        if (!match_password) { console.log('Incorrect password'); return res.status(401).json({ err: `Incorrect password` }); }

        const new_auth_id:any = await redis_auth_store(staff, 60 * 60 * 23)
        
        res.setHeader('x-id-key', new_auth_id)

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


export const get_user_info = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const user_id = req.user.user_id

        const user = await prisma.user.findUnique({where: {user_id}})

        if (!user){
            return res.status(404).json({err: 'User not found'})
        }

        return res.status(200).json({msg: 'User data', user: user})
    } catch (err: any) {
        console.log('Errror getting user data ', err);
        return res.status(500).json({err: 'Error getting user data ', error: err})
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
    try {

        const auth_id = req.headers['x-id-key'];

        const encrypted_password = await bcrypt.hash(req.body.new_password, salt_round);

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

export const logged_in_admin = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user_id = req.user.user_id;

        const {page_number,  notification_page_number} = req.params

        const [user,  leads, sales, installations, project, number_of_activities, activities, service_tickets, payments, accounting, number_of_notification , task_notification ] = await Promise.all([

            prisma.user.findUnique({ where: {user_id}, include: {company: true}}),

            prisma.lead.findMany({}),
            prisma.sale.findMany({}),
            prisma.installation.findMany({}),
            prisma.project.findMany({}),

            prisma.activity.count({}),
            prisma.activity.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, include: {user: true}, orderBy: { created_at: 'desc'  } }),

            prisma.service_Ticket.findMany({}),
            prisma.payment.findMany({}),
            prisma.accounting.findMany({}),

            prisma.task_Notification.count({}),
            prisma.task_Notification.findMany({ skip: (Math.abs(Number(notification_page_number)) - 1) * 10, include: {user: true}, take: 10, orderBy: { created_at: 'desc'  } }),

            
        ])

        const number_of_activity_pages = (number_of_activities <= 10) ? 1 : Math.ceil(number_of_activities / 10)

        const number_of_notification_pages = (number_of_notification <= 10) ? 1 : Math.ceil(number_of_notification / 10)

        
        return res.status(200).json({
            msg: 'User data fetched successfully ', 
            logged_in_admin: user,
            total_number_of_leads: leads.length,
            total_number_of_sales: sales.length,
            total_number_of_installations: installations.length,
            total_number_of_projects: project.length,
            total_number_of_recent_activities: number_of_activities,
            total_number_of_recent_activities_pages: number_of_activity_pages,
            activities: activities,
            new_lead: leads,

            pending_sales: sales.filter((data:any)=> data.sale_status == 'PENDING'),
            ongoing_installations: installations.filter((data:any) => data.installation_status == 'IN_PROGRESS'),
            open_service_tickets: service_tickets.filter((data:any) => data.status == 'OPEN' ),
            pending_payments: payments.filter((data:any) => data.payment_status == 'PENDING'),
            accounting: accounting,

            total_number_of_task_notification: number_of_activities,
            total_number_of_task_notifications_pages: number_of_notification_pages,
            task_notification: task_notification,

        })

    } catch (err:any) {
        console.log('Error occured while fetching logged in user data ', err);
        return res.status(500).json({err: 'Error occured while fetching logged in user data ', error: err})
    }
}

export const main_sales_dashboard = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user_id = req.user.user_id
        if (req.user.user_role !== 'sales'){ return res.status(401).json({err: 'Dashboard information only meant for sales personnel ' })}

        const [total_lead, converted_lead, total_job, total_task, recent_lead, recent_tasks, recent_notifications] = await Promise.all([
            prisma.lead.count({}),
            prisma.lead.count({where: {disposition: 'SOLD'}}),
            prisma.job.count({}),
            prisma.task.count({}),
            
            prisma.lead.findMany({include: {assigned_to: true }, take: 15, orderBy: {created_at: 'desc'}}),
            prisma.task.findMany({include: {job: {select: {job_ind: true}}}, take: 15, orderBy: {created_at: 'desc'}}),
            prisma.notification.findMany({include: {source: true, user: true , lead: true, job: true, task: true}, take: 15, orderBy: {created_at: 'desc'} })

        ])
        

        return res.status(200).json({total_lead, converted_lead, total_job, total_task, recent_lead, recent_tasks, recent_notifications })
        
    } catch (err:any) {
        console.log('Error occured while fetching sales dashboard information : ', err);
        return res.status(500).json({err: 'Error occured while fetching sales dashboard information ', error: err})
    }
}

export const all_users = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_users, users] = await Promise.all([
            prisma.user.count({}),

            prisma.user.findMany({

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                orderBy: { created_at: 'desc' }
                
            })
        ])

        const number_of_pages = (number_of_users <= 15) ? 1 : Math.ceil(number_of_users/15)

        return res.status(200).json({ message:'All Users', data: {total_number_of_users: number_of_users, total_number_of_pages: number_of_pages, users} })
        
    } catch (err:any) {
        console.log('Error occured while fetching all users ', err);
        return res.status(500).json({err: 'Error occured while fetching all users', error: err})
    }
}

export const filter_users = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_users, users] = await Promise.all([
            prisma.user.count({ 
                where: { OR: [
                    { user_role: { contains: req.body.user_role, mode: "insensitive" }},
                    {last_name: {contains: req.body.name, mode: "insensitive"}},
                    {first_name: {contains: req.body.name, mode: "insensitive"}},
                    {email: {contains: req.body.name, mode: "insensitive"}},

                ] } 
            }),

            prisma.user.findMany({

                where: { OR: [
                    { user_role: { contains: req.body.user_role, mode: "insensitive" }},
                    {last_name: {contains: req.body.name, mode: "insensitive"}},
                    {first_name: {contains: req.body.name, mode: "insensitive"}},
                    {email: {contains: req.body.name, mode: "insensitive"}},

                ] }, 

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                orderBy: { created_at: 'desc' }
                
            })
        ])

        const number_of_pages = (number_of_users <= 15) ? 1 : Math.ceil(number_of_users/15)

        return res.status(200).json({ message:'All Filtered Users', data: {total_number_of_users: number_of_users, total_number_of_pages: number_of_pages, users} })
        
    } catch (err:any) {
        console.log('Error occured while fetching all filtered users ', err);
        return res.status(500).json({err: 'Error occured while fetching all filtered users', error: err})
    }
}

export const update_user_data = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        req.body.updated_at = converted_datetime()

        const updated_user = await prisma.user.update({
            where: {user_id: req.user.user_id},
            data: req.body
        })

        return res.status(200).json({msg: "Profile updated successfully. ", updated_user})
        
    } catch (err:any) {
        console.log('Error occured while updating user data', err);
        return res.status(500).json({err: 'Error occured while updating patient data ', error: err})
    }
}