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



export const all_paginated_job_permits = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_jobs, jobs ] = await Promise.all([

            prisma.job.count({ }),

            prisma.job.findMany({
                include: {project: true},
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc' } 
            }),

        ])
        
        const number_of_jobs_pages = (number_of_jobs <= 15) ? 1 : Math.ceil(number_of_jobs / 15)

        return res.status(200).json({ total_number_of_jobs: number_of_jobs, total_number_of_pages: number_of_jobs_pages, jobs })

    } catch (err:any) {
        console.log('Error occured fetching all job / project permits ', err);
        return res.status(500).json({err:'Error occured fetching all job / project permits', error:err});
    }
}


export const create_new_redline = async(req: CustomRequest, res: Response)=>{

    try {

        const user = req.user

        const [last_redLine, last_notification, last_tracking, user_exist, project_exist] = await Promise.all([
            prisma.redLine.findFirst({orderBy: {created_at: 'desc'}, select: {redLine_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.user.findFirst({
                where: {user_id: req.body.red_line_assignee_id},
                orderBy: {created_at: 'desc'}, select: {user_ind: true}
            }),
            prisma.project.findFirst({where:{project_id: req.body.project_id}, select: {project_ind: true}})
        ])

        if (!user_exist) { return res.status(404).json({err: 'Selected user not found, check Id and try again!'}) }

        if (!project_exist) { return res.status(404).json({err: 'Selected project not found, check Id and try again!'}) }

        const last_redLine_number = last_redLine ? parseInt(last_redLine.redLine_ind.slice(2)) : 0;
        const new_redLine_number = last_redLine_number + 1;
        const new_redLine_ind = `RL${new_redLine_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const new_redLine = await prisma.redLine.create({
            data: {
                redLine_ind: new_redLine_ind, redLine_assigner_id: req.user.user_id,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        const [new_tracking, new_notification] = await Promise.all([
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'redLine_modification',
                    action_details: {
                        redLine_id: new_redLine.redLine_id, time: new_redLine.created_at , modification_type: 'added'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: "Red Line Created" , redLine_id: new_redLine.redLine_id,

                    message: `${user.first_name} ${user.last_name} has created a new red line regarding project with Id ${project_exist.project_ind}. `,

                    view_by_admin: true, notification_type: 'redLine',

                    notification_source_id: user.user_id, notification_to_id: req.body.redLine_assignee_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(201).json({
            msg: 'New redline created',
            redLine: new_redLine
        })

    } catch (err:any) {
        console.log(`Error occured while creating new red line `,err);
        return res.status(500).json({err:`Error occured while creating new red line `,error:err});
        
    }
}

export const edit_redline = async(req: CustomRequest, res: Response)=>{

    const {status, description, project_id, redLine_assignee_id} = req.body

    try {

        const user = req.user

        const {redline_id} = req.params

        const [redLine_exist, last_notification, last_tracking, user_exist, project_exist] = await Promise.all([
            prisma.redLine.findFirst({ where: {redLine_id: redline_id}, select: {redLine_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.user.findFirst({
                where: {user_id: req.body.red_line_assignee_id},
                orderBy: {created_at: 'desc'}, select: {user_ind: true}
            }),
            prisma.project.findFirst({where: {project_id}, select: {project_ind: true}})
        ])

        if (!redLine_exist) { return res.status(404).json({err: 'Redline not found, check id and try again '}) }

        if (!user_exist) { return res.status(404).json({err: 'Selected user not found'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const update_redLine = await prisma.redLine.update({
            where: {redLine_id: redline_id},
            data: {
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            },
            include: {
                redLine_assigner: {select: {user_id: true}},
                redLine_assignee: {select: {user_id: true}},
            }
        })


        if (update_redLine && update_redLine.status !== 'pending') {
            
            const [new_tracking, new_notification] = await Promise.all([
                prisma.user_Tracking.create({
                    data: {
                        tracking_ind: new_tracking_ind,
                        user: {connect: {user_id: req.user.user_id}},
                        action_type: 'redLine_modification',
                        action_details: {
                            redLine_id: redline_id, time: update_redLine.created_at , modification_type: update_redLine.status
                        },
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                }),
                
                prisma.notification.create({
                    data: {
                        notification_ind: new_notification_ind, 
                        subject: update_redLine.status === "approved" ? "Red Line Approved" : "Red Line Rejected" , redLine_id: redline_id,
    
                        message: `${user.first_name} ${user.last_name} has ${update_redLine.status} the red line with Id ${update_redLine.redLine_ind} regarding project of Id ${project_exist?.project_ind}. `,
    
                        view_by_admin: true, notification_type: 'redLine',
    
                        notification_source_id: user.user_id, notification_to_id: update_redLine.redLine_assigner.user_id,
    
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                })
            ])

            
            return res.status(201).json({
                msg: update_redLine.status === "approved" ? "Red Line Approved" : "Red Line Rejected",
                redLine: update_redLine
            })
        }

        const [new_tracking, new_notification] = await Promise.all([
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'redLine_modification',
                    action_details: {
                        redLine_id: redline_id, time: update_redLine.created_at , modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, 
                    subject: "Red Line Updated" , redLine_id: redline_id,

                    message: `${user.first_name} ${user.last_name} has updated the redline with Id ${update_redLine.redLine_ind} regarding project  ${project_exist?.project_ind}. `,

                    view_by_admin: true, notification_type: 'redLine',

                    notification_source_id: user.user_id, notification_to_id: update_redLine.redLine_assignee.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])



        return res.status(201).json({
            msg: 'Red Line Updated',
            redLine: update_redLine
        })

    } catch (err:any) {
        console.log(`Error occured while updating redline `,err);
        return res.status(500).json({err:`Error occured while updating redline `,error:err});
        
    }
}


export const all_paginated_inspection = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_inspections, inspections ] = await Promise.all([

            prisma.inspection.count({ }),

            prisma.inspection.findMany({
                include: {install: true},
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc' } 
            }),

        ])
        
        const number_of_inspections_pages = (number_of_inspections <= 15) ? 1 : Math.ceil(number_of_inspections / 15)

        return res.status(200).json({ 
            total_number_of_inspections: number_of_inspections, 
            total_number_of_pages: number_of_inspections_pages, 
            inspections    
        })

    } catch (err:any) {
        console.log('Error occured fetching all install inspections ', err);
        return res.status(500).json({err:'Error occured fetching all install inspections', error:err});
    }
}

export const add_inspection = async(req: CustomRequest, res: Response)=>{

    const {inspection_date, inspection_document, inspection_status} = req.body

    try {
        const {install_id} = req.params

        const [install_exist, last_tracking, last_notification, last_inspection] = await Promise.all([
            prisma.install.findFirst({where: {install_id}, select: {install_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
            prisma.inspection.findFirst({orderBy :{created_at: 'desc'}, select: {inspection_ind: true, inspection_id: true}})
        ])

        if (!install_exist) { return res.status(404).json({err: 'Install not found'})}

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const last_inspection_number = last_inspection ? parseInt(last_inspection.inspection_ind.slice(2)) : 0;
        const new_inspection_number = last_inspection_number + 1;
        const new_inspectiong_ind = `IP${new_inspection_number.toString().padStart(4, '0')}`;

        req.body.inspector_id = req.user.user_id
        req.body.install_id = install_id

        const new_inspection = await prisma.inspection.create({
            data: {
                inspection_ind: new_inspection_number,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        const [ new_tracker, new_notification] = await Promise.all([

            
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'inspection_modification',
                    action_details: {
                        inspection_id: new_inspection.inspection_id, time: converted_datetime(), modification_type: 'create'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'New Inspection Created', inspection_id: new_inspection.inspection_id,

                    message: `Inspection for installation with Id ${install_exist?.install_ind} has been carried out successfully.`,

                    view_by_admin: true, notification_type: 'inspection', viewable_role: [],

                    notification_source_id: req.user.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(200).json({
            msg: 'Inspection created successfully',
            inspection: new_inspection
        })

    } catch (err:any) {
        console.log('Error editing project', err);
        return res.status(500).json({err:'Error editing project', error:err});
    }
}

export const edit_inspection = async(req: CustomRequest, res: Response)=>{

    const {inspection_date, inspection_document, inspection_status} = req.body

    try {
        const {inspection_id} = req.params

        const [inspection_exist, last_tracking, last_notification] = await Promise.all([
            prisma.inspection.findFirst({where: {inspection_id}, select: {inspection_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
        ])

        if (!inspection_exist) { return res.status(404).json({err: 'Inspection not found'})}

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        req.body.inspector_id = req.user.user_id

        const [ update_inspection, new_tracker, new_notification] = await Promise.all([

            prisma.inspection.update({
                where:{inspection_id},
                data: {
                    ...req.body,
                    updated_at: converted_datetime()
                }
            }),
            
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'inspection_modification',
                    action_details: {
                        inspection_id: inspection_id, time: converted_datetime(), modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Inspection updated', inspection_id: inspection_id,

                    message: `Inspection with Id ${inspection_exist?.inspection_ind} has been updated  successfully.`,

                    view_by_admin: true, notification_type: 'inspection', viewable_role: [],

                    notification_source_id: req.user.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(200).json({
            msg: 'Inspection created successfully',
            inspection: update_inspection
        })

    } catch (err:any) {
        console.log('Error editing project', err);
        return res.status(500).json({err:'Error editing project', error:err});
    }
}
