import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')


// -----------------------------TASKS

export const create_task = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {job_id, description, status, start_date, due_date, note, assigned_to} = req.body
    try {
        
        if (req.user.user_role !== 'operation'){ return res.status(401).json({err: `You're not authorized to create task.`}) }

        const [last_task, last_notification, job] = await Promise.all([
            prisma.task.findFirst({orderBy: {created_at: "desc"}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}}),
            prisma.job.findUnique({where: {job_id}, include: {lead: {include: {assigned_to}}}})
        ]) 

        const last_task_number = last_task ? parseInt(last_task.task_ind.slice(2)) : 0;
        const new_task_number = last_task_number + 1;
        const new_task_ind = `TS${new_task_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        
        const new_task = await prisma.task.create({
            data: {
                task_ind: new_task_ind, job_id, description, start_date, due_date, note, status, assigned_to,
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        if (new_task){
            await prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    subject: `New Task Created.`,
                    message: `A task for ${job?.lead?.assigned_to?.first_name} ${job?.lead?.assigned_to?.last_name}'s project has been created`,
                    user_id: job?.lead?.assigned_to_id,
                    source_id: req.user.user_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })
        }

        return res.status(201).json({msg: 'Task created successfully ', task: new_task })
        
    } catch (err:any) {
        console.log('Error occured while creating task ', err);
        return res.status(500).json({err: 'Error occured while creating task ', error: err})
    }
}

export const edit_task = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {job_id, description, status, start_date, due_date, note, assigned_to} = req.body

    try {
        
        if (req.user.user_role !== 'operation'){ return res.status(401).json({err: `You're not authorized to perform this function.`}) }

        const {task_id} = req.params

        const [job, last_notification] = await Promise.all([
            prisma.job.findUnique({where: {job_id}, include: {lead: {include: {assigned_to: true}}}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}})
        ]) 

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;


        const update_task = await prisma.task.update({
            where: {task_id},
            data: {
                job_id, description, start_date, due_date, note, status, assigned_to,
                updated_at: converted_datetime()
            }
        })

        if (update_task){
            await prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    subject: `Task with id ${update_task.task_ind} Updated.`,
                    message: `Task for ${job?.lead?.assigned_to?.first_name} ${job?.lead?.assigned_to?.last_name}'s project has been updated`,
                    user_id: job?.lead?.assigned_to_id,
                    source_id: req.user.user_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })
        }

        return res.status(201).json({msg: 'Task created successfully ', task: update_task })

        
    } catch (err:any) {
        console.log('Error occured while creating task ', err);
        return res.status(500).json({err: 'Error occured while creating task ', error: err})
    }
}

export const all_tasks = async(req: CustomRequest, res: Response)=>{
    try {
        
        const {page_number} = req.params

        const [number_of_tasks, tasks] = await Promise.all([

            prisma.task.count({}),
            prisma.task.findMany({ include: {job: true, created_by: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_tasks_pages = (number_of_tasks <= 15) ? 1 : Math.ceil(number_of_tasks / 15)

        return res.status(200).json({
            msg: 'All Tasks ', 
            total_number_of_tasks: number_of_tasks,
            total_number_of_tasks_pages: number_of_tasks_pages,
            tasks: tasks,
        })

    } catch (err:any) {
        console.log('Error fetching all leads ', err);
        return res.status(500).json({err: 'Error fetching all lead ', error: err})
    }
}