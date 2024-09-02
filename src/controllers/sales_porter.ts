import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'
import { send_lead_sold_email } from '../helpers/email'
import { salt_round } from '../helpers/constants'
import generate_otp from '../helpers/generate_otp'
const bcrypt = require('bcrypt')


export const main_sales_dashboard = async(req: CustomRequest, res: Response)=>{
    try {

        const [total_lead, converter_lead, jobs, recent_lead, recent_service_ticket ] =  await Promise.all([
            prisma.lead.count({select: {lead_id: true, disposition: true}}),
            prisma.lead.count({where: {disposition: 'sold'}, select: {lead_id: true, disposition: true} }),
            prisma.job.findMany({ orderBy: {created_at: 'desc'} }),
            prisma.lead.findMany({ take: 15, orderBy: {created_at: 'desc'}  }),
            prisma.serviceTicket.findMany({ 
                where: {ticket_assignee_id: req.body.user_id},
                include: {
                    ticket_assignee: {
                        select: {first_name: true, last_name: true, email: true, user_role: true, phone_number: true, avatar: true, }
                    }
                },
                take: 15, orderBy: {created_at: 'desc'}
            })
        ])
        
        const total_job = jobs.length
        const revenue_generated = jobs.reduce((accumulator, currentValue) => accumulator + currentValue.contract_amount, 0);

        return res.status(200).json({
            msg: 'Sales Dashboard Data',
            total_lead, converter_lead, total_job, revenue_generated,
            recent_lead, 

        })
    } catch (err:any) {
        console.log('Error occured while fetching sales dashboard data ', err);
        return res.status(500).json({err: 'Error occured while fetching sales dashboard data ', error: err});
    }
}

// Leads

export const all_paginated_leads = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_leads, leads ] = await Promise.all([

            prisma.lead.count({}),

            prisma.lead.findMany({
                include: {
                    lead_adder: {
                        select: {first_name: true, last_name: true, email: true, avatar: true, user_role: true, phone_number: true}
                    },
                    lead_designer: {
                        select: {first_name: true, last_name: true, email: true, avatar: true, user_role: true, phone_number: true}
                    }
                },

                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_lead_pages = (number_of_leads <= 15) ? 1 : Math.ceil(number_of_leads / 15)

        return res.status(200).json({ total_number_of_leads: number_of_leads, total_number_of_pages: number_of_lead_pages, leads })
    } catch (err:any) {
        console.log('Error occured while fetching all leads ',err);
        return res.status(500).json({err:'Error occured while fetching all leads ',error:err});
    }
}

export const all_lead = async(req: CustomRequest, res: Response)=>{
    try {
        const sold_leads = await prisma.lead.findMany({
            where: {disposition: 'sold'},
            select: {
                lead_ind: true, lead_designer: {select: {user_ind: true, first_name: true, last_name: true}}
            }
        })

        return res.status(200).json({
            msg: 'All sold leads',
            leads: sold_leads 
        })

    } catch (err:any) {
        console.log('Error fetching all sold leads', err);
        return res.status(500).json({err:'Error fetching all sold leads', error: err});
    }
}

export const add_new_lead = async(req: CustomRequest, res: Response)=>{
    const {customer_first_name, customer_last_name, customer_email, customer_phone, } = req.body
    try {

        const logged_in_user = req.user
        
        const [last_user, last_lead, last_notification, last_tracking] = await Promise.all([
            prisma.user.findFirst({orderBy: {created_at: 'desc'}, select: {user_ind: true}}),
            prisma.lead.findFirst({orderBy: {created_at: 'desc'}, select: {lead_ind: true} }),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true} }),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
        ])

        const last_user_number = last_user ? parseInt(last_user.user_ind.slice(2)) : 0;
        const new_user_number = last_user_number + 1;
        const new_user_ind = `US${new_user_number.toString().padStart(4, '0')}`;

        const last_lead_number = last_lead ? parseInt(last_lead.lead_ind.slice(2)) : 0;
        const new_lead_number = last_lead_number + 1;
        const new_lead_ind = `LD${new_lead_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const new_lead = await prisma.lead.create({
            data: {
                lead_ind: new_lead_ind,
                lead_adder_id: req.user.user_id,

                ...req.body,

                created_at: converted_datetime(),
                updated_at: converted_datetime()
            },
            include: {lead_designer: {select: {first_name: true, last_name: true}}}
        })

        if (!new_lead) { return res.status(500).json({err:'Lead creation failed.'}) }


        if (new_lead && new_lead.disposition == 'sold'){

            const encrypted_password = await bcrypt.hash('password', salt_round);

            const [new_customer, new_tracking, new_notification] = await Promise.all([
                prisma.user.create({
                    data: {
                        user_ind: new_user_ind,
                        first_name: customer_first_name, last_name: customer_last_name, email: customer_email, phone_number: customer_phone,
                        password: encrypted_password, user_role: 'customer', is_verified: true,
                        created_at: converted_datetime(), updated_at: converted_datetime()
                    }
                }),
                prisma.user_Tracking.create({
                    data: {
                        tracking_ind: new_tracking_ind,
                        user: {connect: {user_id: req.user.user_id}},
                        action_type: 'lead_modification',
                        action_details: {
                            lead_id: new_lead.lead_id, time: new_lead.created_at, modification_type: 'added'
                        },
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                }),
                
                prisma.notification.create({
                    data: {
                        notification_ind: new_notification_ind, subject: 'New Lead Created', lead_id: new_lead.lead_id,
    
                        message: `${logged_in_user.first_name} ${logged_in_user.last_name} created a new lead with ${new_lead.lead_designer.first_name} ${new_lead.lead_designer.last_name} as the designer.`,
    
                        view_by_admin: true, notification_type: 'lead',
    
                        notification_source_id: req.user.user_id, notification_to_id: new_lead.lead_designer_id,
    
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                })
    
            ])

            send_lead_sold_email(new_customer)

            return res.status(201).json({
                msg: 'Lead created successfully',
                lead: new_lead
            })
        }

        const [new_tracking, new_notification] = await Promise.all([
            
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'lead_modification',
                    action_details: {
                        lead_id: new_lead.lead_id, time: new_lead.created_at, modification_type: 'added'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'New Lead Created', lead_id: new_lead.lead_id,

                    message: `${logged_in_user.first_name} ${logged_in_user.last_name} created a new lead with ${new_lead.lead_designer.first_name} ${new_lead.lead_designer.last_name} as the designer `,

                    view_by_admin: true, notification_type: 'lead',

                    notification_source_id: req.user.user_id, notification_to_id: new_lead.lead_designer_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })

        ])

        return res.status(201).json({
            msg: 'Lead created successfully',
            lead: new_lead
        })

    } catch (err:any) {
        console.log('Error occured while creating a new lead ', err);
        return res.status(500).json({err:'Error occured while creating a new lead ', error:err});
    }
}

export const edit_lead = async(req: CustomRequest, res: Response)=>{
    const {customer_first_name, customer_last_name, customer_email, customer_phone, } = req.body
    try {
        
        const {lead_id} = req.params

        const [lead_exist, last_user, last_tracking, last_notification] = await Promise.all([
            prisma.lead.findFirst({where: {lead_id}}),
            prisma.user.findFirst({orderBy: {created_at: 'desc'}, select: {user_ind: true}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}})
        ])

        if (!lead_exist) { return res.status(404).json({err: 'Lead not found, check lead id provided'}) }

        const last_user_number = last_user ? parseInt(last_user.user_ind.slice(2)) : 0;
        const new_user_number = last_user_number + 1;
        const new_user_ind = `US${new_user_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const update_lead = await prisma.lead.update({
            where: {lead_id},
            data: {

                ...req.body,

                updated_at: converted_datetime()
            },
            include: {
                lead_adder: {select: {first_name: true, last_name: true}},
                lead_designer: {select: {first_name: true, last_name: true}}
            }
        })

        if (update_lead && update_lead.disposition == 'sold') {

            const encrypted_password = await bcrypt.hash('password', salt_round);

            const [new_customer, new_tracking, new_notification] = await Promise.all([
                prisma.user.create({
                    data: {
                        user_ind: new_user_ind,
                        first_name: customer_first_name, last_name: customer_last_name, email: customer_email, phone_number: customer_phone,
                        password: encrypted_password, user_role: 'customer', is_verified: true,
                        created_at: converted_datetime(), updated_at: converted_datetime()
                    }
                }),

                prisma.user_Tracking.create({
                    data: {
                        tracking_ind: new_tracking_ind,
                        user: {connect: {user_id: req.user.user_id}},
                        action_type: 'lead_modification',
                        action_details: {
                            lead_id: update_lead.lead_id, time: update_lead.updated_at, modification_type: 'update'
                        },
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                }),
                
                prisma.notification.create({
                    data: {
                        notification_ind: new_notification_ind, subject: 'Lead Updated and Sold', lead_id: update_lead.lead_id,
    
                        message: `Lead with Id ${update_lead.lead_ind} created by ${update_lead.lead_adder.first_name} ${update_lead.lead_adder.first_name} and assigned to designer ${update_lead.lead_designer.first_name} ${update_lead.lead_designer.last_name} has been sold.`,
    
                        view_by_admin: true, notification_type: 'lead',
    
                        notification_source_id: req.user.user_id, notification_to_id: update_lead.lead_designer_id,
    
                        created_at: converted_datetime(), updated_at: converted_datetime(),
                    }
                })
            ])

            send_lead_sold_email(new_customer)

            return res.status(200).json({
                msg: 'Lead updated and sold',
                lead: update_lead
            })
        }

        const new_tracking = await prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'lead_modification',
                    action_details: {
                        lead_id: update_lead.lead_id, time: update_lead.updated_at, modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })

        return res.status(200).json({
            msg: 'Lead updated ',
            lead: update_lead
        })


    } catch (err) {
        console.log('Error occured while editing lead datails ', err)
        return res.status(500).json({err:'Error occured while editing lead datails ', error: err})
    }
}

export const delete_lead = async(req: CustomRequest, res: Response)=>{
    try {
        const {lead_id} = req.params

        const user_role = req.user.user_role

        if (user_role !== 'admin') { return res.status(401).json({err: 'Not authorized to perform operation, refer to admin'})}

        const [lead_exist, last_tracking, last_notification] = await Promise.all([
            prisma.lead.findFirst({ 
                where: {lead_id},
                select: {
                    lead_adder: {select: {first_name: true, last_name: true, avatar: true, user_role: true}},
                    lead_designer: {select: {first_name: true, last_name: true, avatar: true, user_role: true, }},
                    lead_id: true, lead_ind: true, lead_designer_id: true
                }
            }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true} })
        ])

        if (!lead_exist) { return res.status(404).json({err: 'Lead not found, check lead id'}) }


        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const [del_lead, new_tracking, new_notification] = await Promise.all([

            prisma.lead.update({
                where: {lead_id},
                data: {
                    deleted: true,  updated_at: converted_datetime()
                }
            }),

            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'lead_modification',
                    action_details: {
                        lead_id: lead_exist.lead_id, time: converted_datetime() , modification_type: 'delete'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Lead Deleted', lead_id: lead_id,

                    message: `Lead with Id ${lead_exist.lead_ind} created by ${lead_exist.lead_adder.first_name} ${lead_exist.lead_adder.last_name} and assigned to ${lead_exist.lead_designer.first_name} ${lead_exist.lead_designer.last_name} has been deleted `,

                    view_by_admin: true, notification_type: 'lead',

                    notification_source_id: req.user.user_id, notification_to_id: lead_exist.lead_designer_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })

        ]) 

        return res.status(200).json({
            msg: 'Lead deleted succesfully'
        })

    } catch (err: any) {
        console.log('Error occured while deleting lead ', err);
        return res.status(500).json({err:'Error occured while deleting lead ', error:err});
    }
}
// Jobs

export const all_paginated_jobs = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_jobs, jobs ] = await Promise.all([

            prisma.job.count({}),

            prisma.job.findMany({
                include: {
                    project: {
                        take: 1
                    },
                    job_adder: {
                        select: {first_name: true, last_name: true, email: true, avatar: true, user_role: true, phone_number: true}
                    },
                    lead: true
                },

                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_job_pages = (number_of_jobs <= 15) ? 1 : Math.ceil(number_of_jobs / 15)

        return res.status(200).json({ total_number_of_jobs: number_of_jobs, total_number_of_pages: number_of_job_pages, jobs })

    } catch (err:any) {
        console.log('Error occured while fetching all jobs ',err);
        return res.status(500).json({err:'Error occured while fetching all jobs ',error:err});
    }
}

export const all_paginated_projects = async(req: CustomRequest, res: Response)=>{
    try {
        const user_id = req.user.user_id

        const {page_number} = req.params

        const [number_of_projects, projects ] = await Promise.all([

            prisma.project.count({}),

            prisma.project.findMany({
                include: {job: true},

                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_project_pages = (number_of_projects <= 15) ? 1 : Math.ceil(number_of_projects / 15)

        return res.status(200).json({ total_number_of_projects: number_of_projects, total_number_of_pages: number_of_project_pages, projects })

    } catch (err:any) {
        console.log('Error occured while fetching all projects ',err);
        return res.status(500).json({err:'Error occured while fetching all projects ',error:err});
    }
}

export const create_new_job = async(req: CustomRequest, res: Response)=>{
    const {
        attached, structure_type, cover_size, end_cap_style, cover_color, trim_color, description, paperwork_upload, photo_upload,  ...job_box
    } = req.body

    try {
        const logged_in_user = req.user

        const [lead, last_job, last_tracking, last_notification, last_project] = await Promise.all([
            prisma.lead.findFirst({
                where: {lead_id: job_box.lead_id}, 
                select: {
                    customer_email: true, lead_ind: true,
                    lead_adder: {select: {user_id: true, first_name: true, last_name: true}},
                    lead_designer: {select: {user_id: true, first_name: true, last_name: true}}
                } 
            }),
            prisma.job.findFirst({ orderBy: {created_at: 'desc'}, select: {job_ind: true, job_id: true}}),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({orderBy:{created_at: 'desc'}, select: {notification_ind: true}}),
            prisma.project.findFirst({orderBy:{created_at: 'desc'}, select: {project_ind: true}})
        ])

        if (!lead) { return res.status(404).json({err: 'Selected lead not found'}) }

        const last_job_number = last_job ? parseInt(last_job.job_ind.slice(2)) : 0;
        const new_job_number = last_job_number + 1;
        const new_job_ind = `JB${new_job_number.toString().padStart(4, '0')}`;

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const last_project_number = last_project ? parseInt(last_project.project_ind.slice(2)) : 0;
        const new_project_number = last_project_number + 1;
        const new_project_ind = `PJ${new_project_number.toString().padStart(4, '0')}`;

        job_box.email = lead?.customer_email

        const new_job = await prisma.job.create({
            data: {
                job_ind: new_job_ind, job_adder_id: logged_in_user.user_id, 

                ...job_box,

                created_at: converted_datetime(), updated_at: converted_datetime()
            }
        })

        if (!new_job) { return res.status(500).json({err: 'Unable to create job, contact dev. '}) }

        const [project, tracking, notification] = await Promise.all([
            prisma.project.create({
                data: {
                    project_ind: new_project_ind,
                    job_id: new_job.job_id,
                    attached, structure_type, cover_size, end_cap_style, cover_color, trim_color, paperwork_upload, photo_upload,

                    updated_at: converted_datetime(), created_at: converted_datetime()
                }
            }),
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'job_modification',
                    action_details: {
                        job_id: new_job.job_id, time: new_job.updated_at, modification_type: 'added'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'New Job Created', job_id: new_job.job_id,

                    message: `${logged_in_user.first_name} ${logged_in_user.last_name} created a new job for lead with Id ${lead.lead_ind}.`,

                    view_by_admin: true,
                    notification_type: 'job',

                    notification_source_id: req.user.user_id, notification_to_id: lead.lead_designer.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(201).json({
            msg: 'Job and project created successfully'
        })

    } catch (err:any) {
        console.log('Error occured while creating job ', err);
        return res.status(500).json({err:'Error occured while creating job ', error:err});
    }
}

export const edit_job = async(req: CustomRequest, res: Response)=>{
    const {
        attached, structure_type, cover_size, end_cap_style, cover_color, trim_color, description, paperwork_upload, photo_upload,  ...job_box
    } = req.body

    try {

        const user = req.body.user
        
        const {job_id} = req.params

        const [lead, job_exist, last_notification, last_tracking] = await Promise.all([
            prisma.lead.findFirst({ where: {lead_id: job_box.lead_id }, select: {customer_email: true, lead_designer: {select: {user_id: true}}} }),
            prisma.job.findFirst({
                where: {job_id},
                select: {
                    job_id: true,job_ind: true, 
                    project: {
                        where: {job_id},
                        select: {project_id: true}, take: 1
                    }
                }
            }),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}, select: {notification_ind: true} }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
        ])

        if (!lead) { return res.status(404).json({ err: 'Lead not found, check lead id and try again '}) }

        if (!job_exist) { return res.status(404).json({err: 'Job not found, check job id again '}) }


        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        job_box.email = lead?.customer_email
        job_box.updated_at = converted_datetime()

        const [update_job, update_project, new_tracker, new_notification] = await Promise.all([
            prisma.job.update({
                where: {job_id},
                data: job_box
            }),

            prisma.project.update({
                where: {project_id: job_exist.project[0].project_id },
                data: {
                    attached, structure_type, cover_size, end_cap_style, cover_color, trim_color, paperwork_upload, photo_upload,
                    updated_at: converted_datetime()
                }
            }),

            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'job_modification',
                    action_details: {
                        job_id: job_exist.job_id, time: converted_datetime(), modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Job Updated', job_id: job_exist.job_id,

                    message: `Job with Id ${job_exist.job_ind} updated successfully by ${user.first_name} ${user.last_name}.`,

                    view_by_admin: true, notification_type: 'job',

                    notification_source_id: user.user_id, notification_to_id: lead.lead_designer.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })

        ])

        return res.status(200).json({
            msg: "Job updated successfully",
            job: update_job
        })

    } catch (err:any) {
        console.log('Error occured while updating job details ', err);
        return res.status(500).json({err:'Error occured while updating job details ', error: err});
    }
}

export const delete_job = async(req: CustomRequest, res: Response)=>{
    try {
        
        const user = req.user

        if (user.user_role !== 'admin' || user.user_role !== 'super_admin') {
            return res.status(401).json({err: 'Not authorized to perform operation, refer to the admin!'})
        }

        const {job_id} = req.params

        const [job_exist, last_tracking, last_notification] = await Promise.all([
            prisma.job.findFirst({ 
                where: {job_id}, 
                select: {
                    job_ind: true, job_id: true, lead: {select: {lead_designer_id: true}}
                } 
            }),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({orderBy: {created_at: 'desc' }, select: {notification_ind: true} }),
        ])

        if (!job_exist) { return res.status(404).json({err: 'Job not found, check job id and try again!'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const [del_job, new_tracking, new_notification] =  await Promise.all([
            prisma.job.update({
                where: {job_id}, 
                data: {
                    deleted: true, updated_at: converted_datetime()
                }
            }),
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'job_modification',
                    action_details: {
                        job_id: job_exist.job_id, time: converted_datetime(), modification_type: 'delete'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Job Deleted', job_id: job_exist.job_id,

                    message: `Job with Id ${job_exist.job_ind} deleted by ${user.first_name} ${user.last_name}.`,

                    view_by_admin: true, notification_type: 'job',

                    notification_source_id: user.user_id, notification_to_id: job_exist.lead.lead_designer_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
            
        ])

        return res.status(200).json({
            msg: 'Job deleted successfully'
        })

    } catch (err:any) {
        console.log('Error occured while deleting job ', err);
        return res.status(500).json({err:'Error occured while deleting job ', error:err});
    }
}

export const edit_project = async(req: CustomRequest, res: Response)=>{

    const {attached, structure_type, cover_size, end_cap_style, cover_color, trim_color, description, paperwork_upload, photo_upload,} = req.body

    try {
        const {project_id} = req.params

        const [project_exist, last_tracking, last_notification] = await Promise.all([
            prisma.project.findFirst({where: {project_id}}),
            prisma.user_Tracking.findFirst({orderBy: {created_at: 'desc'}, select: {tracking_ind: true}}),
            prisma.notification.findFirst({orderBy: {created_at: 'desc'}, select: {notification_ind: true}})
        ])

        if (!project_exist) { return res.status(404).json({err: 'project not found, check project id provided'}) }

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;

        const update:any = {}

        if (attached && attached.trim() !== '') { update.attached = attached }

        if (structure_type && structure_type.trim() !== '') { update.structure_type = structure_type }

        if (cover_size && cover_size.trim() !== '') { update.cover_size = cover_size }

        if (end_cap_style && end_cap_style.trim() !== '') { update.end_cap_style = end_cap_style }

        if (cover_color && cover_color.trim() !== '') { update.cover_color = cover_color }

        if (trim_color && trim_color.trim() !== '') { update.trim_color = trim_color }

        if (description && description.trim() !== '') { update.description = description }

        if (paperwork_upload && !paperwork_upload.length ) { update.paperwork_upload = paperwork_upload }

        if (photo_upload && !photo_upload.length ) { update.photo_upload = photo_upload }

        update.updated_at = converted_datetime()



        const [update_project, new_tracker, new_notification] = await Promise.all([
            prisma.project.update({
                where: {project_id},
                data: update
            }),
            
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'project_modification',
                    action_details: {
                        project_id: project_exist.project_id, time: converted_datetime(), modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Project Updated', project_id: project_exist.project_id,

                    message: `Project with Id ${project_exist.project_id} updated successfully.`,

                    view_by_admin: true, notification_type: 'project',

                    notification_source_id: req.user.user_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(200).json({
            msg: 'Project updated successfully',
            project: update_project
        })

    } catch (err:any) {
        console.log('Error editing project', err);
        return res.status(500).json({err:'Error editing project', error:err});
        
    }
}


export const assign_service_ticket = async(req: CustomRequest, res: Response)=>{
    const {ticket_assignee_id} = req.body
    try {
        
        const user =  req.user

        const {ticket_id} = req.params

        if (!ticket_assignee_id) { return res.status(422).json({err: 'Service ticket assignee id is required '}) }

        const [ticket_exist, user_exist, last_tracking, last_notification] = await Promise.all([
            prisma.serviceTicket.findFirst({ where: {ticket_id}, select: {ticket_ind: true}}),
            prisma.user.findFirst({where: {user_id: ticket_assignee_id}, select: {user_id: true, user_ind: true}}),
            prisma.user_Tracking.findFirst({ orderBy: {created_at: 'desc'}, select: {tracking_ind: true} }),
            prisma.notification.findFirst({ orderBy: {created_at: 'desc'}, select: {notification_ind: true} }),
        ])

        if (!user_exist) {return res.status(404).json({err: 'User not found, check user id and try again'})}

        if (!ticket_exist) {return res.status(404).json({err: 'Service Ticket not found, check ticket id and try again'})}

        const last_notification_number = last_notification ? parseInt(last_notification.notification_ind.slice(2)) : 0;
        const new_notification_number = last_notification_number + 1;
        const new_notification_ind = `NT${new_notification_number.toString().padStart(4, '0')}`;

        const last_tracking_number = last_tracking ? parseInt(last_tracking.tracking_ind.slice(2)) : 0;
        const new_tracking_number = last_tracking_number + 1;
        const new_tracking_ind = `TR${new_tracking_number.toString().padStart(4, '0')}`;


        const update_ticket = await prisma.serviceTicket.update({
            where: {ticket_id},
            data: {
                ticket_assignee_id: ticket_assignee_id,
                ticket_assigner_id: req.user.user_id,
                updated_at: converted_datetime()
            },
            include: {
                ticket_creator: {select: {user_id: true, first_name: true, last_name: true, user_role: true}},
                ticket_assignee: {select: {user_id: true, first_name: true, last_name: true, user_role: true}},
                ticket_assigner: {select: {user_id: true, first_name: true, last_name: true, user_role: true}},
            }
        })

        await Promise.all([
            prisma.user_Tracking.create({
                data: {
                    tracking_ind: new_tracking_ind,
                    user: {connect: {user_id: req.user.user_id}},
                    action_type: 'ticket_modification',
                    action_details: {
                        ticket_id: update_ticket.ticket_id, time: update_ticket.updated_at, modification_type: 'update'
                    },
                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            }),
            
            prisma.notification.create({
                data: {
                    notification_ind: new_notification_ind, subject: 'Service Ticket Assigned', ticket_id: update_ticket.ticket_id,

                    message: `Service Ticket with Id ${update_ticket.ticket_ind} created by ${update_ticket.ticket_creator.first_name} ${update_ticket.ticket_creator.first_name} has been assiged to ${update_ticket.ticket_assignee?.first_name} ${update_ticket.ticket_assignee?.last_name} (${update_ticket.ticket_assignee?.user_role}).`,

                    view_by_admin: true,
                    notification_type: 'job',

                    notification_source_id: req.user.user_id, notification_to_id: update_ticket.ticket_assignee_id,

                    created_at: converted_datetime(), updated_at: converted_datetime(),
                }
            })
        ])

        return res.status(201).json({
            msg: 'Ticket Assigned successfully successfully',
            ticket: update_ticket
        })

    } catch (err:any) {
        console.log('Error occured while creating service ticket ', err);
        return res.status(500).json({err:'Error occured while creating service ticket ', error:err});
    }
}

export const all_paginated_service_ticket = async(req: CustomRequest, res: Response)=>{
    try {

        const {page_number} = req.params

        const [number_of_tickets, tickets ] = await Promise.all([

            prisma.serviceTicket.count({}),

            prisma.serviceTicket.findMany({
                include: {
                    project: true
                },

                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } 
            }),

        ])
        
        const number_of_ticket_pages = (number_of_tickets <= 15) ? 1 : Math.ceil(number_of_tickets / 15)

        return res.status(200).json({ total_number_of_tickets: number_of_tickets, total_number_of_pages: number_of_ticket_pages, tickets })

    } catch (err:any) {
        console.log('Error occured while fetching all service ticket',err);
        return res.status(500).json({err:'Error occured while fetching all service ticket',error:err});
    }
}