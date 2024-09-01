import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'

export const customer_main_dashbaord = async(req: CustomRequest, res: Response)=>{
    try {

        
    } catch (err:any) {
        console.log('Error occured while fetching customer\'s main daashboard ', err);
        return res.status(500).json({err:'Error occured while fetching customer\'s main daashboard ', error:err});
    }
}

export const make_new_payment = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user = req.user

        const {invoice_id} = req.params

        const [invoice_exist, last_payment] = await Promise.all([
            prisma.invoice.findFirst({ where: {invoice_id} }),
            prisma.payment.findFirst({orderBy: {created_at: 'desc'}, select: {payment_ind: true}})
        ]) 

        if (!invoice_exist) { return res.status(404).json({err: 'Invoice not found.'}) } 

        const last_payment_number = last_payment ? parseInt(last_payment.payment_ind.slice(2)) : 0;
        const new_payment_number = last_payment_number + 1;
        const new_payment_ind = `PY${new_payment_number.toString().padStart(4, '0')}`;

        const new_payment = await prisma.payment.create({
            data: {
                payment_ind: new_payment_ind, invoice_id: invoice_id, user_id: req.user.user_id,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            },
            include: {
                invoice: {
                    select: {invoice_ind: true, customer: {select: {first_name: true, last_name: true, user_ind: true, }} }
                }
            }
        })


        if (new_payment && req.body.payment_receipt) {
            await prisma.invoice.update({
                where: {invoice_id},
                data: {
                    payment_receipt: req.body.payment_receipt,
                    updated_at: converted_datetime()
                }
            })
        }

        return res.status(201).json({
            msg: 'Payment succesfully', 
            payment: new_payment
        })

    } catch (err:any) {
        console.log('Error occured while making new payment ', err);
        return res.status(500).json({err:'Error occured while making new payment ', error: err});
    }
}


export const all_paginated_invoice = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_invoice, invoices ] = await Promise.all([

            prisma.invoice.count({ where: {customer_id: user_id} }),

            prisma.invoice.findMany({
                where: {customer_id: user_id},
                include: {job: true},
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc' } 
            }),

        ])
        
        const number_of_invoice_pages = (number_of_invoice <= 15) ? 1 : Math.ceil(number_of_invoice / 15)

        return res.status(200).json({ total_number_of_invoice: number_of_invoice, total_number_of_pages: number_of_invoice_pages, invoices })

    } catch (err:any) {
        console.log('Error occured while fetching all customer invoices ', err);
        return res.status(500).json({err:'Error occured while fetching all customer invoices ', error:err});
    }
}

export const all_paginated_payments = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_payment, payments ] = await Promise.all([

            prisma.payment.count({ 
                where: {user_id}
            }),

            prisma.payment.findMany({
                where: {user_id},
                include: {invoice: true},
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc' } 
            }),

        ])
        
        const number_of_payment_pages = (number_of_payment <= 15) ? 1 : Math.ceil(number_of_payment / 15)

        return res.status(200).json({ total_number_of_payment: number_of_payment, total_number_of_pages: number_of_payment_pages, payments })

    } catch (err:any) {
        console.log('Error occured while fetching all customer invoices ', err);
        return res.status(500).json({err:'Error occured while fetching all customer invoices ', error:err});
    }
}

export const edit_service_ticket = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user =  req.user

        const {project_id, ticket_id} = req.params

        const [project_exist, ticket_exist] = await Promise.all([
            prisma.project.findFirst({ where: {project_id}, select: {project_ind: true}}),
            prisma.serviceTicket.findFirst({ where: {ticket_id}, select: {ticket_ind: true}})
        ])

        if (!project_exist) {return res.status(404).json({err: 'Project not found, check project id and try again'})}

        if (!ticket_exist) {return res.status(404).json({err: 'Service Ticket not found, check ticket id and try again'})}

        const update_ticket = await prisma.serviceTicket.create({
            data: {
                project_id: project_id,
                ...req.body,
                updated_at: converted_datetime()
            }
        })

        return res.status(201).json({
            msg: 'Ticket updated successfully',
            ticket: update_ticket
        })

    } catch (err:any) {
        console.log('Error occured while creating service ticket ', err);
        return res.status(500).json({err:'Error occured while creating service ticket ', error:err});
    }
}

export const create_service_ticket = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user =  req.user

        const {project_id} = req.params

        const [project_exist, last_ticket,  last_tracking, last_notification] = await Promise.all([
            prisma.project.findFirst({ where: {project_id}, select: {project_ind: true}}),
            prisma.serviceTicket.findFirst({orderBy: {created_at: 'desc'}, select: {ticket_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
        ])

        if (!project_exist) {return res.status(404).json({err: 'Project not found, check project id and try again'})}

        
        const last_ticket_number = last_ticket ? parseInt(last_ticket.ticket_ind.slice(2)) : 0;
        const new_ticket_number = last_ticket_number + 1;
        const new_ticket_ind = `TK${new_ticket_number.toString().padStart(4, '0')}`;        
        
        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TS${new_tracking_number.toString().padStart(4, '0')}`;        
        
        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const new_ticket = await prisma.serviceTicket.create({
            data: {
                ticket_ind: new_ticket_ind, ticket_creator_id: user.user_id, project_id: project_id,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        await Promise.all([
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'ticket_modification',
                    action_details: {
                        ticket_id: new_ticket.ticket_id, time: new_ticket.created_at, modification_type: 'added'
                    },
                    created_at: converted_datetime(),
                    updated_at: converted_datetime(),
                }
            }),

            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'New Service Ticket Created', ticket_id: new_ticket.ticket_id,

                    message: `${user.first_name} ${user.last_name} created a new service ticket with Id ${new_ticket.ticket_ind}.`,

                    view_by_admin: true, notification_type: 'service_ticket',

                    notification_source_id: req.user.user_id, notification_to_id: null,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(201).json({
            msg: 'Ticket created successfully',
        })

    } catch (err:any) {
        console.log('Error occured while creating service ticket ', err);
        return res.status(500).json({err:'Error occured while creating service ticket ', error:err});
    }
}