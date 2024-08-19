import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'

export const customer_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id || null

        if (user_id == null) { return res.status(400).json({err: 'Invalid xidkey sent'}) }
            
        const [projects,  running_project, notifications] = await Promise.all([
            prisma.project.findMany({}),
            prisma.project.findMany({include: {job: {select: {job_ind: true}}}, take: 15 }),
            prisma.notification.findMany({ take: 15 }),
        ])

        const total_project = projects.length
        const completed_project = projects.filter((data: any, ind: any) => data.status === 'COMPLETED').length
        const project_in_progress = projects.filter((data: any, ind: any) => data.status === 'IN_PROGRESS').length;
        const pending_project = projects.filter((data: any, ind: any) => data.status === 'PENDING').length;
        

        return res.status(200).json({msg: "Customer Dashboard Info", total_project, completed_project, project_in_progress, pending_project, running_project, notifications })

    } catch (err:any) {
        console.log('Error occured while fetching customer dashboard info', err);
        return res.status(500).json({err:'Error occured while fetching customer dashboard info', error: err});
    }
}