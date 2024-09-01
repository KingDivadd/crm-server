import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { admin_delete_user_data_mail, admin_update_user_data_mail, created_user_welcome_mail } from '../helpers/email'
import { salt_round } from '../helpers/constants'
import generate_otp from '../helpers/generate_otp'
const bcrypt = require('bcrypt')


// main dashboard
export const admin_main_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user = req.user

        const [total_lead, jobs, total_installations, recent_lead, recent_job, recent_invoice, recent_payment ] = await Promise.all([
            prisma.lead.count(),
            prisma.job.findMany({select: {job_id: true, contract_amount: true}}),
            prisma.install.count(),
            prisma.lead.findMany({
                take: 15, include: {
                    lead_adder: {select: {first_name: true, last_name: true, user_id: true, user_role: true, }},
                    lead_designer: {select: {first_name: true, last_name: true, user_id: true, user_role: true, }},
                },
                orderBy: {created_at: 'desc'}
            }),
            prisma.job.findMany({
                take: 15, include: {
                    lead: {select: {lead_id: true, lead_ind: true, customer_last_name: true, customer_first_name: true}},
                    job_adder: {select: {first_name: true, last_name: true, user_id: true, user_role: true, }},
                },
                orderBy: {created_at: 'desc'}
            }),
            prisma.invoice.findMany({
                take: 15, include: {
                    customer: {select: {first_name: true, last_name: true, user_id: true, user_role: true, }},
                },
                orderBy: {created_at: 'desc'}
            }),
            prisma.payment.findMany({
                take: 15, include: {
                    invoice: true
                },
                orderBy: {created_at: 'desc'}
            })
        ])

        const revenue_generated = jobs.reduce((accumulator, currentValue) => accumulator + currentValue.contract_amount, 0);

        return res.status(200).json({
            msg: 'Admin Dashboard Data',
            total_lead, total_job: jobs.length, total_installations, total_revenue_generated: revenue_generated,
            recent_lead, recent_job, recent_invoice, recent_payment
        })

    } catch (err:any) {
        console.log('Error occured while fetching admin dashboard data ', err);
        return res.status(500).json({err:'Error occured while fetching admin dashboard data ', error: err});
    }
}

//  User management

export const all_paginated_users = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_users, users ] = await Promise.all([

            prisma.user.count({
                where: {user_id: {not: user_id}, deleted: false}
            }),
            prisma.user.findMany({
                where: {user_id: {not: user_id}, deleted: false},
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_users_pages = (number_of_users <= 15) ? 1 : Math.ceil(number_of_users / 15)

        return res.status(200).json({ total_number_of_users: number_of_users, total_number_of_pages: number_of_users_pages, users })

    } catch (err:any) {
        console.log('Error occured while fetching all users ', err);
        return res.status(500).json({err:'Error occured while fetching all users ', error:err});
    }
}

export const all_designers = async(req: CustomRequest, res: Response)=>{
    try {
        
        const users = await prisma.user.findMany({
            where: {user_role: 'designer'}
        })

        return res.status(200).json({
            msg: 'All designers',
            designers: users
        })

    } catch (err:any) {
        console.log('Error occured while fetching all designers ', err);
        return res.status(500).json({err:'Error occured while fetching all designers ', error: err});
    }
}

export const add_new_user = async(req: CustomRequest, res: Response)=>{
    try {
        const user_role = req.user.user_role

        if (user_role !== 'admin' || user_role !== 'super_admin') { 
            return res.status(401).json({err: 'Not authorized perform operation`'})
        }

        const [last_user, last_tracking] = await Promise.all([
            prisma.user.findFirst({ orderBy: {created_at: 'desc' }, select: {user_ind: true} }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} })
        ]) 

        const last_user_number = last_user ? parseInt(last_user.user_ind.slice(2)) : 0;
        const new_user_number = last_user_number + 1;
        const new_user_ind = `US${new_user_number.toString().padStart(4, '0')}`;


        const encrypted_password = await bcrypt.hash(req.body.password, salt_round)

        req.body.password = encrypted_password
        req.body.user_ind = new_user_ind

        const new_user = await prisma.user.create({
            data: {
                ...req.body,

                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        })

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TS${new_tracking_number.toString().padStart(4, '0')}`;

        await prisma.user_Tracking.create({
            data: {
                tracking_ind: new_tracking_ind,
                user: {connect: {user_id: req.user.user_id}},
                action_type: 'user_modification',
                action_details: {
                    user_id: new_user.user_id, time: new_user.created_at, modification_type: 'added'
                },
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        });

        const otp = generate_otp()
        
        created_user_welcome_mail(new_user, otp)

        return res.status(201).json({
            msg: 'User Added Successfully',
            user: new_user
        })
        
    } catch (err:any) {
        console.log('Error occured while add a new user ', err);
        return res.status(500).json({err: 'Error occured while add a new user ', error: err});
    }
}

export const edit_user_data = async(req: CustomRequest, res: Response)=>{
    const {first_name, last_name, phone_number, country_code, user_role, password} = req.body
    try {
        const user_rol = req.user.user_role

        const {user_id} = req.params

        if (user_rol !== 'admin' || user_rol !== 'super_admin') {
            return res.status(401).json({er: 'Not authorized to perform operation'})
        }

        const update:any = {}

        if (first_name && first_name.trim() !== '') {  update.first_name = first_name }

        if (last_name && last_name.trim() !== '') {  update.last_name = last_name }

        if (phone_number && phone_number.trim() !== '') {  update.phone_number = phone_number }

        if (country_code && country_code.trim() !== '') {  update.country_code = country_code }

        if (user_role && user_role.trim() !== '') {  update.user_role = user_role }

        if (password) {
            const encrypted_password = await bcrypt.hash(req.body.password, salt_round)
            update.password = encrypted_password
        }

        update.updated_at = converted_datetime()

        const [update_user_date, last_tracking] = await Promise.all([
            prisma.user.update({
                where: {user_id}, 
                data: update
            }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} })
        ]) 

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TS${new_tracking_number.toString().padStart(4, '0')}`;

        await prisma.user_Tracking.create({
            data: {
                tracking_ind: new_tracking_ind,
                user: {connect: {user_id: req.user.user_id}},
                action_type: 'user_modification',
                action_details: {
                    user_id: update_user_date.user_id, time: update_user_date.updated_at, modification_type: 'update'
                },
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        });

        admin_update_user_data_mail(update_user_date)

        return res.status(200).json({
            msg: 'Updated User Data',
            user: update_user_date
        })

    } catch (err:any) {
        console.log('Error occured while updating user\'s data ', err);
        return res.status(500).json({err: 'Error occured while updating user\'s data ', error: err});
    }
}

export const delete_user = async(req: CustomRequest, res: Response)=>{
    try {
        const user_role = req.user.user_role
        if (user_role !== 'super_admin' || user_role !== 'admin') {
            return res.status(401).json({err: 'Not authorized to perform operation'})
        }
        
        const {user_id} = req.params
        
        const [user_exist, last_tracking] = await Promise.all([
            prisma.user.findFirst({ where: {user_id} }),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}})
        ]) 

        if (!user_exist) { return res.status(404).json({err: 'User not found!'}) }

        if (user_exist.user_role == 'admin' && user_role == 'admin' ) {
            return res.status(401).json({ err: 'Operation restricted to super admin only!'})
        }

        if (user_exist.user_role == 'super_admin') {
            return res.status(401).json({err: 'Not authorized to delete super admin'})
        }

        const user = await prisma.user.update({
            where: {user_id},
            data: {
                deleted: true,
                updated_at: converted_datetime()
            }
        })

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TS${new_tracking_number.toString().padStart(4, '0')}`;

        await prisma.user_Tracking.create({
            data: {
                tracking_ind: new_tracking_ind,
                user: {connect: {user_id: req.user.user_id}},
                action_type: 'user_modification',
                action_details: {
                    user_id: user.user_id, time: user.updated_at, modification_type: 'delete'
                },
                created_at: converted_datetime(),
                updated_at: converted_datetime(),
            }
        });

        admin_delete_user_data_mail(user_exist)

        return res.status(200).json({
            msg: 'User deleted'
        })

    } catch (err:any) {
        console.log('Error occured while deleting user\'s data ', err);
        return res.status(500).json({err: 'Error occured while deleting user\'s data ', error: err});
    }
}

