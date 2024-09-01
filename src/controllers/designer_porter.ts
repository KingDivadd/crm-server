import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'

export const main_designer_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        
    } catch (err:any) {
        console.log(`Error occured while fetching designer dashboard `,err);
        return res.status(500).json({err:`Error occured while fetching designer dashboard `,error:err});
    }
}

export const create_task_notification = async(req: CustomRequest, res: Response)=>{
    try {
        
    } catch (err:any) {
        console.log(`Error occured while creating task notification `,err);
        return res.status(500).json({err:`Error occured while creating task notification `,error:err});
    }
}