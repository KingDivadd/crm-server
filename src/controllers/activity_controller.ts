import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import generate_otp from '../helpers/generate_otp'
import {otp_messanger, welcome_mail_messanger} from '../helpers/email'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const all_activity = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_activities, activities] = await Promise.all([

            prisma.activity.count({}),
            prisma.activity.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_activity_pages = (number_of_activities <= 10) ? 1 : Math.ceil(number_of_activities / 10)

        return res.status(200).json({
            msg: 'All Activity ', 
            total_number_of_recent_activities: number_of_activities,
            total_number_of_recent_activities_pages: number_of_activity_pages,
            activities: activities,
         })

        
    } catch (err:any) {
        console.log('Error occured fetching all activity. ',err);
        return res.status(500).json({err: 'Error occured while fetching all activity ', error : err})
    }
}