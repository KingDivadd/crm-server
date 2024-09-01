import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const main_permit_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        

    } catch (err:any) {
        console.log(`Error occured while fetching permit dashboard `,err);
        return res.status(500).json({err:`Error occured while fetching permit dashboard `,error:err});
    }
}


export const create_new_redline = async(req: CustomRequest, res: Response)=>{
    try {
        
        const [last_redLine, last_notification, last_tracking, user_exist] = await Promise.all([
            prisma.redLine.findFirst({orderBy: {created_at: 'desc'}, select: {redLine_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.user.findFirst({
                where: {user_id: req.body.red_line_assignee_id},
                orderBy: {created_at: 'desc'}, select: {user_ind: true}
            }),
        ])

        if (!user_exist) { return res.status(404).json({err: 'Selected user not found'}) }

        const last_redLine_number = last_redLine ? parseInt(last_redLine.redLine_ind.slice(2)) : 0;
        const new_redLine_number = last_redLine_number + 1;
        const new_redLine_ind = `RL${new_redLine_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

    } catch (err:any) {
        console.log(`Error occured while creating new red line `,err);
        return res.status(500).json({err:`Error occured while creating new red line `,error:err});
        
    }
}