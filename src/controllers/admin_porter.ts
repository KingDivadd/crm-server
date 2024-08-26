import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email } from '../helpers/email'


// main dashboard

export const admin_main_dashboard = async(req: CustomRequest, res: Response)=>{
    try {

        const [total_lead, total_sale, total_installation, total_project, recent_task, recent_lead, recent_project, recent_payment] = await Promise.all([
            prisma.lead.count({}),
            prisma.lead.count({where: {disposition: 'SOLD'}}),
            prisma.installation.count({}),
            prisma.project.count({}),
            prisma.task.findMany({ 
                include: {task_assigned_to: {select: {first_name:true, last_name: true, user_ind: true, user_id: true, jobs: {select: {job_ind: true}} } }} ,
                take: 15, orderBy: {created_at: 'asc'} 
            }),
            prisma.lead.findMany({ include: {customer: true, assigned_to: true} ,take: 15, orderBy: {created_at: 'asc'} }),

            prisma.project.findMany({ 
                include: {
                    job: {
                        select: { 
                            job_ind: true, 
                            lead: {select: {customer_name: true, lead_ind: true, assigned_to: {select: {first_name: true, last_name: true, user_id: true} }}} 
                        }
                    }},
                take: 15, orderBy: {created_at: 'asc'} 
            }),

            prisma.payment.findMany({
                include: { job: {select: {job_ind: true, customer: {select: {first_name: true, last_name: true, email: true}}  }} },
                take: 15, orderBy: {created_at: 'asc'}
                }),
        ])

        return res.status(200).json({
            msg: 'Admin Dashboard',
            total_lead, total_sale, total_installation, total_project, recent_task, recent_lead, recent_project, recent_payment
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching admin dashboard ', err);
        return res.status(500).json({err: 'Error occured while fetching admin dashboard ', error: err})
    }
}

// user management

export const all_app_users = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_users, users] = await Promise.all([
            prisma.user.count({
                where: {user_id: {not: req.user.user_id}}
            }),

            prisma.user.findMany({
                
                where: {user_id: {not: req.user.user_id}},

                skip: (Math.abs(Number(page_number)) - 1) * 15,

                take: 15,

                orderBy: { created_at: 'asc' }
                
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

                orderBy: { created_at: 'asc' }
                
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

// lead

export const all_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_leads, leads] = await Promise.all([

            prisma.lead.count({}),
            prisma.lead.findMany({ 
                include: {
                    assigned_to: true,
                    lead_adder: {select: { first_name: true, last_name: true, email: true, user_id: true } }
                }, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, 
                take: 15, orderBy: { lead_ind: 'asc'  } 
            }),

        ])

        const number_of_leads_pages = (number_of_leads <= 15) ? 1 : Math.ceil(number_of_leads / 15)

        return res.status(200).json({
            msg: 'All Leads ', 
            total_number_of_leads: number_of_leads,
            total_number_of_leads_pages: number_of_leads_pages,
            leads: leads,
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching all lead ', err);
        return res.status(500).json({err: 'Error occured while fetching all leads ', error: err})
    }
}

export const filter_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    
    try {

        const {page_number, disposition} = req.params

        if (!['sold', 'not_sold'].includes(disposition.toLowerCase())){
            return res.status(400).json({err: 'Invalid status entered. valid entries [sold, not_sold]'})
        }

        const [number_of_leads, leads] = await Promise.all([

            prisma.lead.count({ where: {disposition: disposition.toUpperCase()}, }),
            prisma.lead.findMany({ include: {assigned_to: true, designer: true, job: true, sales: true}, skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'asc'  } }),

        ])

        const number_of_leads_pages = (number_of_leads <= 10) ? 1 : Math.ceil(number_of_leads / 10)

        return res.status(200).json({
            msg: 'Filtered Leads ', 
            total_number_of_leads: number_of_leads,
            total_number_of_leads_pages: number_of_leads_pages,
            leads: leads,
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching all lead ', err);
        return res.status(500).json({err: 'Error occured while fetching all leads ', error: err})
    }
}

export const delete_lead = async(req: CustomRequest, res: Response,next: NextFunction)=>{
    try {
        
        const {lead_id} = req.params

        const lead_exist = await prisma.lead.findUnique({ where: {lead_id }} )

        if (!lead_exist){ return res.status(404).json({err: 'Lead not found'})}

        const delete_lead = await prisma.lead.delete({ where: {lead_id} })

        return res.status(200).json({msg: 'Lead deleted successfully'})

    } catch (err:any) {
        console.log('Error occured while deleting lead ', err);
        return res.status(500).json({err: 'Error occured while deleting lead ', error: err})
    }
}

// jobs

export const create_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {
        lead_id, contract_amount, contract_date, hoa_permit_status, hoa_approval_date,
        engineering_permit_status, engineering_submit_date, engineering_approval_date,
        elecrical_permit_status, electrical_permit_submit_date, electrical_permit_approval_date, general_permit_status, general_permit_submit_date, general_permit_approval_date, cover_size, cover_color, attached, structure_type, description, end_cap_style, trim_color, 
    } = req.body
    try {

        const adder_id = req.user.user_id
        // check lead disposition status

        const [lead, job, pipeline, last_job, last_pipeline, last_notification, last_project ] = await Promise.all([
            prisma.lead.findUnique({ where: {lead_id}, include: {customer: {select: {first_name: true, last_name: true,email: true, user_id: true}}} }),
            prisma.job.findFirst({where: {lead_id}}),
            prisma.sales_Pipeline.findFirst({where: {lead_id}}),
            prisma.job.findFirst({select: {job_ind: true}, orderBy: {created_at: 'asc'}}),
            prisma.sales_Pipeline.findFirst({orderBy: {created_at: 'asc'}}),
            prisma.notification.findFirst({select: {notification_ind: true}, orderBy: {created_at: 'asc'}}),
            prisma.project.findFirst({ select: {project_ind: true}, orderBy: {created_at: 'asc'}}),
        ]) 

        if (job){ return res.status(400).json({err: 'A job is already created for selected lead!'})}

        if (!lead) { return res.status(404).json({err: 'lead not found, check lead id'}) }

        if (lead.disposition == 'NOT_SOLD'){ return res.status(400).json({err: 'Selected lead not sold yet.'}) }

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        const last_job_number = last_job ? parseInt(last_job.job_ind.slice(2)) : 0;
        const new_job_number = last_job_number + 1;
        const new_job_ind = `JB${new_job_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_project_number = last_project ? parseInt(last_project.project_ind.slice(2)) : 0;
        const new_project_number = last_project_number + 1;
        const new_project_ind = `PJ${new_project_number.toString().padStart(4, '0')}`;


        const new_job = await prisma.job.create({
            data: {
                job_ind: new_job_ind,lead: {connect: {lead_id}}, customer: {connect: {user_id:adder_id}}, 
                job_adder: {connect: {user_id: adder_id}}, contract_amount, contract_date, cover_color, cover_size, 
                updated_at: converted_datetime(), created_at: converted_datetime()
            }, include: {lead: true}, 
        })

        if (!new_job){
            return res.status(500).json({err: 'Job was not created successfully.'})
        }
                
        const [ new_job_notification, new_project, updated_pipeline] = await Promise.all([

            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    message: `A new job for ${new_job.lead?.customer_name} has been created.`,
                    subject: `New Job Created.`,
                    lead_id: lead_id,
                
                    source_id: req.user.user_id,
                    user_id: new_job.lead?.assigned_to_id ,
    
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            }),
            prisma.project.create({
                data: {
                    project_ind: new_project_ind, job_id: new_job.job_id, project_adder_id: adder_id,
                    attached, structure_type, description, end_cap_style, trim_color,cover_color, 
                    cover_size, contract_amount: contract_amount, contract_date, 
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            }),
            prisma.sales_Pipeline.update({
                where: { pipeline_id: pipeline?.pipeline_id },
                data: {
                    job_id: new_job.job_id,
                    contract_amount: Number(contract_amount),  // Update disposition if provided
                    updated_at: converted_datetime()
                }
            })
        ]) 

        if (!new_project) {
            await prisma.job.delete({where: {job_id: new_job.job_id}})
        }        

        send_job_created_email(lead.customer)
        
        return res.status(201).json({msg: "Job created successfully", job:new_job, pipeline: updated_pipeline})


    } catch (err:any) {
        console.log('Error occured while creating job', err);
        return res.status(500).json({err: 'Error occured while creating job ', error: err})
    }
}

export const edit_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {
        job_id, lead_id,permit_number, contract_amount, contract_date, hoa_permit_status, hoa_permit_approval_date, hoa_permit_documents, hoa_permit_submit_date, engineering_permit_status, engineering_permit_submit_date, engineering_permit_approval_date, engineering_permit_documents , electrical_permit_documents, electrical_permit_status , electrical_permit_submit_date, electrical_permit_approval_date, general_permit_status, general_permit_submit_date, general_permit_approval_date, general_permit_documents, cover_size, cover_color, attached, structure_type, description, end_cap_style, trim_color,
    } = req.body

    try {

        // check lead disposition status
        const {job_id} = req.params

        const [job_exist, lead, pipeline, last_pipeline, last_notification] = await Promise.all([
            prisma.job.findUnique({ where: {job_id} }),
            prisma.lead.findUnique({ where: {lead_id} }),
            prisma.sales_Pipeline.findFirst({ where: {lead_id} }),
            prisma.sales_Pipeline.findFirst({orderBy: {created_at: 'asc'}}),
            prisma.notification.findFirst({orderBy: {created_at: 'asc'}}),
        ]) 

        if (!job_exist) {
            return res.status(404).json({err: 'Job not found'})
        }

        if (!lead) { return res.status(404).json({err: 'lead not found, check lead id'}) }

        if (lead.disposition == 'NOT_SOLD'){ return res.status(400).json({err: 'Selected lead not sold yet.'}) }

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;


        

        const update_job = await prisma.job.update({
            where: {job_id: job_id},
            data: {
                cover_size, cover_color, general_permit_documents, general_permit_approval_date, general_permit_submit_date, general_permit_status,electrical_permit_documents, electrical_permit_submit_date, electrical_permit_approval_date, electrical_permit_status, engineering_permit_documents, engineering_permit_approval_date, engineering_permit_submit_date, engineering_permit_status, hoa_permit_approval_date, hoa_permit_documents, hoa_permit_status, hoa_permit_submit_date, contract_date, contract_amount,job_adder: {connect: {user_id: req.user.user_id} }, lead: {connect: {lead_id}}, attached, updated_at: converted_datetime(), created_at: converted_datetime()
                 } ,
            include: {lead: {include: {assigned_to: true}} }
        })
            
        let new_pipeline;
        if (pipeline) {
            new_pipeline = await prisma.sales_Pipeline.update({
                where: { pipeline_id: pipeline?.pipeline_id },
                data: {
                    job_id: job_id,
                    contract_amount: Number(contract_amount),  // Update disposition if provided
                    updated_at: converted_datetime()
                }
            })

            create_notification()
            
        }else{
            await prisma.sales_Pipeline.create({
                data: {
                    pipeline_ind: new_pipeline_ind,
                    lead_id: update_job.lead_id,
                    job_id: update_job.job_id,
                    contract_amount: Number(contract_amount),  // Update disposition if provided
                    updated_at: converted_datetime(),
                    created_at: converted_datetime()
                }
            })
            create_notification()
        }

        async function create_notification() {
            await prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    message: `Job for ${update_job.lead?.customer_name} has been updated.`,
                    subject: `Job with id ${update_job.job_ind} Updated.`,
                    lead_id: update_job.lead_id,
                    user_id: update_job.lead?.assigned_to_id,
                
                    source_id: req.user.user_id,
    
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })
        }
       
        return res.status(200).json({ msg: "Job and Sales Pipeline updated successfully" });


    } catch (err:any) {
        console.log('Error occured while updating jobs', err);
        return res.status(500).json({err: 'Error occured while updating jobs ', error: err})
    }
}

export const all_jobs = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_jobs, jobs] = await Promise.all([

            prisma.job.count({}),
            prisma.job.findMany({ 
                include: {
                    lead: true, 
                    job_adder: true}, 
                    skip: (Math.abs(Number(page_number)) - 1) * 15, 
                    take: 15, orderBy: { job_ind: 'asc'  } 
                }),
        ])

        const number_of_jobs_pages = (number_of_jobs <= 15) ? 1 : Math.ceil(number_of_jobs / 15)

        return res.status(200).json({
            msg: 'All Jobs ', 
            total_number_of_jobs: number_of_jobs,
            total_number_of_jobs_pages: number_of_jobs_pages,
            jobs: jobs,
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching all jobs ', err);
        return res.status(500).json({err: 'Error occured while fetching all jobs ', error: err})
    }
}

export const delete_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        if (req.user.user_role !== 'admin'){ return res.status(401).json({err: `You're not authorized to delete job, contact the admin.`}) }

        const {job_id} = req.params

        const [job_exist, last_notification] = await Promise.all([
            prisma.job.findUnique({where: {job_id}, include: {lead: true}}),
            prisma.notification.findFirst({ orderBy: {created_at: 'asc'}})
        ]) 

        if (!job_exist) { return res.status(404).json({err: 'Job not found'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;


        const del_job = await prisma.job.delete({where: {job_id}})

        if (!del_job){
            return res.status(200).json({err: 'Job deleting failed.'})
        }

        await prisma.notification.create({
            data: {
                notification_ind: new_notification_ind,
                message: `Job for ${job_exist.lead?.customer_name} has been deleted.`,
                subject: `Job Deleted.`,
            
                source_id: req.user.user_id,

                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        return res.status(200).json({msg: 'Selected Job deleted successfully'})
        
    } catch (err:any) {
        console.log('Error occured while deleting job: ', err);
        return res.status(500).json({err: 'Error occured while deleting job ', error: err})
    }
}