import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const all_task_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_notification, notification] = await Promise.all([

            prisma.task_Notification.count({}),
            prisma.task_Notification.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_notification_pages = (number_of_notification <= 10) ? 1 : Math.ceil(number_of_notification / 10)

        return res.status(200).json({
            msg: 'All Task Notification ', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notifications: notification,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all task notification ',err);
        return res.status(500).json({err: 'Error occured while fetching all task notification', error: err})
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

        const [number_of_notification, notification] = await Promise.all([

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
            notifications: notification,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all task notification ',err);
        return res.status(500).json({err: 'Error occured while fetching all task notification', error: err})
    }
}

export const update_notification = async(req: CustomRequest, res: Response)=>{
    try {

        const {notification_id} = req.params

        const change_status = await prisma.notification.update({
            where: {notification_id},
            data: {
                read: true,
                updated_at: converted_datetime()
            }
        })

        if (!change_status){
            return res.status(400).json({err: 'Unable to update notification.'})
        }

        return res.status(200).json({msg: 'Notification updated successfully', })
        
    } catch (err:any) {
        console.log('Error while updating notification status ', err);
        return res.status(500).json({err: 'Error while updating notification status ', error:err});
        
    }
}

export const all_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_notification, notification] = await Promise.all([

            prisma.notification.count({}),

            prisma.notification.findMany({
                include: {
                    source: true, user: true, lead: true, job: true, task: true, 
                }, skip: (
                    Math.abs(Number(page_number)) - 1
                ) * 10, 
                take: 15, 
                orderBy: { created_at: 'desc'  } 
            }),

        ])

        const number_of_notification_pages = (number_of_notification <= 10) ? 1 : Math.ceil(number_of_notification / 10)

        return res.status(200).json({
            msg: 'All Notification ', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notification: notification,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all task notification ',err);
        return res.status(500).json({err: 'Error occured while fetching all task notification', error: err})
    }
}