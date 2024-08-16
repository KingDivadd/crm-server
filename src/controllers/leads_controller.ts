import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import converted_datetime from '../helpers/date_time_elemets'


export const create_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {customer_name, address, phone_number, email, gate_code, assigned_to_id, appointment_date, disposition} = req.body
    try {

        const [lead_exist, last_lead,  last_pipeline] = await Promise.all([
            prisma.lead.findFirst({ where: {email: req.body.email} }),
            prisma.lead.findFirst({ orderBy: {created_at: 'desc'}}),
            prisma.sales_Pipeline.findFirst({ orderBy: {created_at: 'desc'}})
        ]) 

        if (lead_exist){return res.status(400).json({err: 'Lead with selected email already exist.'})}

        const last_lead_number = last_lead ? parseInt(last_lead.lead_ind.slice(2)) : 0;
        const new_lead_number = last_lead_number + 1;
        const new_lead_ind = `LD${new_lead_number.toString().padStart(4, '0')}`;
        req.body.lead_ind = new_lead_ind

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        const new_lead = await prisma.lead.create({
            data: {
                ...req.body,
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        const new_sales_pipeline = await prisma.sales_Pipeline.create({
            data: {
                pipeline_ind: new_pipeline_ind,
                lead_id: new_lead.lead_id, 
                disposition: disposition, 
                status: 'INITIAL_CONTACT',
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        });

        return res.status(201).json({msg: "Lead and Sales Pipeline created successfully", lead: new_lead, pipeline: new_sales_pipeline});

    } catch (err:any) {
        console.log('Error occured while creating lead', err);
        return res.status(500).json({err: 'Error occured while creating lead ', error: err})
    }
}

export const update_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {customer_name, address, phone_number, email, gate_code, assigned_to_id, appointment_date, disposition} = req.body
    try {
        const {lead_id} = req.params

        const [updated_lead, pipeline, last_pipeline] = await Promise.all([
            prisma.lead.update({
                where: {lead_id},
                data: {
                    ...req.body,
    
                    updated_at: converted_datetime()
                }
            }),
            prisma.sales_Pipeline.findFirst({ where: {lead_id}}),
            prisma.sales_Pipeline.findFirst({ orderBy: {created_at: 'desc'}})
        ])

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        if (pipeline){
            const updated_pipeline = await prisma.sales_Pipeline.update({
                where: { pipeline_id: pipeline.pipeline_id },
                data: {
                    disposition: disposition ?? pipeline.disposition,  // Update disposition if provided
                    updated_at: converted_datetime()
                }
            });

            return res.status(200).json({ msg: "Lead and Sales Pipeline updated successfully", lead: updated_lead, pipeline: updated_pipeline });
        }

        const new_sales_pipeline = await prisma.sales_Pipeline.create({
            data: {
                pipeline_ind: new_pipeline_ind,
                lead_id: lead_id, 
                disposition: disposition, 
                status: 'NEGOTIATION',
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        });



        return res.status(201).json({msg: "Lead and pipeline created successfully", lead: update_lead, pipeline: new_sales_pipeline})

    } catch (err:any) {
        console.log('Error occured while updating lead', err);
        return res.status(500).json({err: 'Error occured while updating lead ', error: err})
    }
}

export const leads = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const leads_without_jobs = await prisma.lead.findMany({
            where: {
                job: {
                    none: {}, // This means no jobs are associated with the lead
                },
            },
            include: { assigned_to: true },
        });

        return res.status(200).json({ nbHit: leads_without_jobs.length, leads: leads_without_jobs });
    } catch (err: any) {
        console.log('Error occurred while fetching leads without jobs ', err);
        return res.status(500).json({ err: 'Error occurred while fetching leads without jobs', error: err });
    }
};


export const all_lead = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_leads, leads] = await Promise.all([

            prisma.lead.count({}),
            prisma.lead.findMany({ include: {assigned_to: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_leads_pages = (number_of_leads <= 15) ? 1 : Math.ceil(number_of_leads / 15)

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
            prisma.lead.findMany({ include: {assigned_to: true, designer: true, job: true, sales: true}, skip: (Math.abs(Number(page_number)) - 1) * 10, take: 10, orderBy: { created_at: 'desc'  } }),

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

export const delete_lead = async(req: CustomRequest, res: Response,next: NextFunction)=>{
    try {
        
        const {lead_id} = req.params

        const lead_exist = await prisma.lead.findUnique({ where: {lead_id }} )

        if (!lead_exist){ return res.status(404).json({err: 'Lead not found'})}

        const delete_lead = await prisma.lead.delete({ where: {lead_id} })

        return res.status(200).json({msg: 'Lead deleted successfully'})

    } catch (err:any) {
        console.log('Error occured while deleting lead ', err);
        return res.status(500).json({err: 'Error occured while deleting lead ', error: err})
    }
}

// ------------------------------------------------------------------------------------------

//Sales personnel are allowed to create lead
export const create_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {contract_amount, contract_date, hoa_status, engineering_submitted, engineering_received, permit_sent_date, permit_approved_date, lead_id, engineering_status, cover_size, cover_color, permit_status} = req.body
    try {

        // check lead disposition status

        const [lead, job, pipeline, last_job, last_pipeline] = await Promise.all([
            prisma.lead.findUnique({ where: {lead_id} }),
            prisma.job.findFirst({where: {lead_id}}),
            prisma.sales_Pipeline.findFirst({where: {lead_id}}),
            prisma.job.findFirst({orderBy: {created_at: 'desc'}}),
            prisma.sales_Pipeline.findFirst({orderBy: {created_at: 'desc'}})
        ]) 

        if (job){ return res.status(400).json({err: 'A job is already created for selected lead!'})}

        if (!lead) { return res.status(404).json({err: 'lead not found, check lead id'}) }

        if (lead.disposition == 'NOT_SOLD'){ return res.status(400).json({err: 'Selected lead not sold yet.'}) }

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;

        const last_job_number = last_job ? parseInt(last_job.job_ind.slice(2)) : 0;
        const new_job_number = last_job_number + 1;
        const new_job_ind = `JB${new_job_number.toString().padStart(4, '0')}`;


        const new_job = await prisma.job.create({
            data: {
                job_ind: new_job_ind, lead: {connect: {lead_id}}, contract_amount: Number(contract_amount.replace(/,/g,'')), contract_date, cover_color, cover_size, engineering_received_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_received, engineering_status, engineering_submit_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_submitted, hoa_status: hoa_status, permit_approval_date: permit_status == 'NOT_REQUIRED' ? "": permit_approved_date, permit_submit_date: permit_status == 'NOT_REQUIRED' ? "": permit_sent_date, permit_status, updated_at: converted_datetime(), created_at: converted_datetime()
            }
        })

        if (!new_job){
            return res.status(500).json({err: 'Job was not created successfully.'})
        }

        let updated_pipeline;
        updated_pipeline = await prisma.sales_Pipeline.update({
            where: { pipeline_id: pipeline?.pipeline_id },
            data: {
                job_id: new_job.job_id,
                contract_amount: Number(contract_amount),  // Update disposition if provided
                updated_at: converted_datetime()
            }
        })

        if (!pipeline){
            updated_pipeline = await prisma.sales_Pipeline.create({
                data: {
                    pipeline_ind: new_pipeline_ind,
                    lead_id: new_job.lead_id,
                    job_id: new_job.job_id,
                    contract_amount: Number(contract_amount),  // Update disposition if provided
                    updated_at: converted_datetime(),
                    created_at: converted_datetime()
                }
            })
        }
        
        return res.status(201).json({msg: "Job created successfully", job:new_job, pipeline: updated_pipeline})


    } catch (err:any) {
        console.log('Error occured while creating job', err);
        return res.status(500).json({err: 'Error occured while creating job ', error: err})
    }
}

export const edit_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {contract_amount, contract_date, hoa_status, engineering_submitted, engineering_received, permit_sent_date, permit_approved_date, lead_id, engineering_status, cover_size, cover_color, permit_status} = req.body
    try {

        // check lead disposition status
        const {job_id} = req.params


        const [job_exist, lead, pipeline, last_pipeline] = await Promise.all([
            prisma.job.findUnique({ where: {job_id} }),
            prisma.lead.findUnique({ where: {lead_id} }),
            prisma.sales_Pipeline.findFirst({ where: {lead_id} }),
            prisma.sales_Pipeline.findFirst({orderBy: {created_at: 'desc'}})
        ]) 

        if (!job_exist) {
            return res.status(404).json({err: 'Job not found'})
        }

        if (!lead) { return res.status(404).json({err: 'lead not found, check lead id'}) }

        if (lead.disposition == 'NOT_SOLD'){ return res.status(400).json({err: 'Selected lead not sold yet.'}) }

        const last_pipeline_number = last_pipeline ? parseInt(last_pipeline.pipeline_ind.slice(2)) : 0;
        const new_pipeline_number = last_pipeline_number + 1;
        const new_pipeline_ind = `PL${new_pipeline_number.toString().padStart(4, '0')}`;


        const new_job = await prisma.job.update({
            where: {job_id},
            data: {
                lead: {connect: {lead_id: lead_id}},
                
                contract_amount: Number(contract_amount.replace(/,/g,'')), contract_date, cover_color, cover_size, engineering_received_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_received, engineering_status, engineering_submit_date: engineering_status == 'NOT_REQUIRED' ? '' : engineering_submitted, hoa_status: hoa_status, permit_approval_date: permit_status == 'NOT_REQUIRED' ? "": permit_approved_date, permit_submit_date: permit_status == 'NOT_REQUIRED' ? "": permit_sent_date, permit_status, updated_at: converted_datetime(), created_at: converted_datetime()
            }
        })
      
        let new_pipeline;
        if (pipeline) {
            new_pipeline = await prisma.sales_Pipeline.update({
                where: { pipeline_id: pipeline?.pipeline_id },
                data: {
                    job_id: job_id,
                    contract_amount: Number(contract_amount),  // Update disposition if provided
                    updated_at: converted_datetime()
                }
            })

        }else{
            await prisma.sales_Pipeline.create({
                data: {
                    pipeline_ind: new_pipeline_ind,
                    lead_id: new_job.lead_id,
                    job_id: new_job.job_id,
                    contract_amount: Number(contract_amount),  // Update disposition if provided
                    updated_at: converted_datetime(),
                    created_at: converted_datetime()
                }
            })
        }
       
        return res.status(200).json({ msg: "Job and Sales Pipeline updated successfully" });


    } catch (err:any) {
        console.log('Error occured while updating jobs', err);
        return res.status(500).json({err: 'Error occured while updating jobs ', error: err})
    }
}

export const jobs = async(req: CustomRequest, res: Response)=>{
    try {
        
        const all_jobs = await prisma.job.findMany({
            include: {lead: true}, orderBy: {job_ind: 'desc'}
        })

        return res.status(200).json({nbHit: all_jobs.length, jobs: all_jobs})

    } catch (err:any) {
        console.log('Error occured while fetching all jobs');
        return res.status(500).json({err: 'Error occured while fetching all jobs'})
    }
}

export const all_jobs = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {

        const {page_number} = req.params

        const [number_of_jobs, jobs] = await Promise.all([

            prisma.job.count({}),
            prisma.job.findMany({ include: {lead: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_jobs_pages = (number_of_jobs <= 15) ? 1 : Math.ceil(number_of_jobs / 15)

        return res.status(200).json({
            msg: 'All Jobs ', 
            total_number_of_jobs: number_of_jobs,
            total_number_of_jobs_pages: number_of_jobs_pages,
            jobs: jobs,
        })
        
    } catch (err:any) {
        console.log('Error occured while fetching all jobs ', err);
        return res.status(500).json({err: 'Error occured while fetching all jobs ', error: err})
    }
}

export const delete_job = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        if (req.user.user_role !== 'admin'){ return res.status(401).json({err: `You're not authorized to delete job, contact the admin.`}) }

        const {job_id} = req.params

        const job_exist = await prisma.job.findUnique({where: {job_id}})

        if (!job_exist) { return res.status(404).json({err: 'Job not found'}) }

        const del_job = await prisma.job.delete({where: {job_id}})

        return res.status(200).json({msg: 'Selected Job deleted successfully'})
        
    } catch (err:any) {
        console.log('Error occured while deleting job ', err);
        return res.status(500).json({err: 'Error occured while deleting job ', error: err})
    }
}

// -----------------------------TASKS

export const create_task = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {job_id, description, status, start_date, due_date, note, assigned_to} = req.body
    try {
        
        if (req.user.user_role !== 'operation'){ return res.status(401).json({err: `You're not authorized to create task.`}) }

        const last_task = await prisma.task.findFirst({orderBy: {created_at: "desc"}})

        const last_task_number = last_task ? parseInt(last_task.task_ind.slice(2)) : 0;
        const new_task_number = last_task_number + 1;
        const new_task_ind = `TS${new_task_number.toString().padStart(4, '0')}`;
        
        const new_task = await prisma.task.create({
            data: {
                task_ind: new_task_ind, job_id, description, start_date, due_date, note, status, assigned_to,
                created_at: converted_datetime(),
                updated_at: converted_datetime()
            }
        })

        return res.status(201).json({msg: 'Task created successfully ', task: new_task })
        
    } catch (err:any) {
        console.log('Error occured while creating task ', err);
        return res.status(500).json({err: 'Error occured while creating task ', error: err})
    }
}

export const edit_task = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    const {job_id, description, status, start_date, due_date, note, assigned_to} = req.body

    try {
        
        if (req.user.user_role !== 'operation'){ return res.status(401).json({err: `You're not authorized to perform this function.`}) }

        const {task_id} = req.params

        const new_task = await prisma.task.update({
            where: {task_id},
            data: {
                job_id, description, start_date, due_date, note, status, assigned_to,
                updated_at: converted_datetime()
            }
        })

        return res.status(201).json({msg: 'Task created successfully ', task: new_task })

        
    } catch (err:any) {
        console.log('Error occured while creating task ', err);
        return res.status(500).json({err: 'Error occured while creating task ', error: err})
    }
}

export const all_tasks = async(req: CustomRequest, res: Response)=>{
    try {
        
        const {page_number} = req.params

        const [number_of_tasks, tasks] = await Promise.all([

            prisma.task.count({}),
            prisma.task.findMany({ include: {job: true, created_by: true}, skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])

        const number_of_tasks_pages = (number_of_tasks <= 15) ? 1 : Math.ceil(number_of_tasks / 15)

        return res.status(200).json({
            msg: 'All Tasks ', 
            total_number_of_tasks: number_of_tasks,
            total_number_of_tasks_pages: number_of_tasks_pages,
            tasks: tasks,
        })

    } catch (err:any) {
        console.log('Error fetching all leads ', err);
        return res.status(500).json({err: 'Error fetching all lead ', error: err})
    }
}

// ------------------------------------------------------------------SALES PIPELINE PAGE--------------------------------------------------------

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

export const job_contract_overview = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_jobs, jobs ] = await Promise.all([

            prisma.job.count({}),
            prisma.job.findMany({ include: {customer: true, sale: true, lead: true}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_jobs_pages = (number_of_jobs <= 15) ? 1 : Math.ceil(number_of_jobs / 15)

        return res.status(200).json({ total_number_of_jobs: number_of_jobs, total_number_of_jobs_pages: number_of_jobs_pages, jobs: jobs, })

    } catch (err: any) {
        console.log('Error occured while fetching job page ', err);
        return res.status(200).json({err: 'Error occured while fetching job page ', error: err})
    }
}

export const project_information = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_project_information, projects ] = await Promise.all([

            prisma.project.count({}),
            prisma.project.findMany({ include: {sale: true, job: true}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_project_information_pages = (number_of_project_information <= 15) ? 1 : Math.ceil(number_of_project_information / 15)

        return res.status(200).json({ total_number_of_project: number_of_project_information, 
            total_number_of_project_information_pages: number_of_project_information_pages, projects: projects })

    } catch (err: any) {
        console.log('Error occured while fetching project information ', err);
        return res.status(200).json({err: 'Error occured while fetching project information.', error: err})
    }
}

export const installation_overview = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_project_tracking, project_tracking ] = await Promise.all([

            prisma.installation.count({}),
            prisma.installation.findMany({ include: {user: true, job: true}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_project_tracking_pages = (number_of_project_tracking <= 15) ? 1 : Math.ceil(number_of_project_tracking / 15)

        return res.status(200).json({ total_number_of_project_tracking: number_of_project_tracking, 
            total_number_of_project_tracking_pages: number_of_project_tracking_pages, project_tracking: project_tracking })

    } catch (err: any) {
        console.log('Error occured while fetching project tracking data ', err);
        return res.status(200).json({err: 'Error occured while fetching project tracking data ', error: err})
    }
}

export const tasks = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const {page_number} = req.params

        const [number_of_tasks, tasks ] = await Promise.all([

            prisma.task.count({}),
            prisma.task.findMany({ include: {created_by: true,}, 
                skip: (Math.abs(Number(page_number)) - 1) * 15, take: 15, orderBy: { created_at: 'desc'  } }),

        ])
        
        const number_of_task_pages = (number_of_tasks <= 15) ? 1 : Math.ceil(number_of_tasks / 15)

        return res.status(200).json({ total_number_of_tasks: number_of_tasks, 
            total_number_of_tasks_pages: number_of_task_pages, tasks: tasks })

    } catch (err: any) {
        console.log('Error occured while fetching task data ', err);
        return res.status(200).json({err: 'Error occured while fetching task data', error: err})
    }
}
