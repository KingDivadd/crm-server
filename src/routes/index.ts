import express from 'express'


import {main_electrical_dashboard, project_invoice_upload, project_photo_upload} from "../controllers/electrical_porter"
import {all_paginated_job_permits, create_new_redline, edit_project_inspection, edit_redline, main_permit_dashboard} from "../controllers/permit_porter"
import {close_rfi, create_rfi, edit_rfi, main_engineering_dashboard } from '../controllers/engineering_porter'
import { main_designer_dashboard,} from '../controllers/designer_porter'
import { create_new_invoice, edit_invoice, main_accounting_dashboard} from '../controllers/accounting_porter'
import {all_paginated_invoice, all_paginated_payments, create_service_ticket, customer_main_dashbaord, edit_service_ticket, make_new_payment} from '../controllers/customer_porter'
import { add_install_material, add_project_installs, edit_install_material, edit_project_installs, main_installer_dashboard} from "../controllers/installer_porter"
import {all_notification, get_settings_information, update_notification, update_settings_information} from "../controllers/general"
import { email_exist, verify_auth_id, verify_otp } from '../helpers/auth_helper'
import { admin_complete_signup, admin_signup, app_user_exist, generate_user_otp, resend_otp, reset_password, signup_generate_user_otp, user_login, logged_in_user, verify_user_otp } from '../controllers/authentication'
import { admin_edit_user_validation, admin_setup_validation, admin_signup_validation, job_validation, create_user_validation, lead_validation, login_validation, reset_password_validation, update_settings_validation, edit_project_validation, install_validation, material_validation, payment_validation, invoice_validation, service_ticket_validation, rfi_validation, red_line_validation, project_inspection_validation, project_photo_validation, project_invoice_validation, project_job_description_validation, lead_contract_validation,  } from '../validations'
import { add_new_user, admin_main_dashboard, all_designers, all_paginated_users, delete_user, edit_user_data } from '../controllers/admin_porter'
import { add_new_lead, all_lead, all_paginated_jobs, all_paginated_leads, all_paginated_projects, all_paginated_service_ticket, all_paginated_staff_pipeline, all_sales_user, assign_service_ticket, create_new_job, delete_job, delete_lead, edit_job, edit_lead, edit_lead_contract_document, edit_project, main_sales_dashboard } from '../controllers/sales_porter'



const router = express.Router()

// Authentication

router.route('/count-user').get(app_user_exist)

router.route('/admin-signup').post(admin_signup_validation, email_exist, admin_signup)

router.route('/complete-signup').patch(verify_auth_id, admin_setup_validation, admin_complete_signup, signup_generate_user_otp)

router.route('/login').post(login_validation, user_login)

router.route('/logged-in-user').get(verify_auth_id, logged_in_user)

router.route('/signup-generate-user-otp').get(verify_auth_id, signup_generate_user_otp)

router.route('/generate-user-otp').post(generate_user_otp)

router.route('/resend-otp').get(verify_auth_id, resend_otp)

router.route('/verify-user-otp').post(verify_otp, verify_user_otp)

router.route('/reset-password').patch(verify_auth_id, reset_password_validation, reset_password )

// Admin Porter

router.route('/admin-dashboard').get(verify_auth_id, admin_main_dashboard)

router.route('/all-paginated-users/:page_number').get(verify_auth_id, all_paginated_users)

router.route('/all-designers').get(verify_auth_id, all_designers)

router.route('/create-user').post(verify_auth_id, create_user_validation, email_exist, add_new_user)

router.route('/update-user-data/:user_id').patch(verify_auth_id, admin_edit_user_validation, email_exist, edit_user_data)

router.route('/delete-user/:user_id').delete(verify_auth_id, delete_user)


// SALES PORTER

router.route('/sales-dashboard').get(verify_auth_id, main_sales_dashboard)

router.route('/all-sales-user').get(verify_auth_id, all_sales_user)

// Lead

router.route('/all-lead').get(verify_auth_id, all_lead)

router.route('/all-paginated-leads/:page_number').get(verify_auth_id, all_paginated_leads)

router.route('/sold-lead').get(verify_auth_id, all_lead)

router.route('/new-lead').post(verify_auth_id, lead_validation, email_exist, add_new_lead )

router.route('/edit-lead/:lead_id').patch(verify_auth_id, lead_validation, edit_lead )

router.route('/delete-lead/:lead_id').delete(verify_auth_id, delete_lead )

// Job

router.route('/all-paginated-jobs/:page_number').get(verify_auth_id, all_paginated_jobs)

router.route('/all-paginated-project/:page_number').get(verify_auth_id, all_paginated_projects )

router.route('/create-job').post(verify_auth_id, job_validation, create_new_job)

router.route('/edit-job/:job_id').patch(verify_auth_id, job_validation, edit_job)

router.route('/delete-job/:job_id').delete(verify_auth_id, delete_job)

router.route('/edit-project/:project_id').patch(verify_auth_id, edit_project_validation, edit_project )

router.route('/all-paginated-service-ticket/:page_number').get(verify_auth_id, all_paginated_service_ticket )

router.route('/service-ticket-assignment/:ticket_id').patch(verify_auth_id, assign_service_ticket )

router.route('/all-paginated-staff-pipeline/:page_number').get(verify_auth_id, all_paginated_staff_pipeline)


// Designer / Operation Porter

router.route('/designer-dashboard').get(verify_auth_id, main_designer_dashboard)

router.route("/upload-lead-contract-document/:lead_id").patch(verify_auth_id, lead_contract_validation , edit_lead_contract_document)

// router.route('/edit-job/:job_id').patch(verify_auth_id, job_validation, edit_job)


// Installer Porter

router.route('/installer-dashboard').get(verify_auth_id, main_installer_dashboard )

// router.route('/all-paginated-jobs/:page_number').get(verify_auth_id, all_paginated_jobs)

// router.route('/all-paginated-project/:page_number').get(verify_auth_id, all_paginated_projects )

router.route('/add-project-install/:project_id').post(verify_auth_id, install_validation, add_project_installs)

router.route('/edit-project-install/:install_id').post(verify_auth_id, install_validation, edit_project_installs)

router.route('/add-materials-ordered/:install_id').post(verify_auth_id, material_validation, add_install_material)

router.route('/edit-materials-ordered/:install_id/:material_id').post(verify_auth_id, material_validation, edit_install_material)


// Customer Porter

router.route('/customer-dashboard').get(verify_auth_id, customer_main_dashbaord )

router.route('/all-paginated-invoice').get(verify_auth_id, all_paginated_invoice)

router.route('/make-payment/:invoice_id').post(verify_auth_id, payment_validation, make_new_payment)

router.route('/all-paginated-payment').get(verify_auth_id, all_paginated_payments)

router.route('/create-service-ticket/:project_id').post(verify_auth_id, service_ticket_validation, create_service_ticket )

router.route('/edit-service-ticket/:ticket_id/:project_id').post(verify_auth_id, service_ticket_validation, edit_service_ticket )


// Engineering Porter

router.route('/engineering-dashboard').get(verify_auth_id, main_engineering_dashboard )

router.route('/create-rfi').post(verify_auth_id, rfi_validation, create_rfi)

router.route('/edit-rfi/:rfi_id').patch(verify_auth_id, rfi_validation, edit_rfi)

router.route('/close-rfi/:rfi_id').patch(verify_auth_id, close_rfi )

// Permit Porter

router.route('/permit-dashboard').get(verify_auth_id, main_permit_dashboard )

router.route('/all-paginated-job-permits/:page_number').get(verify_auth_id, all_paginated_job_permits)

router.route('/create-redline').post(verify_auth_id, red_line_validation, create_new_redline )

router.route('/edit-redline/:redline_id').patch(verify_auth_id, red_line_validation, edit_redline )

router.route('/inspect-project/:project_id').patch(verify_auth_id, project_inspection_validation, edit_project_inspection )



// Electrical Porter

router.route('/electrical-dashboard').get(verify_auth_id, main_electrical_dashboard )

// router.route('/all-paginated-service-ticket/:page_number').get(verify_auth_id, all_paginated_service_ticket )

router.route('/project-invoice-upload/:project_id').patch(verify_auth_id, project_invoice_validation, project_invoice_upload )

router.route('/project-photo-upload/:project_id').patch(verify_auth_id, project_photo_validation, project_photo_upload )

router.route('/project-job-description/:project_id').patch(verify_auth_id, project_job_description_validation, project_photo_upload )



// HR/Accounting Porter

router.route('/accounting-dashboard').post(verify_auth_id, main_accounting_dashboard)

router.route('/create-invoice').post(verify_auth_id, invoice_validation, create_new_invoice )

router.route('/edit-invoice/:invoice_id').patch(verify_auth_id, invoice_validation, edit_invoice )

// General

router.route('/settings-info').get(verify_auth_id, get_settings_information)

router.route('/update-settings-info').patch(verify_auth_id, update_settings_validation, update_settings_information)

router.route('/all-notifications/:page_number').get(verify_auth_id, all_notification)

router.route('/update-notification-status/:notification_id').patch(verify_auth_id, update_notification)


export default router