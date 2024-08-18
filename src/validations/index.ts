import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'



export const admin_signup_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            last_name: Joi.string().trim().required(),
            first_name: Joi.string().trim().required(),
            phone_number: Joi.string().trim().allow('').optional(),
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

export const forget_password_validation = async (req: Request, res: Response, next: NextFunction) => {
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
            last_name: Joi.string().trim().allow('').optional(),
            first_name: Joi.string().allow('').optional(),
            phone_number: Joi.string().trim().optional().allow(''),
            country_code: Joi.string().trim().allow('').optional(),
            password: Joi.string().trim().allow('').optional(),
            user_role: Joi.string().trim().allow('').optional(),
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
            last_name: Joi.string().trim().allow('').optional(),
            first_name: Joi.string().trim().allow('').optional(),
            password: Joi.string().trim().allow('').optional(),
            avatar: Joi.string().trim().allow('').optional(),
            phone_number: Joi.string().trim().allow('').optional(),
            country_code: Joi.string().trim().allow('').optional(),

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
            company_logo: Joi.string().trim().allow('').optional(),
            company_name: Joi.string().trim().allow('').optional(),
            company_address: Joi.string().trim().allow('').optional(),
            company_email: Joi.string().trim().allow('').optional(),
            company_phone: Joi.array().items(Joi.string().optional()).optional(),
            number_of_admin: Joi.number().optional(),

            avatar: Joi.string().trim().allow('').required(),
            first_name: Joi.string().trim().allow('').required(),
            last_name: Joi.string().trim().allow('').optional(),
            other_names: Joi.string().trim().allow('').optional(),
            email: Joi.string().trim().allow('').optional(),
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
            last_name: Joi.string().trim().allow('').optional(),
            other_names: Joi.string().trim().allow('').optional(),
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


export const create_lead_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            customer_name: Joi.string().trim().required(),
            address: Joi.string().trim().required(),
            phone_number: Joi.string().trim().required(),
            email: Joi.string().email().trim().required(),
            gate_code: Joi.string().trim().required(),
            assigned_to_id: Joi.string().trim().required(),
            appointment_date: Joi.string().trim().required(),
            disposition: Joi.string().trim().required(),

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

export const create_job_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            lead_id: Joi.string().trim().required(),
            contract_amount: Joi.string().trim().required(),
            contract_date: Joi.string().trim().required(),
            hoa_status: Joi.string().trim().required(),
            engineering_status: Joi.string().trim().required(),
            engineering_submitted: Joi.string().trim().allow('').optional(),
            engineering_received: Joi.string().trim().allow('').optional(),
            permit_status: Joi.string().trim().allow('').optional(),
            permit_sent_date: Joi.string().trim().allow('').optional(),
            permit_approved_date: Joi.string().trim().allow('').optional(),
            cover_size: Joi.string().trim().allow('').optional(),
            cover_color: Joi.string().trim().allow('').optional(),

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

export const create_task_validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = Joi.object({
            job_id: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
            assigned_to: Joi.string().trim().required(),
            status: Joi.string().trim().required(),
            start_date: Joi.string().trim().allow('').optional(),
            due_date: Joi.string().trim().allow('').optional(),
            completion_date: Joi.string().trim().allow('').optional(),
            note: Joi.string().trim().allow('').optional(),
            
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
            start_date: Joi.string().trim().allow('').optional(),
            due_date: Joi.string().trim().allow('').optional(),
            completion_date: Joi.string().trim().allow('').optional(),
            
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

