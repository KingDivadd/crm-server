import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_job_created_email, send_lead_created_email, send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')


export const all_pipeline = async(req: CustomRequest, res: Response)=>{
    try {
        
        const {page_number} = req.params

        const [number_of_pipelines, pipeline] = await Promise.all([

            prisma.sales_Pipeline.count({}),
            prisma.sales_Pipeline.findMany({ include: {lead: {include: {assigned_to: true}}, job: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_pipeline_pages = (number_of_pipelines <= 15) ? 1 : Math.ceil(number_of_pipelines / 15)

        return res.status(200).json({
            msg: 'All Sales Pipeline ', 
            total_number_of_pipeline: number_of_pipelines,
            total_number_of_pipeline_pages: number_of_pipeline_pages,
            pipeline: pipeline,
        })

    } catch (err:any) {
        console.log('Error fetching all sales pipeline ', err);
        return res.status(500).json({err: 'Error fetching all sales pipeline ', error: err})
    }
}

export const sales_pipeline_page = async(req: CustomRequest, res: Response, next :NextFunction)=>{
    try {

        const [total_lead, lead_sold, jobs, lead_in_progress] = await Promise.all([
            prisma.lead.count({}),

            prisma.lead.count({where: {disposition: 'SOLD'}}),

            prisma.job.findMany({select: {contract_amount: true}}),

            prisma.lead.findMany({ where: {disposition: 'IN_PROGRESS' }})
            
        ])

        let total_contract_amount;
        if (jobs){
            total_contract_amount = jobs.reduce((accumulator, currentValue) => accumulator + currentValue.contract_amount, 0);
        }

        return res.status(200).json({total_lead, lead_sold, total_contract_amount, lead_in_progress: lead_in_progress || 0 })
        
    } catch (err:any) {
        console.log('Error while fetching sales pipeline page info ', err);
        return res.status(500).json({err: 'Error while fetching sales pipeline page info ', error: err});
    }
}