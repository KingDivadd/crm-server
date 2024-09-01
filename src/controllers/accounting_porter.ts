import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'

export const main_accounting_dashboard = async(req: CustomRequest, res: Response)=>{
    try {
        

    } catch (err:any) {
        console.log(`Error occured while fetching accouting dashboard `,err);
        return res.status(500).json({err:`Error occured while fetching accouting dashboard `,error:err});
    }
}

export const create_new_invoice = async(req: CustomRequest, res: Response)=>{
    try {

        const [last_invoice, job_exist, customer_exist ] = await Promise.all([
            prisma.invoice.findFirst({ orderBy: {created_at: 'desc'}, select: {invoice_ind: true} }),
            prisma.job.findFirst({ where: {job_id: req.body.job_id}, select: {job_ind: true} }),
            prisma.user.findFirst({ where: {user_id: req.body.customer_id }, select: {user_ind: true}})
        ])

        if (!job_exist) { return res.status(404).json({err: `Job not found, check Job Id`}) }

        if (!customer_exist) { return res.status(404).json({err: `Customer not found, check Customer Id`}) }

        const last_invoice_number = last_invoice ? parseInt(last_invoice.invoice_ind.slice(2)) : 0;
        const new_invoice_number = last_invoice_number + 1;
        const new_invoice_ind = `IV${new_invoice_number.toString().padStart(4, '0')}`;

        const new_invoice = await prisma.invoice.create({
            data: {
                invoice_ind: new_invoice_ind, invoice_adder_id: req.user.user_id,
                ...req.body,
                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        return res.status(201).json({
            msg: 'Invioce Created',
            invoice: new_invoice
        })
        
    } catch (err:any) {
        console.log('Error occured while creating new invoice ', err);
        return res.status(500).json({err:'Error occured while creating new invoice ', error:err});
    }
}

export const edit_invoice = async(req: CustomRequest, res: Response)=>{
    try {

        const {invoice_id} = req.params
        const [invoice_exist, job_exist, customer_exist ] = await Promise.all([
            prisma.invoice.findFirst({ where: {invoice_id}}),
            prisma.job.findFirst({ where: {job_id: req.body.job_id}, select: {job_ind: true} }),
            prisma.user.findFirst({ where: {user_id: req.body.customer_id }, select: {user_ind: true}})
        ])

        if (!invoice_exist) { return res.status(404).json({err: `Invoice not found, check Invoice Id entered!`}) }

        if (!job_exist) { return res.status(404).json({err: `Job not found, check Job Id`}) }

        if (!customer_exist) { return res.status(404).json({err: `Customer not found, check Customer Id`}) }

        const update_invoice = await prisma.invoice.update({
            where: {invoice_id},
            data: {
                ...req.body,
                updated_at: converted_datetime()
            }
        })

        return res.status(201).json({
            msg: 'Invioce Updated',
            invoice: update_invoice
        })
        
    } catch (err:any) {
        console.log('Error occured while updating invoice ', err);
        return res.status(500).json({err:'Error occured while updating invoice ', error:err});
    }
}