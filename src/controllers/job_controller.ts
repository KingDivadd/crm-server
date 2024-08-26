import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email } from '../helpers/email'


//Sales personnel are allowed to create lead


export const create_task_data = async(req: CustomRequest, res: Response)=>{
    try {
        
        const [all_jobs, admin_team, engineering_team, permit_team, electrical_team] = await Promise.all([
            prisma.job.findMany({ include: {lead: true}, orderBy: {job_ind: 'desc'} }),
            prisma.user.findMany({where: {user_role: 'admin'}}),
            prisma.user.findMany({where: {user_role: 'engineering'}}),
            prisma.user.findMany({where: {user_role: 'permit'}}),
            prisma.user.findMany({where: {user_role: 'electrical'}}),

        ]) 
                
        return res.status(200).json({nbHit: all_jobs.length, jobs: all_jobs, admin_team, engineering_team, permit_team, electrical_team })

    } catch (err:any) {
        console.log('Error occured while fetching all jobs');
        return res.status(500).json({err: 'Error occured while fetching all jobs'})
    }
}


export const all_project = async(req: CustomRequest, res: Response, next: NextFunction)=>{
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
                        }}
                }}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { project_ind: 'desc'  } }),

        ])

        const number_of_projects_pages = (number_of_projects <= 15) ? 1 : Math.ceil(number_of_projects / 15)

        return res.status(200).json({
            msg: 'All Projects ', 
            total_number_of_projects: number_of_projects,
            total_number_of_projects_pages: number_of_projects_pages,
            projects: projects,
        })

        
    } catch (err:any) {
        console.log('Error occured while fetching all projects ', err);
        return res.status(500).json({err: 'Error occured while fetching all projects ', error: err})
    }
}