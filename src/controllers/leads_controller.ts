import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_not_sold_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')

export const create_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {customer_first_name, customer_last_name, address, phone_number, email, gate_code, assigned_to_id, appointment_date, disposition} = req.body
    try {
        const user_id = req.user.user_id

        const [ last_lead,  last_pipeline, last_notification] = await Promise.all([
            prisma.lead.findFirst({ orderBy: {created_at: 'desc'}}),
            prisma.sales_Pipeline.findFirst({ orderBy: {created_at: 'desc'}}),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}}),
        ]) 

        const last_lead_number = last_lead ? parseInt(last_lead.lead_ind.slice(2)) : 0;
        const new_lead_number = last_lead_number + 1;
        const new_lead_ind = `LD${new_lead_number.toString().padStart(4, '0')}`;
        req.body.lead_ind = new_lead_ind

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        req.body.lead_adder_id = user_id

        const new_lead = await prisma.lead.create({
            data: {
                ...req.body,
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        const [new_sales_pipeline, notification] = await Promise.all([
            prisma.sales_Pipeline.create({
            data: {
                pipeline_ind: new_pipeline_ind,
                lead_id: new_lead.lead_id, 
                disposition: disposition, 
                status: disposition === 'SOLD' ? 'SOLD' : 'INITIAL_CONTACT',
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        }),
        
        prisma.notification.create({
            data: {
                notification_ind: new_notification_ind,
                message: `A new lead has been created for ${new_lead.customer_first_name} ${new_lead.customer_last_name}.`,
                subject: `New Lead Created.`,
                lead_id: new_lead.lead_id,
            
                source_id: req.user.user_id,

                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        ])

        const user = {first_name: customer_first_name, last_name: customer_last_name || '', email:email}
        if (email) {   
            send_lead_created_email(user)        
        }

        return res.status(201).json({msg: "Lead and Sales Pipeline created successfully", lead: new_lead, pipeline: new_sales_pipeline});

    } catch (err:any) {
        console.log('Error occured while creating lead', err);
        return res.status(500).json({err: 'Error occured while creating lead ', error: err})
    }
}

export const update_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {customer_first_name, customer_last_name, phone_number, email, gate_code, assigned_to_id, appointment_date, disposition} = req.body
    try {
        
        const {lead_id} = req.params

        const [updated_lead, pipeline, last_pipeline, last_notification, last_user] = await Promise.all([
            prisma.lead.update({
                where: {lead_id},
                data: {
                    ...req.body,
    
                    updated_at: converted_datetime()
                }
            }),

            prisma.sales_Pipeline.findFirst({ where: {lead_id}, select: {pipeline_id: true, disposition: true}}),
            prisma.sales_Pipeline.findFirst({select: { pipeline_ind:true}, orderBy: {created_at: 'desc'}}),
            prisma.notification.findFirst({select: { notification_ind:true}, orderBy: {created_at: 'desc'}}),
            prisma.user.findFirst({select: {first_name: true, last_name: true, user_ind:true, email: true}, orderBy: {created_at: 'desc'}}),
        ])

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_user_number = last_user ? parseInt(last_user.user_ind.slice(2)) : 0;
        const new_user_number = last_user_number + 1;
        const new_user_ind = `US${new_user_number.toString().padStart(4, '0')}`;

        if (disposition == 'NOT_SOLD' && updated_lead.customer_id ) {
            
            if (updated_lead.customer_id) {
                const del_user = await prisma.user.delete({ where: {user_id: updated_lead.customer_id}})
                const user = {first_name: last_user?.first_name, last_name: last_user?.last_name, email: last_user?.email }
                send_lead_not_sold_email(user)
            }
        }

        if (disposition == 'SOLD') {
            const encrypted_password = await bcrypt.hash('password', salt_round);
            const new_user = await prisma.user.create({

                data: {
                    
                    user_ind: new_user_ind,
                    first_name: customer_first_name,
                    last_name: customer_last_name,
                    user_role: 'customer',
                    phone_number, password: encrypted_password,email,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })

            await prisma.lead.update({ where: {lead_id}, data: {customer_id: new_user.user_id} })

            send_lead_sold_email(new_user)
        }

        if (pipeline){
            const [updated_pipeline, notification] = await Promise.all([
                prisma.sales_Pipeline.update({
                where: { pipeline_id: pipeline.pipeline_id },
                data: {
                    status: disposition === 'SOLD' ? 'SOLD' : 'NEGOTIATION',
                    disposition: disposition ?? pipeline.disposition,  // Update disposition if provided
                    updated_at: converted_datetime()
                }
            }) ,

            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    message: `Lead for ${updated_lead.customer_first_name} ${updated_lead.customer_last_name} updated.`,
                    subject: `Lead Updated.`,
                    lead_id: updated_lead.lead_id,
                
                    source_id: req.user.user_id,
    
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })

            ])

            return res.status(200).json({ msg: "Lead and Sales Pipeline updated successfully", lead: updated_lead, pipeline: updated_pipeline });
        }

        const [new_sales_pipeline, notification] = await Promise.all([ 
           prisma.sales_Pipeline.create({
                data: {
                    pipeline_ind: new_pipeline_ind,
                    lead_id: lead_id, 
                    disposition: disposition, 
                    status: 'NEGOTIATION',
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            }),

            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    message: `Lead for ${updated_lead.customer_first_name} ${updated_lead.customer_last_name} updated.`,
                    subject: `Lead Updated.`,
                    lead_id: updated_lead.lead_id,
                
                    source_id: req.user.user_id,

                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })
        ])
      
        

        return res.status(201).json({msg: "Lead and pipeline created successfully", lead: update_lead, pipeline: new_sales_pipeline})

    } catch (err:any) {
        console.log('Error occured while updating lead', err);
        return res.status(500).json({err: 'Error occured while updating lead ', error: err})
    }
}

export const leads = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const leads_without_jobs = await prisma.lead.findMany({
            where: {
                disposition: 'SOLD',
                job: {
                    none: {}, // This means no jobs are associated with the lead
                },
            },
            include: { assigned_to: true },
        });

        return res.status(200).json({ nbHit: leads_without_jobs.length, leads: leads_without_jobs });
    } catch (err: any) {
        console.log('Error occurred while fetching leads without jobs ', err);
        return res.status(500).json({ err: 'Error occurred while fetching leads without jobs', error: err });
    }
};



// ------------------------------------------------------------------SALES PIPELINE PAGE--------------------------------------------------------


export const job_contract_overview = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_jobs, jobs ] = await Promise.all([

            prisma.job.count({}),
            prisma.job.findMany({ include: {customer: true, sale: true, lead: true}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_jobs_pages = (number_of_jobs <= 15) ? 1 : Math.ceil(number_of_jobs / 15)

        return res.status(200).json({ total_number_of_jobs: number_of_jobs, total_number_of_jobs_pages: number_of_jobs_pages, jobs: jobs, })

    } catch (err: any) {
        console.log('Error occured while fetching job page ', err);
        return res.status(200).json({err: 'Error occured while fetching job page ', error: err})
    }
}

export const project_information = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_project_information, projects ] = await Promise.all([

            prisma.project.count({}),
            prisma.project.findMany({ include: {sale: true, job: true}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_project_information_pages = (number_of_project_information <= 15) ? 1 : Math.ceil(number_of_project_information / 15)

        return res.status(200).json({ total_number_of_project: number_of_project_information, 
            total_number_of_project_information_pages: number_of_project_information_pages, projects: projects })

    } catch (err: any) {
        console.log('Error occured while fetching project information ', err);
        return res.status(200).json({err: 'Error occured while fetching project information.', error: err})
    }
}

export const installation_overview = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_project_tracking, project_tracking ] = await Promise.all([

            prisma.installation.count({}),
            prisma.installation.findMany({ include: {user: true, job: true}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_project_tracking_pages = (number_of_project_tracking <= 15) ? 1 : Math.ceil(number_of_project_tracking / 15)

        return res.status(200).json({ total_number_of_project_tracking: number_of_project_tracking, 
            total_number_of_project_tracking_pages: number_of_project_tracking_pages, project_tracking: project_tracking })

    } catch (err: any) {
        console.log('Error occured while fetching project tracking data ', err);
        return res.status(200).json({err: 'Error occured while fetching project tracking data ', error: err})
    }
}

export const tasks = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_tasks, tasks ] = await Promise.all([

            prisma.task.count({}),
            prisma.task.findMany({ include: {created_by: true,}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_task_pages = (number_of_tasks <= 15) ? 1 : Math.ceil(number_of_tasks / 15)

        return res.status(200).json({ total_number_of_tasks: number_of_tasks, 
            total_number_of_tasks_pages: number_of_task_pages, tasks: tasks })

    } catch (err: any) {
        console.log('Error occured while fetching task data ', err);
        return res.status(200).json({err: 'Error occured while fetching task data', error: err})
    }
}
