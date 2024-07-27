import express from 'express'

// file imports

import {admin_complete_signup, admin_signup, generate_user_otp, reset_password, signup_generate_user_otp, 
    user_login, verify_user_otp,
    all_users,
    filter_users,
    update_user_data,
    logged_in_admin,
    resend_otp,
    get_user_info} from '../controllers/authentication'

import {admin_edit_user_validation, admin_setup_validation, admin_signup_validation, create_user_validation, edit_user_active_status_validation, forget_password_validation, generate_otp_validation , login_validation, update_user_validation, verify_otp_validation} from '../validations/index'

import {email_exist, validate_admin_access, verify_auth_id, verify_otp} from '../helpers/auth_helper'

import {test_connection, test_db_connection} from "../controllers/test_server_connection"

import { admin_change_user_data, admin_delete_user_data, change_user_activity_status, create_new_user } from '../controllers/user_controller'
import { all_activity } from '../controllers/activity_controller'
import { all_notification, all_task_notification, filter_task_notification } from '../controllers/notification_controller'
import { all_lead, filter_lead } from '../controllers/leads_controller'
import { get_settings_information } from '../controllers/settings_controller'



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

router.route('/all-leads/:page_number').get(verify_auth_id, all_lead)

router.route('/filter-leads/:disposition/:page_number').get(verify_auth_id, filter_lead)


// Test route

router.route('/test-connection').get(test_connection)

router.route('/test-db-connection').get(test_db_connection)

// Settins

router.route('/settings-info').get(verify_auth_id, get_settings_information)



export default router