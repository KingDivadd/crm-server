import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const main_electrical_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        

    } catch (err:any) {
        console.log(`Error occured while fetching electrical dashboard `,err);
        return res.status(500).json({err:`Error occured while fetching electrical dashboard `,error:err});
    }
}


export const project_invoice_upload = async(req: CustomRequest, res: Response)=>{
    const {invoice_upload} = req.body
    try {
        
        const {project_id} = req.params

        const project_exist = await prisma.project.findFirst({ where: {project_id} })

        if (!project_exist) { return res.status(404).json({err: `Project not found, check id and try again`}) }
            
        const update_project = await prisma.project.update({
            where: {project_id},
            data: {
                invoice_upload: invoice_upload.length? invoice_upload : project_exist.invoice_upload,
                updated_at: converted_datetime()
            }
        })

        return res.status(200).json({
            msg: 'Project Invoice Updated',
            project: update_project
        })

    } catch (err:any) {
        console.log(`Error occured while uploading project invoice `,err);
        return res.status(500).json({err:`Error occured while uploading project invoice`,error:err});
    }
}

export const project_photo_upload = async(req: CustomRequest, res: Response)=>{
    const {photo_upload} = req.body
    try {
        
        const {project_id} = req.params

        const project_exist = await prisma.project.findFirst({ where: {project_id} })

        if (!project_exist) { return res.status(404).json({err: `Project not found, check id and try again`}) }
            
        const update_project = await prisma.project.update({
            where: {project_id},
            data: {
                photo_upload: photo_upload.length? photo_upload : project_exist.photo_upload,
                updated_at: converted_datetime()
            }
        })

        return res.status(200).json({
            msg: 'Project Invoice Updated',
            project: update_project
        })

    } catch (err:any) {
        console.log(`Error occured while uploading project invoice `,err);
        return res.status(500).json({err:`Error occured while uploading project invoice`,error:err});
    }
}

