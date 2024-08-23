import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import {send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')

export const user_projects = async (req: CustomRequest, res: Response) => {
    try {
        const user_id = req.user.user_id;

        // Filter projects by customer_id directly in the query
        const user_prj = await prisma.project.findMany({
            where: {
                job: {
                    customer_id: user_id,
                },
            },
            include: {
                job: true,
            },
        });

        return res.status(200).json({ msg: 'User Projects', projects: user_prj });
    } catch (err: any) {
        console.error('Error occurred while fetching user\'s project:', err);
        return res.status(500).json({ err: 'Error occurred while fetching user\'s project', error: err });
    }
};


export const create_ticket = async(req: CustomRequest, res: Response)=>{
    const {project_id, description, image_url} = req.body
    try {
        if (req.user.user_role !== 'customer') { return res.status(401).json({err: 'Only customers can create service tickets '}) }

        const [project, last_ticket, last_notification] = await Promise.all([
            prisma.project.findUnique({ where: {project_id}, include: {job: {select: {job_adder: true, job_adder_id: true}}} }),

            prisma.service_Ticket.findFirst({ orderBy: {created_at: 'desc'} }),

            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}})

        ])

        // if (project.status == 'PENDING' || project.status == 'ON_HOLD') {
        //     return res.status(400).json({err: 'Selected Project is unavailable for tickets.'})
        // }
        
        const last_ticket_number = last_ticket ? parseInt(last_ticket.service_ticket_ind.slice(2)) : 0;
        const new_ticket_number = last_ticket_number + 1;
        const new_ticket_ind = `ST${new_ticket_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const new_tiket = await prisma.service_Ticket.create({
            data: {
                service_ticket_ind: new_ticket_ind,
                project: {connect: {project_id}},
                created_by: {connect: {user_id: req.user.user_id}},
                description, image_url,

                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        if (new_tiket) {
            await prisma.notification.create({
                data: {
                    subject: 'Service Ticket Created',
                    message: `${req.user.first_name} ${req.user.last_name} created a service ticket`,
                    notification_ind: new_notification_ind,

                    source: {connect: {user_id: req.user.user_id}},

                    user: {connect: {user_id: project?.job.job_adder_id || ''}},

                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            })
            
        }

        return res.status(201).json({err: 'Service ticket created successfully ',  ticket: new_tiket})
        
    } catch (err:any) {
        console.log('Error occured whhile creating service ticket  ', err);
        return res.status(500).json({err:'Error occured whhile creating service ticket  ', error:err});
        
    }
}

export const all_ticket = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_tickets, tickets] = await Promise.all([

            prisma.service_Ticket.count({}),
            prisma.service_Ticket.findMany({ include: {created_by: true, updated_by: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { service_ticket_ind: 'desc'  } }),

        ])

        const number_of_tickets_pages = (number_of_tickets <= 15) ? 1 : Math.ceil(number_of_tickets / 15)

        return res.status(200).json({
            msg: 'All Tickets ', 
            total_number_of_tickets: number_of_tickets,
            total_number_of_tickets_pages: number_of_tickets_pages,
            tickets: tickets,
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching all tickets ', err);
        return res.status(500).json({err: 'Error occured while fetching all tickets ', error:err});
        
    }
}