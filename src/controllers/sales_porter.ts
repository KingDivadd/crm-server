import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email } from '../helpers/email'


export const sales_main_dashboard = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user_id = req.user.user_id
        const user_role = req.user.user_role

        if (req.user.user_role !== 'sales'){ return res.status(401).json({err: 'Dashboard information only meant for sales personnel ' })}

        const [total_lead, converted_lead, total_job, total_task, recent_lead, recent_tasks, recent_notifications] = await Promise.all([
            prisma.lead.count({}),
            prisma.lead.count({where: {disposition: 'SOLD'}}),
            prisma.job.count({}),
            prisma.task.count({}),
            
            prisma.lead.findMany({include: {assigned_to: true }, take: 15, orderBy: {created_at: 'desc'}}),
            prisma.task.findMany({include: {job: {select: {job_ind: true}}}, take: 15, orderBy: {created_at: 'desc'}}),
            prisma.notification.findMany({where: {
                OR: [
                    { user_id: user_id }, // User can see their notifications
                    { 
                        user: { user_role: { not: 'customer' } }, // Admin can see all notifications except customers
                        AND: user_role === 'admin' ? {} : { user_id: user_id }
                    }
                ]
            } ,include: {source: true, user: true , lead: true, job: true, task: true}, take: 15, orderBy: {created_at: 'desc'} })

        ])
        

        return res.status(200).json({total_lead, converted_lead, total_job, total_task, recent_lead, recent_tasks, recent_notifications })
        
    } catch (err:any) {
        console.log('Error occured while fetching sales dashboard information : ', err);
        return res.status(500).json({err: 'Error occured while fetching sales dashboard information ', error: err})
    }
}


export const sales_pipeline_page = async(req: CustomRequest, res: Response)=>{
    try {
        
        const {page_number} = req.params

        const [total_lead, total_lead_sold, contract_amounts, total_lead_in_progress, number_of_pipelines, pipeline] = await Promise.all([
            prisma.lead.count({}),

            prisma.lead.count({where: {disposition: 'SOLD'}}),

            prisma.job.findMany({select: {contract_amount: true}}),

            prisma.lead.count({ where: {disposition: 'IN_PROGRESS' }}),

            prisma.sales_Pipeline.count({}),

            prisma.sales_Pipeline.findMany({ include: {lead: {include: {assigned_to: true}}, job: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_pipeline_pages = (number_of_pipelines <= 15) ? 1 : Math.ceil(number_of_pipelines / 15)

        let revenue_generated;

        if (contract_amounts.length) {
            
            revenue_generated = contract_amounts.reduce((accumulator, currentValue) => accumulator + currentValue.contract_amount, 0);
            
        }        

        return res.status(200).json({
            msg: 'All Sales Pipeline ', 
            total_lead, total_lead_sold, total_contract_amount:revenue_generated, total_lead_in_progress,
            total_number_of_pipeline: number_of_pipelines,
            total_number_of_pipeline_pages: number_of_pipeline_pages,
            pipeline: pipeline,
        })

    } catch (err:any) {
        console.log('Error fetching all sales pipeline ', err);
        return res.status(500).json({err: 'Error fetching all sales pipeline ', error: err})
    }
}