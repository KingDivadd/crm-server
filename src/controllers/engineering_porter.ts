import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_engineering_drawing_uploaded_email } from '../helpers/email'


export const main_engineering_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        

    } catch (err:any) {
        console.log(`Error occured while fetching engineering dashboard `,err);
        return res.status(500).json({err:`Error occured while fetching engineering dashboard `,error:err});
    }
}

export const create_rfi = async(req: CustomRequest, res: Response)=>{
    try {

        const user = req.user

        const [selected_user, project_exist, last_rfi, last_tracking, last_notification] = await Promise.all([
            prisma.user.findFirst({
                where: {user_id: req.body.rfi_assignee_id}, 
                select: {user_ind: true, user_id: true, first_name: true, last_name: true, user_role: true}
            }),
            prisma.project.findFirst({ where: {project_id: req.body.project_id}, select: {project_id: true} }),
            prisma.rFI.findFirst({ orderBy: {created_at: 'desc'}, select: {rfi_ind: true, rfi_id: true} }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}, select: {notification_ind: true} })
        ])

        if (!selected_user) { return res.status(404).json({err: 'Selected user not found, check id and try again'}) }

        if (!project_exist) { return res.status(404).json({err: 'Selected project not found, check id and try again'}) }
        
        const last_rfi_number = last_rfi ? parseInt(last_rfi.rfi_ind.slice(2)) : 0;
        const new_rfi_number = last_rfi_number + 1;
        const new_rfi_ind = `RF${new_rfi_number.toString().padStart(4, '0')}`;
        
        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const new_rfi = await prisma.rFI.create({
            data:{
                rfi_assigner_id: user.user_id,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }, include: {
                rfi_assignee: {select: {user_id: true}}
            }
        })

        const [new_tracking, new_notification] = await Promise.all([
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'rfi_modification',
                    action_details: {
                        rfi_id: new_rfi.rfi_id, time: new_rfi.created_at, modification_type: 'added'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'New RFI Created', rfi_id: new_rfi.rfi_id,

                    message: `${user.first_name} ${user.last_name} created a new RFI with Id ${new_rfi.rfi_ind} and assigned it to  ${selected_user.first_name} ${selected_user.last_name} (${selected_user.user_role}). `,

                    view_by_admin: true, notification_type: 'rfi',

                    notification_source_id: user.user_id, notification_to_id: new_rfi.rfi_assignee?.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ]) 

        return res.status(201).json({
            msg: 'RFI Created',
            rfi: new_rfi
        })

    } catch (err:any) {
        console.log(`Error occured while fetching creating rfi `,err);
        return res.status(500).json({err:`Error occured while fetching creating rfi`,error:err});
    }
}

export const edit_rfi = async(req: CustomRequest, res: Response)=>{
    try {

        const user = req.user

        const {rfi_id} = req.params

        const [selected_user, project_exist, rfi_exist, last_tracking, last_notification] = await Promise.all([
            prisma.user.findFirst({
                where: {user_id: req.body.rfi_assignee_id}, 
                select: {user_ind: true, user_id: true, first_name: true, last_name: true, user_role: true}
            }),
            prisma.project.findFirst({ where: {project_id: req.body.project_id}, select: {project_id: true} }),
            prisma.rFI.findFirst({where: {rfi_id}, select: {rfi_ind: true}}),
            
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}, select: {notification_ind: true} })
        ])

        if (!selected_user) { return res.status(404).json({err: 'Selected user not found, check id and try again'}) }
        
        if (!project_exist) { return res.status(404).json({err: 'Selected project not found, check id and try again'}) }

        if (!rfi_exist) { return res.status(404).json({err: 'Selected RFI not found, check id and try again'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const update_rfi = await prisma.rFI.update({
            where: {rfi_id},
            data:{
                ...req.body,
                updated_at: converted_datetime()
            }, include: {
                rfi_assignee: {select: {user_id: true, user_role: true}},
                rfi_assigner: {select: {user_id: true, user_role: true}},
            }
        })

        const notifiction_to = update_rfi.rfi_assignee?.user_id == user.user_id ? update_rfi.rfi_assigner?.user_id : update_rfi.rfi_assignee?.user_id

        const subject = update_rfi.status == 'in_progress' ? "RFI Updated" : "RFI Closed"

        if (update_rfi && update_rfi.status !== 'open') {


            const [new_tracking, new_notification] = await Promise.all([
                prisma.user_Tracking.create({
                    data: {
                        tracking_ind: new_tracking_ind,
                        user: {connect: {user_id: req.user.user_id}},
                        action_type: 'rfi_modification',
                        action_details: {
                            rfi_id: rfi_id, time: update_rfi.updated_at, modification_type: 'update'
                        },
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                }),
                
                prisma.notification.create({
                    data: {
                        notification_ind: new_notification_ind, subject: subject , rfi_id: rfi_id,
    
                        message: `${user.first_name} ${user.last_name} has updated the assigned RFI with Id ${update_rfi.rfi_ind}. `,
    
                        view_by_admin: update_rfi.rfi_assignee?.user_role == 'admin' ? true: false, notification_type: 'rfi',
    
                        notification_source_id: user.user_id, notification_to_id: notifiction_to,
    
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                })
            ]) 
            
        }


        return res.status(201).json({
            msg: subject,
            rfi: update_rfi
        })

    } catch (err:any) {
        console.log(`Error occured while edit rfi `,err);
        return res.status(500).json({err:`Error occured while edit rfi `,error:err});
    }
}

export const close_rfi = async(req: CustomRequest, res: Response)=>{
    try {

        const user = req.user

        const {rfi_id} = req.params

        const [rfi_exist, last_tracking, last_notification] = await Promise.all([
            prisma.rFI.findFirst({
                where: {rfi_id},
                select: {
                    rfi_ind: true,
                    rfi_assignee: {select: {user_id: true, first_name: true, last_name: true, }}
                }
                
            }),
            
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}, select: {notification_ind: true} })
        ])

        if (!rfi_exist) { return res.status(404).json({err: 'Selected RFI not found, check id and try again'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const [cls_rfi, new_tracing, new_notification] = await Promise.all([
            prisma.rFI.update({
                where: {rfi_id},
                data:{
                    status: 'closed',
                    updated_at: converted_datetime()
                }
                
            }),

            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'rfi_modification',
                    action_details: {
                        rfi_id: rfi_id, time: converted_datetime() , modification_type: 'close'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: "RFI Closed" , rfi_id: rfi_id,

                    message: `${user.first_name} ${user.last_name} has closed the RFI with Id ${rfi_exist.rfi_ind}. `,

                    view_by_admin: false, notification_type: 'rfi',

                    notification_source_id: user.user_id, notification_to_id: rfi_exist.rfi_assignee.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })

        ]) 


        return res.status(201).json({
            msg: 'RFI Closed',
            rfi: cls_rfi
        })

    } catch (err:any) {
        console.log(`Error occured while closing rfi `,err);
        return res.status(500).json({err:`Error occured while closing rfi `,error:err});
    }
}


export const all_paginated_task = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {

        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_tasks, tasks ] = await Promise.all([

            prisma.task.count({}),

            prisma.task.findMany({
                include: {
                    job: {
                        include: {
                            project: {
                                take: 1
                            },
                            job_adder: {
                                select: {last_name: true, first_name: true, user_ind: true}
                            },
                            lead: {
                                select: {
                                    lead_ind: true, customer_first_name: true, customer_last_name: true, 
                                    customer_address: true, customer_email: true, customer_phone: true,
                                }
                            }
                        }
                    }
                },

                    skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
                }),

        ])
        
        const number_of_task_pages = (number_of_tasks <= 15) ? 1 : Math.ceil(number_of_tasks / 15)
        
        return res.status(200).json({ total_number_of_tasks: number_of_tasks, total_number_of_pages: number_of_task_pages, tasks })


    } catch (err: any) {
        console.error('Error creating tasks for jobs: ', err);
        return res.status(500).json({ err: 'Error creating tasks for jobs ', error: err });
    }
};

export const upload_engineering_drawing = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {job_id, comments, engineering_drawing_upload}  = req.body
    try {

        const {task_id}  = req.params

        const [task_exist, job_exist] = await Promise.all([
            prisma.task.findFirst({ where: {task_id }}),
            prisma.job.findFirst({ 
                where: {job_id }, 

                include: {
                    project: {take: 1},
                    lead: {
                        select: {customer_email: true, customer_first_name: true, customer_last_name: true}
                    }
                } 
            })

        ])  

        if (!task_exist) { return res.status(404).json({err: 'Invalid task id'}) }

        if (!job_exist) { return res.status(404).json({err: 'Invalid job id'}) }


        const [update_task, update_project] = await Promise.all([
            prisma.task.update({
                where: {task_id: task_exist.task_id},
                data: {
                    comments: comments,
                    updated_at: converted_datetime()
                }
            }),

            prisma.project.update({
                where: {project_id: job_exist?.project[0].project_id},
                data: {
                    engineering_drawing_upload,
                    updated_at: converted_datetime()
                }
            })
        ])

        if (!update_task || !update_project) {
            return res.status(400).json({err: 'Engineering upload failded'})
        }

        const customer_info = {
            first_name: job_exist.lead.customer_first_name, 
            last_name: job_exist.lead.customer_last_name,  
            email: job_exist.lead.customer_email,  
        }

        send_engineering_drawing_uploaded_email(customer_info)

        return res.status(200).json({
            msg: 'Engineering Drawing Uploaded Successfully',
            task: update_task,
            project: update_project
        })


        
    } catch (err:any) {
        console.log('Error upload job engineering drawing ', err);
        return res.status(500).json({err:'Error upload job engineering drawing ', error:err});
    }
}