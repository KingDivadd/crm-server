import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const sales_report_page_info = async(req: CustomRequest, res: Response)=>{
    try {

        const {page_number} = req.params

        const [leads, sold_lead, jobs, number_of_sales_person, sales_persons,  ] = await Promise.all([
            prisma.lead.findMany({include: {assigned_to: true}, orderBy: {created_at: 'desc'}}),
            prisma.lead.count({where: {disposition: 'SOLD'}, orderBy: {created_at: 'desc'}}),
            prisma.job.findMany({include: {lead: {include: {assigned_to: true}}}}),
            prisma.user.count({where: {user_role: 'sales'}}),
            prisma.user.findMany({ where: {user_role: 'sales'}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),
        
        ])

        const total_lead = leads.length;
        const total_lead_converted = jobs.length
        let revenue_generated;
        if (jobs){
            revenue_generated = jobs.reduce((accumulator, currentValue) => accumulator + currentValue.contract_amount, 0);
        }

        const total_number_of_sales_person_pages = (number_of_sales_person <= 15) ? 1 : Math.ceil(number_of_sales_person / 15)

        return res.status(200).json({total_lead, sold_lead, total_lead_converted, revenue_generated, total_number_of_sales_person: number_of_sales_person, total_number_of_sales_person_pages, sales_persons, leads, jobs  })
        
    } catch (err:any) {
        console.log('Error occured while fetching sales report data ', err);
        return res.status(500).json({err: 'Error occured while fetching sales report data ', error:err});
        
    }
}