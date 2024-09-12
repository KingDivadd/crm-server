import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'



export const admin_signup_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            phone_number: Joi.string().trim().allow(null,'').optional(),
            email: Joi.string().email().trim().required(),
            password: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error during admin signup validation ' })
    }
}

export const login_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const schema = Joi.object({
            email: Joi.string().email().trim().required(),
            password: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error during admin signup validation ' })
    }
}

export const generate_otp_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const schema = Joi.object({
            email: Joi.string().email().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error during otp generation validation ' })
    }
}


export const verify_otp_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const schema = Joi.object({
            email: Joi.string().email().trim().required(),
            otp: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error during otp verification validation ', error })
    }
}

export const admin_setup_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            company_name: Joi.string().trim().required(),
            company_address: Joi.string().trim().required(),
            company_phone: Joi.array().items(Joi.string()).required(),
            organization_size: Joi.number().optional(),
            number_of_admin: Joi.number().required(),
            company_logo: Joi.string().trim().allow('').optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error during admin signup validation ' })
    }
}

export const reset_password_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            email: Joi.string().trim().email().required(),
            new_password: Joi.string().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error during forget password validation ' })
    }
}

export const create_user_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            email: Joi.string().trim().email().required(),
            phone_number: Joi.string().trim().optional().allow(''),
            password: Joi.string().trim().required(),
            user_role: Joi.string().trim().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured in create user validation ' })
    }
}

export const admin_edit_user_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            last_name: Joi.string().trim().allow(null,'').optional(),
            first_name: Joi.string().allow(null,'').optional(),
            phone_number: Joi.string().trim().optional().allow(''),
            country_code: Joi.string().trim().allow(null,'').optional(),
            password: Joi.string().trim().allow(null,'').optional(),
            user_role: Joi.string().trim().allow(null,'').optional(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured in create user validation ' })
    }
}

export const edit_user_active_status_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            user_id: Joi.string().trim().required(),
            active_status: Joi.boolean().required()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured in in edit user active status validation ' })
    }
}


export const update_user_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            last_name: Joi.string().trim().allow(null,'').optional(),
            first_name: Joi.string().trim().allow(null,'').optional(),
            password: Joi.string().trim().allow(null,'').optional(),
            avatar: Joi.string().trim().allow(null,'').optional(),
            phone_number: Joi.string().trim().allow(null,'').optional(),
            country_code: Joi.string().trim().allow(null,'').optional(),

            user_id: Joi.string().trim().required(),
            active_status: Joi.boolean().optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured in in edit user active status validation ' })
    }
}


export const update_settings_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            company_logo: Joi.string().trim().allow(null,'').optional(),
            company_name: Joi.string().trim().allow(null,'').optional(),
            company_address: Joi.string().trim().allow(null,'').optional(),
            company_email: Joi.string().trim().allow(null,'').optional(),
            company_phone: Joi.array().items(Joi.string().optional()).optional(),
            number_of_admin: Joi.number().optional(),

            avatar: Joi.string().trim().allow('').required(),
            first_name: Joi.string().trim().allow('').required(),
            last_name: Joi.string().trim().allow(null,'').optional(),
            other_names: Joi.string().trim().allow(null,'').optional(),
            email: Joi.string().trim().allow(null,'').optional(),
            phone_number: Joi.string().trim().allow('').required(),
            password: Joi.string().trim().allow('').required(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating system settings input ',error })
    }
}

export const settings_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schema = Joi.object({
            avatar: Joi.string().trim().allow('').required(),
            first_name: Joi.string().trim().allow('').required(),
            last_name: Joi.string().trim().allow(null,'').optional(),
            other_names: Joi.string().trim().allow(null,'').optional(),
            phone_number: Joi.string().trim().allow('').required(),
            password: Joi.string().trim().allow('').required(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating system settings input ',error })
    }
}


export const lead_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            lead_designer_id: Joi.string().trim().required(),

            customer_first_name: Joi.string().trim().required(),
            customer_last_name: Joi.string().trim().required(),
            customer_city: Joi.string().trim().required(),
            customer_state: Joi.string().trim().required(),
            customer_zip: Joi.number().optional(),
            customer_address: Joi.string().trim().allow('').optional(),
            customer_phone: Joi.string().trim().allow('').optional(),
            disposition: Joi.string().valid('sold', 'not_sold').required(),

            customer_email: Joi.when('disposition',{
                is: 'sold',
                then: Joi.string().trim().email().required(),
                otherwise: Joi.string().allow('').optional()
            }),

            gate_code: Joi.string().trim().allow('').optional(),
            appointment_date: Joi.string().trim().required(),
            desired_structure: Joi.string().trim().allow('').optional(),
            contract_document: Joi.array().items(Joi.string().trim().optional()).optional(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating lead creation input ',error })
    }
}

export const lead_contract_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({

            desired_structure: Joi.string().trim().allow('').required(),
            contract_document: Joi.array().items(Joi.string().trim().required()).required(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating lead creation input ',error })
    }
}


export const job_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({

            // Basic job info
            job_number: Joi.string().trim().allow('').optional(),
            lead_id: Joi.string().trim().required(),
            contract_amount: Joi.number().required(),
            contract_date: Joi.number().required(),

            // Permits
            hoa_permit_status: Joi.string().trim().valid('not_required', 'required', 'pending', 'submitted', 'approved').required(),
            hoa_permit_submit_date: Joi.number().optional(),
            hoa_permit_approval_date: Joi.number().optional(),
            hoa_permit_number: Joi.string().trim().allow('').optional(),
            hoa_permit_cost: Joi.number().optional(),
            hoa_permit_document:Joi.array().items(Joi.string().trim().optional()).optional(),
            
            engineering_permit_status: Joi.string().trim().valid('not_required', 'required', 'pending', 'submitted', 'approved').required(),
            engineering_permit_submit_date: Joi.number().optional(),
            engineering_permit_approval_date: Joi.number().optional(),
            engineering_permit_number: Joi.string().trim().allow('').optional(),
            engineering_permit_cost: Joi.number().optional(),
            engineering_permit_document:Joi.array().items(Joi.string().trim().optional()).optional(),
            
            general_permit_status: Joi.string().trim().valid('not_required', 'required', 'pending', 'submitted', 'approved').required(),
            general_permit_submit_date: Joi.number().optional(),
            general_permit_approval_date: Joi.number().optional(),
            general_permit_number: Joi.string().trim().allow('').optional(),
            general_permit_cost: Joi.number().optional(),
            general_permit_document:Joi.array().items(Joi.string().trim().optional()).optional(),
            
            // below are project info
            attached: Joi.string().trim().allow('').optional(),
            structure_type: Joi.string().trim().allow('').optional(),
            cover_size: Joi.string().trim().allow('').optional(),
            end_cap_style: Joi.string().trim().allow('').optional(),
            cover_color: Joi.string().trim().allow('').optional(),
            trim_color: Joi.string().trim().allow('').optional(),
            description: Joi.string().trim().allow('').optional(),
            

            paperwork_upload: Joi.array().optional(),
            photo_upload: Joi.array().optional(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating job creation input ',error })
    }
}

export const edit_project_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            attached: Joi.string().trim().allow('').optional(),
            structure_type: Joi.string().trim().allow('').optional(),
            cover_size: Joi.string().trim().allow('').optional(),
            end_cap_style: Joi.string().trim().allow('').optional(),
            cover_color: Joi.string().trim().allow('').optional(),
            trim_color: Joi.string().trim().allow('').optional(),
            description: Joi.string().trim().allow('').optional(),

            paperwork_upload: Joi.array().optional(),
            photo_upload: Joi.array().optional(),

            service_ticket_bill_sheets: Joi.array().optional(),
            bill_sheets: Joi.array().optional(),
            job_receipt_upload: Joi.array().optional(),
            regimented_photo_upload: Joi.array().optional(),
            project_details_and_instruction: Joi.array().optional(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (err:any) {
        return res.status(422).json({err: 'Error occured while validating project update data ', error: err})
    }
}

export const project_invoice_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            invoice_upload: Joi.array().items(Joi.string().optional()).optional(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (err:any) {
        return res.status(422).json({err: 'Error occured while validating project invoice upload data data ', error: err})
    }
}

export const project_photo_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            photo_upload: Joi.array().items(Joi.string().optional()).optional(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (err:any) {
        return res.status(422).json({err: 'Error occured while validating project photo upload data data ', error: err})
    }
}

export const project_job_description_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            job_description: Joi.string().allow('').optional()

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (err:any) {
        return res.status(422).json({err: 'Error occured while validating project photo upload data data ', error: err})
    }
}

export const project_inspection_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            inspection_date: Joi.number().required(),
            inspection_document: Joi.array().items(Joi.string().optional()).optional(),
            inspection_status: Joi.string().trim().valid('n_a','pass', 'fail').required()

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (err:any) {
        return res.status(422).json({err: 'Error occured while validating project inspection data ', error: err})
    }
}


export const install_validation = async (req: Request, res: Response, next: NextFunction)=>{
    try {
        const schema = Joi.object({
            footing_date: Joi.number().optional(),
            footing_crew: Joi.string().trim().allow('').optional(),
            footing_bill_sheet: Joi.string().trim().allow('').optional(),

            set_post_date: Joi.number().optional(),
            set_post_crew: Joi.string().trim().allow('').optional(),
            set_post_bill_sheet: Joi.string().trim().allow('').optional(),

            demo_date: Joi.number().optional(),
            demo_crew: Joi.string().trim().allow('').optional(),
            demo_bill_sheet: Joi.string().trim().allow('').optional(),

            install_date: Joi.number().optional(),
            install_crew: Joi.string().trim().allow('').optional(),
            install_bill_sheet: Joi.string().trim().allow('').optional(),

            electrical_date: Joi.number().optional(),
            electrical_crew: Joi.string().trim().allow('').optional(),
            electrical_bill_sheet: Joi.string().trim().allow('').optional(),

            project_sign_off: Joi.string().trim().valid("pending", "in_progress", "completed", "closed").required(),

            inspection_date: Joi.number().optional(),
            inspection_status: Joi.string().trim().valid('n_a','pass', 'fail').required(),

        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (err:any) {
        return res.status(422).json({err: 'Error occured while validating project install data. ', error: err})
    }
}



export const payment_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            payment_phase: Joi.string().trim().valid('deposit','scheduling', 'delivery', 'construction_completion', 'electrical_completion').required(),
            amount: Joi.number().optional().required(),
            payment_method: Joi.string().trim().valid('cash', 'credit_card', 'check', 'bank_transfer').required(),
            payment_receipt: Joi.string().trim().allow('').optional()
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating customer payment data ',error })
    }
}

export const invoice_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            job_id: Joi.string().trim().required(),
            customer_id: Joi.string().trim().required(),
            invoice_type: Joi.string().trim().valid('duralum', 'four_k', 'js_service', 'others').required(),
            expenses_receipts: Joi.array().items(Joi.string().optional()).optional(),
            gas: Joi.array().items(Joi.string().optional()).optional(),
            payment_receipt: Joi.string().trim().allow('').optional()
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating customer invoice data ',error })
    }
}

export const material_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            install_id: Joi.string().trim().required(),
            description: Joi.string().trim().allow('').optional(),
            quantity: Joi.number().optional(),
            material_received_date: Joi.number().required(),
            material_delivered_date: Joi.number().required()
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating install materials ',error })
    }
}

export const service_ticket_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            ticket_status: Joi.string().trim().valid('open', 'assigned', 'in_progress', 'resolved', 'closed'),
            uploads: Joi.array().items(Joi.string()).required(),
            description: Joi.string().trim().required(),
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }
        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating service ticket data ',error })
    }
}

export const rfi_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            rfi_assignee_id: Joi.string().trim().required(),
            project_id: Joi.string().trim().required(),

            description: Joi.string().trim().required(),
            due_date: Joi.number().optional(),
            status: Joi.string().valid('open', 'in_progress', 'closed').required(),

            response: Joi.string().trim().allow('').optional(),
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating task creation input ',error })
    }
}

export const red_line_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            redLine_assignee_id: Joi.string().trim().required(),
            project_id: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
            status: Joi.string().trim().valid('pending', 'approved', 'rejected').optional()
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating red line input ',error })
    }
}

export const create_task_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            job_id: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
            task_assigned_to: Joi.string().trim().required(),
            status: Joi.string().trim().required(),
            start_date: Joi.string().trim().allow(null,'').optional(),
            due_date: Joi.string().trim().allow(null,'').optional(),
            completion_date: Joi.string().trim().allow(null,'').optional(),
            note: Joi.string().trim().allow(null,'').optional(),
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating task creation input ',error })
    }
}

export const edit_task_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            job_id: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
            status: Joi.string().trim().required(),
            start_date: Joi.string().trim().allow(null,'').optional(),
            due_date: Joi.string().trim().allow(null,'').optional(),
            completion_date: Joi.string().trim().allow(null,'').optional(),
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating task creation input ',error })
    }
}


export const create_ticket_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            description: Joi.string().trim().required(),
            project_id: Joi.string().trim().required(),
            image_url: Joi.string().trim().allow(null,'').optional(),
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating service ticket data ',error })
    }
}


export const create_inspection_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            date: Joi.string().trim().required(),
            pass: Joi.string().trim().required(),
            inspection_comments: Joi.string().trim().required(),
            inspection_type: Joi.string().trim().required(),
            project_id: Joi.string().trim().required(),
            
        })

        const { error: validation_error } = schema.validate(req.body)

        if (validation_error) {
            const error_message = validation_error.message.replace(/"/g, '');
            return res.status(400).json({ err: error_message });
        }

        return next()
    } catch (error) {
        return res.status(422).json({ err: 'Error occured while validating creating inspection data ',error })
    }
}
