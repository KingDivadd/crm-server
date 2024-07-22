import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'


export const all_task_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_notification, notificaion] = await Promise.all([

            prisma.task_Notification.count({}),
            prisma.task_Notification.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_notification_pages = (number_of_notification <= 10) ? 1 : Math.ceil(number_of_notification / 10)

        return res.status(200).json({
            msg: 'All Task Notification ', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notificaions: notificaion,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all task notification ',err);
        return res.status(500).json({err: 'Error occured while fetching all task notificaion', error: err})
    }
}

export const filter_task_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number, status} = req.params

        if (!status){
            return res.status(400).json({err:'Task notification status is required'})
        }

        if (!['pending', 'in_progress', 'completed', 'overdue'].includes(status)) {
            return res.status(400).json({err: ' Invalid status entered. valid entries [pending, in_progress, completed, overdue] '})
        }

        const [number_of_notification, notificaion] = await Promise.all([

            prisma.task_Notification.count({ where: {task_notification_status: status.toUpperCase() } }),
            prisma.task_Notification.findMany({ 
                where: {task_notification_status: status.toUpperCase()} , 
                skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } 
            }),

        ])

        const number_of_notification_pages = (number_of_notification <= 10) ? 1 : Math.ceil(number_of_notification / 10)

        return res.status(200).json({
            msg: 'All Filtered Task Notification ', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notificaions: notificaion,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all task notification ',err);
        return res.status(500).json({err: 'Error occured while fetching all task notificaion', error: err})
    }
}

export const all_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_notification, notificaion] = await Promise.all([

            prisma.notification.count({}),
            prisma.notification.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_notification_pages = (number_of_notification <= 10) ? 1 : Math.ceil(number_of_notification / 10)

        return res.status(200).json({
            msg: 'All Notification ', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notificaions: notificaion,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all task notification ',err);
        return res.status(500).json({err: 'Error occured while fetching all task notificaion', error: err})
    }
}