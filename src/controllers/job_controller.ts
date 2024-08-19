import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')


//Sales personnel are allowed to create lead
export const create_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {contract_amount, contract_date, hoa_status, engineering_submitted, engineering_received, permit_sent_date, permit_approved_date, lead_id, engineering_status, cover_size, cover_color, permit_status, attached, structure_type, description, end_cap_style, trim_color} = req.body
    try {

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
                job_ind: new_job_ind, lead: {connect: {lead_id}}, contract_amount: Number(contract_amount.replace(/,/g,'')), contract_date, cover_color, cover_size, engineering_received_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_received, engineering_status, engineering_submit_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_submitted, hoa_status: hoa_status, permit_approval_date: permit_status == 'NOT_REQUIRED' ? "": permit_approved_date, permit_submit_date: permit_status == 'NOT_REQUIRED' ? "": permit_sent_date, permit_status, updated_at: converted_datetime(), created_at: converted_datetime()
            }, include: {lead: true}
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
                    project_ind: new_project_ind, job_id: new_job.job_id, 
                    attached, structure_type, description, end_cap_style, trim_color,cover_color, 
                    cover_size, contract_amount: Number(contract_amount.replace(/,/g,'')), contract_date, 
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
    const {contract_amount, contract_date, hoa_status, hoa_sent_date, hoa_approval_date ,engineering_submitted, engineering_received, permit_sent_date, permit_approved_date, lead_id, engineering_status, cover_size, cover_color, permit_status} = req.body
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
            where: {job_id},
            data: {
                lead: {connect: {lead_id: lead_id}},
                
                contract_amount: Number(contract_amount.replace(/,/g,'')), contract_date, cover_color, cover_size, engineering_received_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_received, engineering_status, engineering_submit_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_submitted, hoa_status: hoa_status, permit_approval_date: permit_status == 'NOT_REQUIRED' ? "": permit_approved_date, permit_submit_date: permit_status == 'NOT_REQUIRED' ? "": permit_sent_date, permit_status, updated_at: converted_datetime(), hoa_sent_date: hoa_sent_date || '', hoa_approval_date: hoa_approval_date || '',
            },include: {lead: {include: {assigned_to: true}}}
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

export const jobs = async(req: CustomRequest, res: Response)=>{
    try {
        
        const all_jobs = await prisma.job.findMany({
            include: {lead: true}, orderBy: {job_ind: 'desc'}
        })

        return res.status(200).json({nbHit: all_jobs.length, jobs: all_jobs})

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
            prisma.job.findMany({ include: {lead: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { job_ind: 'desc'  } }),

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
        console.log('Error occured while deleting job ', err);
        return res.status(500).json({err: 'Error occured while deleting job ', error: err})
    }
}