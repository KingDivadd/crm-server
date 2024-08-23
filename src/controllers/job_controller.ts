import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
import { connect } from 'mongoose'
const bcrypt = require('bcrypt')


//Sales personnel are allowed to create lead
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
            prisma.job.findFirst({select: {job_ind: true}, orderBy: {created_at: 'desc'}}),
            prisma.sales_Pipeline.findFirst({orderBy: {created_at: 'desc'}}),
            prisma.notification.findFirst({select: {notification_ind: true}, orderBy: {created_at: 'desc'}}),
            prisma.project.findFirst({ select: {project_ind: true}, orderBy: {created_at: 'desc'}}),
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


// Helper function to generate new index based on the last one
function generateNewInd(lastInd: string | undefined, prefix: string): string {
    const lastNumber = lastInd ? parseInt(lastInd.slice(2)) : 0;
    const newNumber = lastNumber + 1;
    return `${prefix}${newNumber.toString().padStart(4, '0')}`;
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
            prisma.sales_Pipeline.findFirst({orderBy: {created_at: 'desc'}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}}),
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
                cover_size, cover_color, permit_number, general_permit_documents, general_permit_approval_date, general_permit_submit_date, general_permit_status,electrical_permit_documents, electrical_permit_submit_date, electrical_permit_approval_date, electrical_permit_status, engineering_permit_documents, engineering_permit_approval_date, engineering_permit_submit_date, engineering_permit_status, hoa_permit_approval_date, hoa_permit_documents, hoa_permit_status, hoa_permit_submit_date, contract_date, contract_amount,job_adder: {connect: {user_id: req.user.user_id} }, lead: {connect: {lead_id}}, attached, updated_at: converted_datetime(), created_at: converted_datetime()
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

export const create_task_data = async(req: CustomRequest, res: Response)=>{
    try {
        
        const [all_jobs, admin_team, engineering_team, permit_team, electrical_team] = await Promise.all([
            prisma.job.findMany({ include: {lead: true}, orderBy: {job_ind: 'desc'} }),
            prisma.user.findMany({where: {user_role: 'admin'}}),
            prisma.user.findMany({where: {user_role: 'engineering'}}),
            prisma.user.findMany({where: {user_role: 'permit'}}),
            prisma.user.findMany({where: {user_role: 'electrical'}}),

        ]) 
                
        return res.status(200).json({nbHit: all_jobs.length, jobs: all_jobs, admin_team, engineering_team, permit_team, electrical_team })

    } catch (err:any) {
        console.log('Error occured while fetching all jobs');
        return res.status(500).json({err: 'Error occured while fetching all jobs'})
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
                    take: 15, orderBy: { job_ind: 'desc'  } 
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
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}})
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

export const all_project = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_projects, projects] = await Promise.all([

            prisma.project.count({}),
            prisma.project.findMany({
                include: {
                    project_adder: {
                        select: {
                            first_name: true, last_name: true, user_id: true, avatar: true,
                        }
                    },
                    job: {
                        include: {lead: {
                            include: { assigned_to: {select: {last_name: true, first_name: true},}} 
                        }}
                }}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { project_ind: 'desc'  } }),

        ])

        const number_of_projects_pages = (number_of_projects <= 15) ? 1 : Math.ceil(number_of_projects / 15)

        return res.status(200).json({
            msg: 'All Projects ', 
            total_number_of_projects: number_of_projects,
            total_number_of_projects_pages: number_of_projects_pages,
            projects: projects,
        })

        
    } catch (err:any) {
        console.log('Error occured while fetching all projects ', err);
        return res.status(500).json({err: 'Error occured while fetching all projects ', error: err})
    }
}