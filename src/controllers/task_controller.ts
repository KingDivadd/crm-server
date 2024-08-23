import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')


// -----------------------------TASKS

export const create_task = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {job_id, description, status, start_date, due_date, note, task_assigned_to} = req.body
    try {
        
        if (req.user.user_role !== 'operation'){ return res.status(401).json({err: `You're not authorized to create task.`}) }

        const [last_task, last_notification, job] = await Promise.all([
            prisma.task.findFirst({orderBy: {created_at: "desc"}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}}),
            prisma.job.findUnique({where: {job_id}, include: {lead: {include: { assigned_to:task_assigned_to}}}})
        ]) 

        const last_task_number = last_task ? parseInt(last_task.task_ind.slice(2)) : 0;
        const new_task_number = last_task_number + 1;
        const new_task_ind = `TS${new_task_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        
        const new_task = await prisma.task.create({
            data: {
                task_ind: new_task_ind, job: {connect: {job_id}}, 
                description, start_date, due_date, note, status, task_assigned_to: {connect: {user_id: task_assigned_to}},
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
        return res.status(500).json({err: 'Error occured while creating task. ', error: err})
    }
}

export const start_task = async(req: CustomRequest, res: Response, next: NextFunction)=>{

    try {
        

        const {task_id} = req.params

        const [task, last_notification] = await Promise.all([
            prisma.task.findUnique({where: {task_id}, }),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}})
        ]) 

        if (!task) { return res.status(500).json({err: 'Task not found'}) }

        if (task.status == 'IN_PROGRESS') {
            return res.status(200).json({msg: 'Task already in progress ', task: task})
        }
            

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;


        const update_task = await prisma.task.update({
            where: {task_id},
            data: {
                status: 'IN_PROGRESS',
                updated_at: converted_datetime()
            },
            include: {
                job: {
                    select: { 
                        job_ind: true, job_id: true,lead: {
                            select: {assigned_to: {select: {user_id: true, user_ind: true, first_name: true, last_name: true}}} 
                        }, 
                        customer: {select: {first_name: true, last_name: true, user_id: true}} 
                    }
                }
            }
        })

        if (update_task){
            await prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind,
                    subject: `Task with id ${update_task.task_ind} Updated.`,
                    message: `Task for customer ${update_task.job?.customer?.first_name} ${update_task.job?.customer?.last_name} is now in progress`,
                    user_id: update_task.job?.lead?.assigned_to?.user_id,
                    source_id: req.user.user_id,
                    created_at: converted_datetime(),
                    updated_at: converted_datetime()
                }
            })
        }

        return res.status(201).json({msg: 'Task now in progress ', task: update_task })

        
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
                job_id, description, start_date, due_date, note, status, task_assigned_to: {connect: {user_id: assigned_to}},
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

// for this we are to update the job and task
export const task_progress_update = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {
        job_id, note, engineering_permit_number, engineering_permit_submit_date, engineering_permit_approval_date, engineering_permit_documents,
        electrical_permit_number, electrical_permit_submit_date, electrical_permit_approval_date, electrical_permit_documents,
        general_permit_number, general_permit_submit_date, general_permit_approval_date, general_permit_documents,
        hoa_permit_number, hoa_permit_submit_date, hoa_permit_approval_date, hoa_permit_documents,
        
    } = req.body

    try {
        
        const {task_id} = req.params

        const [job, task, last_notification] = await Promise.all([
            prisma.job.findUnique({
                where: {job_id},
                include: {lead: {include: {assigned_to: true}} }
             }),
            prisma.task.findUnique({where: {task_id} }),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}})
        ]) 

        if(!job){ return res.status(404).json({err: 'Job for the task not found'}) }

        if (!task) { return res.status(404).json({err: 'Task not found'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const engineering_status = (engineering_permit_submit_date && engineering_permit_approval_date && engineering_permit_documents) ? 'APPROVED' : (engineering_permit_submit_date && engineering_permit_approval_date || engineering_permit_submit_date ) ? "SUBMITTED" : 'PENDING'

        const general_status = (general_permit_submit_date && general_permit_approval_date && general_permit_documents) ? 'APPROVED' : (general_permit_submit_date && general_permit_approval_date || general_permit_submit_date ) ? "SUBMITTED" : 'PENDING'

        const hoa_status = (hoa_permit_submit_date && hoa_permit_approval_date && hoa_permit_documents) ? 'APPROVED' : (hoa_permit_submit_date && hoa_permit_approval_date || hoa_permit_submit_date ) ? "SUBMITTED" : 'PENDING'

        const electrical_status = (electrical_permit_submit_date && electrical_permit_approval_date && electrical_permit_documents) ? 'APPROVED' : (electrical_permit_submit_date && electrical_permit_approval_date || electrical_permit_submit_date ) ? "SUBMITTED" : 'PENDING'

        const task_status = engineering_permit_submit_date ? engineering_status: electrical_permit_submit_date ? electrical_status : general_permit_submit_date ? general_status : hoa_permit_submit_date ? hoa_status : 'IN_PROGRESS'

        const completion_date = (engineering_status == 'APPROVED' || electrical_status == 'APPROVED' || general_status == 'APPROVED' || task_status == 'APPROVED' ) ? String(Date.now()) : ''


        const [update_task, update_job] = await Promise.all([
            prisma.task.update({
                where: {task_id},
                data: {
                    status: task_status == 'APPROVED' ? 'COMPLETED' : task_status == 'SUBMITTED' ? 'IN_PROGRESS': 'PENDING' ,
                    completion_date: completion_date, note,
                    updated_at: converted_datetime()
                },
            }),
            prisma.job.update({
                where: {job_id},
                data: {
                    engineering_permit_status: engineering_status, electrical_permit_status: electrical_status, hoa_permit_status: hoa_status, 
                    general_permit_status: general_status,
                    engineering_permit_number, engineering_permit_submit_date, engineering_permit_approval_date, engineering_permit_documents,
                    electrical_permit_number, electrical_permit_submit_date, electrical_permit_approval_date, electrical_permit_documents,
                    general_permit_number, general_permit_submit_date, general_permit_approval_date, general_permit_documents,
                    hoa_permit_number, hoa_permit_submit_date, hoa_permit_approval_date, hoa_permit_documents,
                    updated_at: converted_datetime()
                },
                include: {lead: {include: {assigned_to: true}}}
            })
        ]) 

        if (update_task && update_job){
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
            prisma.task.findMany({ include: {job: true, created_by: true, task_assigned_to: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

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