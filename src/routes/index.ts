import express from 'express'

// file imports

import {admin_complete_signup, admin_signup, generate_user_otp, reset_password, signup_generate_user_otp, 
    user_login, verify_user_otp,
    all_users,
    filter_users,
    update_user_data,
    logged_in_admin,
    resend_otp,
    get_user_info,
    main_sales_dashboard} from '../controllers/authentication'

import {admin_edit_user_validation, admin_setup_validation, admin_signup_validation, create_job_validation, create_lead_validation, create_task_validation, create_user_validation, edit_user_active_status_validation, forget_password_validation, generate_otp_validation , login_validation, update_settings_validation, update_user_validation, verify_otp_validation} from '../validations/index'

import {email_exist, validate_admin_access, verify_auth_id, verify_otp} from '../helpers/auth_helper'

import {test_connection, test_db_connection} from "../controllers/test_server_connection"

import { admin_change_user_data, admin_delete_user_data, all_sales_staff, change_user_activity_status, create_new_user } from '../controllers/user_controller'
import { all_activity } from '../controllers/activity_controller'
import { all_notification, all_task_notification, filter_task_notification } from '../controllers/notification_controller'
import { all_jobs, all_lead, all_pipeline, all_tasks, create_job, create_lead, create_task, delete_job, delete_lead, edit_job, edit_task, filter_lead, installation_overview, job_contract_overview, jobs, leads, project_information, sales_pipeline_page, update_lead } from '../controllers/leads_controller'
import { get_settings_information, update_settings_information } from '../controllers/settings_controller'
import { sales_report_page_info } from '../controllers/report'



const router = express.Router()


// Authentication

router.route('/admin-signup').post(admin_signup_validation, email_exist , admin_signup)

router.route('/complete-admin-setup').patch(verify_auth_id, admin_setup_validation, admin_complete_signup, signup_generate_user_otp )

router.route('/generate-otp').post(generate_otp_validation, generate_user_otp)

router.route('/regenerate-otp').get(verify_auth_id, resend_otp)

router.route('/get-auth-status').get(verify_auth_id, get_user_info)

router.route('/verify-otp').post(verify_otp_validation, verify_otp, verify_user_otp)

router.route('/login').post(login_validation , user_login)

router.route('/forget-password').patch(forget_password_validation, verify_auth_id, reset_password )

router.route('/logged-in-admin/:page_number/:notification_page_number').get(verify_auth_id, logged_in_admin )


// User Management For Admin role alone

router.route('/all-users/:page_number').get(verify_auth_id, all_users )

router.route('/all-sales-staff').get(verify_auth_id, all_sales_staff)

router.route('/filter-users/:page_number').get(verify_auth_id, filter_users )

router.route('/create-user').post(validate_admin_access, create_user_validation, email_exist, create_new_user)

router.route('/admin-update-user-active-status').patch(validate_admin_access, edit_user_active_status_validation, change_user_activity_status )

router.route('/admin-update-user-data/:user_id').patch(validate_admin_access, admin_edit_user_validation, admin_change_user_data)

router.route('/update-profile-data').patch(verify_auth_id, update_user_validation, update_user_data)

router.route('/delete-user/:user_id').delete(validate_admin_access, admin_delete_user_data )

// Activity

router.route('/all-activities/:page_number').get(verify_auth_id, all_activity)

// Notification

router.route('/all-notifications/:page_number').get(verify_auth_id, all_notification)

router.route('/all-task-notifications/:page_number').get(verify_auth_id, all_task_notification)

router.route('/filter-task-notifications/:status/:page_number').get(verify_auth_id, filter_task_notification)

// Lead

router.route('/create-lead').post(verify_auth_id, create_lead_validation, create_lead)

router.route('/edit-lead/:lead_id').patch(verify_auth_id, create_lead_validation, update_lead)

router.route('/delete-lead/:lead_id').delete(verify_auth_id, delete_lead)

router.route('/all-leads/:page_number').get(verify_auth_id, all_lead)

router.route("/leads").get(verify_auth_id, leads)

router.route('/filter-leads/:disposition/:page_number').get(verify_auth_id, filter_lead)

// Job

router.route('/create-job').post(verify_auth_id, create_job_validation, create_job)

router.route('/edit-job/:job_id').patch(verify_auth_id, create_job_validation, edit_job)

router.route('/all-jobs/:page_number').get(verify_auth_id, all_jobs)

router.route('/jobs').get(verify_auth_id, jobs)

router.route('/delete-job/:job_id').delete(verify_auth_id, delete_job)

// Task

router.route('/create-task').post(verify_auth_id, create_task_validation, create_task)

router.route('/edit-task/:task_id').patch(verify_auth_id, create_task_validation, edit_task)

router.route('/all-tasks/:page_number').get(verify_auth_id, all_tasks)

// Sales Pipeline

router.route('/all-pipeline/:page_number').get(verify_auth_id, all_pipeline )

// Sales Report

router.route('/report-dashboard/:page_number').get(verify_auth_id, sales_report_page_info)

// Test route

router.route('/test-connection').get(test_connection)

router.route('/test-db-connection').get(test_db_connection)

// Settins

router.route('/settings-info').get(verify_auth_id, get_settings_information)

router.route('/update-settings-info').patch(verify_auth_id, update_settings_validation, update_settings_information)

// Sales Department

router.route('/sales-main-dashboard').get(verify_auth_id, main_sales_dashboard)

router.route('/sales-pipeline/:page_number').get(verify_auth_id, sales_pipeline_page)

router.route('/job-contract-details/:page_number').get(verify_auth_id, job_contract_overview)

router.route('/project-information/:page_number').get(verify_auth_id, project_information)

router.route('/project-progress-tracking/:page_number').get(verify_auth_id, installation_overview)







export default router