import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import generate_otp from '../helpers/generate_otp'
import {otp_messanger, welcome_mail_messanger} from '../helpers/email'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const all_inspections = async(req: CustomRequest, res: Response)=>{
    try {

        const {page_number} = req.params

        const [number_of_projects, projects] = await Promise.all([

            prisma.project.count({}),
            prisma.project.findMany({
                include: {
                    project_adder: {
                        select: {
                            first_name: true, last_name: true, user_id: true, avatar: true,
                        }
                    },
                    job: {
                        include: {lead: {
                            include: { assigned_to: {select: {last_name: true, first_name: true},}} 
                        }}},
                    inspections: true
                    }, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { project_ind: 'desc'  } }),

        ])

        const number_of_projects_pages = (number_of_projects <= 15) ? 1 : Math.ceil(number_of_projects / 15)

        return res.status(200).json({
            msg: 'All Projects Inspections ', 
            total_number_of_projects: number_of_projects,
            total_number_of_projects_pages: number_of_projects_pages,
            projects: projects,
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching inspection page', err);
        return res.status(500).json({err:'Error occured while fetching inspection page', error:err});
    }
}

export const create_inspection = async(req: CustomRequest, res: Response)=>{
    const { pass, inspection_comments, inspection_type,date, project_id } = req.body
    try {
        
        const [project, last_inspection, last_notification] = await Promise.all([
            prisma.project.findFirst({ where: {project_id}, include: {job: {select: {customer_id: true} }} }),
            prisma.inspection.findFirst({ orderBy: {created_at: 'desc'} }),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'} })
        ])

        const customer_id = project?.job.customer_id || null
        if (!project || !customer_id) {
            console.log('Unable to obtain selected project information ', project);
            return res.status(404).json({err: 'Unable to obtain selected project information'}) 
        }
        
        const last_inspection_number = last_inspection ? parseInt(last_inspection.inspection_ind.slice(2)) : 0;
        const new_inspection_number = last_inspection_number + 1;
        const new_inspection_ind = `IN${new_inspection_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const new_inspection = await prisma.inspection.create({
            data: {
                inspection_ind: new_inspection_ind, project: {connect: {project_id}}, inspected_by: {connect: {user_id: req.user.user_id}},
                pass: pass.toLowerCase() == 'true' ? true:false, date, inspection_type, inspection_comments,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        if (!new_inspection) {
            return res.status(400).json({err: 'Unable to create inspection note '})
        }

        const notification = await prisma.notification.create({
            data: {
                notification_ind: new_notification_ind, project: {connect: {project_id}},
                subject: "New inspection note added.", message: `A new inspection note has been added for project ${project?.project_ind}`,
                source: {connect: {user_id: req.user.user_id}}, user: {connect: {user_id:customer_id }},

                created_at: converted_datetime(), updated_at: converted_datetime()
            }

        })

        return res.status(201).json({msg: 'Inspection note and notification created successfully ', new_inspection, notification})

    } catch (err:any) {
        console.log('Error occured while creating inspection note', err);
        return res.status(500).json({err:'Error occured while creating inspection note', error:err});
    }
}

export const all_permit = async(req: CustomRequest, res: Response)=>{
    try {
        const {page_number} = req.params

        const [number_of_projects, projects] = await Promise.all([

            prisma.project.count({}),
            prisma.project.findMany({
                include: {
                    project_adder: {
                        select: {
                            first_name: true, last_name: true, user_id: true, avatar: true,
                        }
                    },
                    job: {
                        include: {lead: {
                            include: { assigned_to: {select: {last_name: true, first_name: true},}} 
                        }}},
                    inspections: true
                    }, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { project_ind: 'desc'  } }),

        ])

        const number_of_projects_pages = (number_of_projects <= 15) ? 1 : Math.ceil(number_of_projects / 15)

        return res.status(200).json({
            msg: 'All Projects Inspections ', 
            total_number_of_projects: number_of_projects,
            total_number_of_projects_pages: number_of_projects_pages,
            projects: projects,
        })
    
    } catch (err:any) {
        console.log('Error occured while fetching all permits ',err);
        return res.status(500).json({err:'Error occured while fetching all permits ',error:err});
    }
}