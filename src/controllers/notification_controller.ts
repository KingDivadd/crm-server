import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const all_task_notification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_notification, notification] = await Promise.all([

            prisma.task_Notification.count({}),
            prisma.task_Notification.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_notification_pages = (number_of_notification <= 15) ? 1 : Math.ceil(number_of_notification / 15)

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
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])

        const number_of_notification_pages = (number_of_notification <= 15) ? 1 : Math.ceil(number_of_notification / 15)

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

        const user_id = req.user.user_id

        const {notification_id} = req.params

        const notification = await prisma.notification.findFirst({ where: {notification_id} })

        if (!notification) {
            return res.status(404).json({err: 'Notification not found'})
        }
        let readBy: string[] = Array.isArray(notification.read_by) ? notification.read_by as string[] : [];

        if (!readBy.includes(user_id)) {
            readBy.push(user_id);
        }

        // Update the notification with the new read_by array and read status
        const change_status = await prisma.notification.update({
            where: { notification_id },
            data: {
                read: true,  // Update the general read status if needed
                read_by: JSON.stringify(readBy),  // Save the updated read_by array
                updated_at: converted_datetime()  // Update the timestamp
            }
        });

        if (!change_status) {
            return res.status(400).json({ err: 'Unable to update notification.' });
        }

        return res.status(200).json({ msg: 'Notification updated successfully' });

    } catch (err: any) {
        console.log('Error while updating notification status', err);
        return res.status(500).json({ err: 'Error while updating notification status', error: err });
    }
};

export const all_notification = async(req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user.user_id;
        const user_role = req.user.user_role; // Assuming user_role is part of the user object
        const {page_number} = req.params;

        const [number_of_notification, notification] = await Promise.all([

            prisma.notification.count({
                where: {
                    OR: [
                        { user_id: user_id }, // User can see their notifications
                        { 
                            user: { user_role: { not: 'customer' } }, // Admin can see all notifications except customers
                            AND: user_role === 'admin' ? {} : { user_id: user_id }
                        }
                    ]
                }
            }),

            prisma.notification.findMany({
                where: {
                    OR: [
                        { user_id: user_id }, // User can see their notifications
                        { 
                            user: { user_role: { not: 'customer' } }, // Admin can see all notifications except customers
                            AND: user_role === 'admin' ? {} : { user_id: user_id }
                        }
                    ]
                },
                include: {
                    source: {select: {first_name: true, last_name: true, user_ind: true,}}, 
                    user: {select: {first_name: true, last_name: true, user_ind: true,}}, 
                
                },
                skip: (Math.abs(Number(page_number)) - 1) * 15,
                take: 15,
                orderBy: { created_at: 'desc' }
            }),

        ]);

        const number_of_notification_pages = (number_of_notification <= 15) ? 1 : Math.ceil(number_of_notification / 15);

        return res.status(200).json({
            msg: 'All Notifications', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notification: notification,
        });

    } catch (err: any) {
        console.log('Error occurred while fetching all task notifications ', err);
        return res.status(500).json({ err: 'Error occurred while fetching all task notifications', error: err });
    }
}
