import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'

export const all_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_leads, leads] = await Promise.all([

            prisma.lead.count({}),
            prisma.lead.findMany({ skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_leads_pages = (number_of_leads <= 10) ? 1 : Math.ceil(number_of_leads / 10)

        return res.status(200).json({
            msg: 'All Leads ', 
            total_number_of_leads: number_of_leads,
            total_number_of_leads_pages: number_of_leads_pages,
            leads: leads,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all lead ', err);
        return res.status(500).json({err: 'Error occured while fetching all leads ', error: err})
    }
}

export const filter_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    
    try {

        const {page_number, disposition} = req.params

        if (!['sold', 'not_sold'].includes(disposition.toLowerCase())){
            return res.status(400).json({err: 'Invalid status entered. valid entries [sold, not_sold]'})
        }

        const [number_of_leads, leads] = await Promise.all([

            prisma.lead.count({ where: {disposition: disposition.toUpperCase()}, }),
            prisma.lead.findMany({ include: {user: true, designer: true, job: true, sales: true, tasks: true}, skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_leads_pages = (number_of_leads <= 10) ? 1 : Math.ceil(number_of_leads / 10)

        return res.status(200).json({
            msg: 'Filtered Leads ', 
            total_number_of_leads: number_of_leads,
            total_number_of_leads_pages: number_of_leads_pages,
            leads: leads,
         })
        
    } catch (err:any) {
        console.log('Error occured while fetching all lead ', err);
        return res.status(500).json({err: 'Error occured while fetching all leads ', error: err})
    }
}


export const sales_pipeline_page = async(req: CustomRequest, res: Response, next :NextFunction)=>{
    try {

        const [total_lead, total_sales, sales_Pipeline] = await Promise.all([
            prisma.lead.count({}),

            prisma.sale.findMany({}),

            prisma.sales_Pipeline.findMany({})
            
        ])

        const conversion_rate = (total_sales.length / total_lead) * 100

        let total_sales_amount;

        if (total_sales) {
            total_sales_amount = total_sales.reduce((accumulator, currentValue) => accumulator + currentValue.contract_amount, 0);
        }

        return res.status(200).json({total_lead, total_sales, conversion_rate, sales_Pipeline, total_sales_amount: total_sales_amount || 0})
        
    } catch (err:any) {
        console.log('Error while fetching sales pipeline page info ', err);
        return res.status(500).json({err: 'Error while fetching sales pipeline page info ', error: err});
    }
}