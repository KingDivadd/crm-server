import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email } from '../helpers/email'


export const sales_main_dashboard = async(req: CustomRequest, res: Response, next: NextFunction)=>{
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