import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const main_installer_dashboard = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        


    } catch (err:any) {
        console.log('Error fetching installer dashboard');
        return res.status(500).json({err: 'Error fetching installer dashboard ', error: err})
    }
}


export const add_project_installs = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user = req.user

        const {project_id} = req.params

        const [project_exist, last_tracking, last_notification, last_install] = await Promise.all([
            prisma.project.findFirst({ 
                where: {project_id}, 
                select: {project_id: true, project_ind: true, job: {select: {job_ind: true}} } 
            }),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
            prisma.install.findFirst({orderBy: {created_at: 'desc'}, select: {install_ind: true}}),
        ])

        if (!project_exist) { return res.status(404).json({err: 'Project not found, check project id and try again'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const last_install_number = last_install ? parseInt(last_install.install_ind.slice(2)) : 0;
        const new_install_number = last_install_number + 1;
        const new_install_ind = `IN${new_install_number.toString().padStart(4, '0')}`;

        const add_install = await prisma.install.create({
            data: {
                install_ind: new_install_ind,
                project_id: project_id,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        if (add_install) {
            const [new_tracking, new_notification] = await Promise.all([
            
                prisma.user_Tracking.create({
                    data: {
                        tracking_ind: new_tracking_ind,
                        user: {connect: {user_id: req.user.user_id}},
                        action_type: 'project_modification',
                        action_details: {
                            project_id: project_id, time: add_install.created_at, modification_type: 'update'
                        },
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                }),
                
                prisma.notification.create({
                    data: {
                        notification_ind: new_notification_ind, subject: 'Project Installs Added', project_id: project_id,
    
                        message: `Install for project ${project_exist.project_ind} for job ${project_exist.job.job_ind} has been added by ${user.first_name} ${user.last_name}`,
    
                        view_by_admin: true, notification_type: 'project',
    
                        notification_source_id: req.user.user_id,
    
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                })
    
            ])
    
            return res.status(201).json({
                msg: 'Project Install added successfully',
                install: add_install
            })
        }

    } catch (err:any) {
        console.log('Error adding install data ', err);
        return res.status(500).json({err:'Error adding install data ', error:err});
    }
}

export const edit_project_installs = async(req: CustomRequest, res: Response)=>{

    try {
        const user = req.user

        const {install_id} = req.params

        const [install_exist, last_tracking, last_notification] = await Promise.all([
            prisma.install.findFirst({ 
                where: {install_id}, 
                select: { install_ind: true, project: {select: {project_id:true, project_ind: true}} } 
            }),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
        ])

        if (!install_exist) { return res.status(404).json({err: 'Project Install data not found, check install id and try again'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const [update_install, new_tracking, new_notification] = await Promise.all([

            prisma.install.update({
                where: {install_id},
                data: {
                    ...req.body,
                    updated_at: converted_datetime()
                }
            }),
            
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'project_modification',
                    action_details: {
                        project_id: install_exist.project.project_ind, time: converted_datetime(), modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Project Installs Updated', project_id: install_exist.project.project_id,

                    message: `Project Install of Id ${install_exist.install_ind} for Project ${install_exist.project.project_ind} updated successfully by ${user.first_name} ${user.last_name}.`,

                    view_by_admin: true, notification_type: 'project',

                    notification_source_id: req.user.user_id, notification_to_id: null,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })

        ])

        return res.status(201).json({
            msg: 'Project Install updated successfully',
            install: update_install
        })
        
    } catch (err:any) {
        console.log('Error occured while editing project installs ', err);
        return res.status(500).json({err:'Error occured while editing project installs ', error:err});
    }
}

export const add_install_material = async(req: CustomRequest, res: Response)=>{
    try {

        const user = req.user
        
        const {install_id} = req.params

        const [install_exist, last_tracking, last_notification] = await Promise.all([
            prisma.install.findFirst({
                where: {install_id}, select: {install_ind: true, project: {select: {project_id: true, project_ind: true}}}
            }),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
        ])

        if (!install_exist) { return res.status(404).json({err: 'Install not found, check install id and try again.'}) }

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const [add_material, new_tracking, new_notification] = await Promise.all([
            prisma.material.create({
                data: {
                    install_id: install_id,
                    ...req.body,
                    created_at: converted_datetime(), updated_at: converted_datetime()
                }
            }),

            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'project_modification',
                    action_details: {
                        project_id: install_exist.project.project_ind, time: converted_datetime(), modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Project Installs Updated', project_id: install_exist.project.project_id,

                    message: `Project Materials for Project ${install_exist.project.project_ind} added successfully by ${user.first_name} ${user.last_name}.`,

                    view_by_admin: true, notification_type: "project",

                    notification_source_id: req.user.user_id, notification_to_id: null,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(201).json({
            msg: 'Materials added successfully',
            materials: add_material
        })

    } catch (err:any) {
        console.log('Error adding install materials ', err);
        return res.status(500).json({err:'Error adding install materials ', error: err});
    }
}

export const edit_install_material = async(req: CustomRequest, res: Response)=>{
    try {

        const user = req.body

        const {install_id, material_id} = req.params

        const [install_exist, material_exist, last_tracking, last_notification] = await Promise.all([
            prisma.install.findFirst({
                where: {install_id}, select: {install_ind: true, project: {select: {project_id: true, project_ind: true}}}
            }),
            prisma.material.findFirst({
                where: {material_id}
            }),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}}),
        ])
        
        if (!install_exist) { return res.status(404).json({err: 'Install not found, check install id and try again.'}) }

        if (!material_exist) { return res.status(404).json({err: 'Install Material not found, check material id and try again.'}) }

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const [update_materials, new_tracking, new_notification] = await Promise.all([
            prisma.material.update({
                where: {material_id},
                data: {
                    ...req.body,
                    updated_at: converted_datetime()
                }
            }),

            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'project_modification',
                    action_details: {
                        project_id: install_exist.project.project_ind, time: converted_datetime(), modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Project Installs Updated', project_id: install_exist.project.project_id,

                    message: `Project Materials for Project ${install_exist.project.project_ind} updated successfully by ${user.first_name} ${user.last_name}.`,

                    view_by_admin: true, notification_type: 'project',

                    notification_source_id: req.user.user_id, notification_to_id: null,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(201).json({
            msg: 'Materials updated successfully',
            materials: update_materials
        })
        
    } catch (err:any) {
        console.log('Error occured while updating intall materials ', err);
        return res.status(500).json({err:'Error occured while updating intall materials ', error: err});
    }
}

export const all_paginated_installable_projects = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_projects, projects ] = await Promise.all([

            prisma.project.count({
                
            }),

            prisma.project.findMany({
                include: {
                    install: true,
                    job: {
                        select: {
                            job_ind: true, job_id:true, job_number: true,
                            lead: {
                                select: {customer_first_name: true, customer_last_name: true, desired_structure: true,  }
                            }
                        }
                    }
                },

                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_project_pages = (number_of_projects <= 15) ? 1 : Math.ceil(number_of_projects / 15)

        return res.status(200).json({ total_number_of_projects: number_of_projects, total_number_of_pages: number_of_project_pages, projects })

    } catch (err:any) {
        console.log('Error occured while fetching all installable project ',err);
        return res.status(500).json({err:'Error occured while fetching all installable project ',error:err});
    }
}

