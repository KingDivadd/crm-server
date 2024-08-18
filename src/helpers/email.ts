import nodemailer from 'nodemailer'
import { email_passowrd, email_username } from './constants';


export const created_user_welcome_mail = (user:any, otp:string) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome and Email Verification</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to CRM Web App, ${user.first_name}!</h1>
                <p>Thank you for signing up to CRM Web App. We're excited to have you on board!</p>
                
                <p>As a new user, you now have access to a powerful set of tools to manage your customer relationships, streamline your workflows, and grow your business.</p>
                
                <p>Here are some quick tips to get you started:</p>
                <ul>
                    <li>Explore your dashboard to get an overview of your activities.</li>
                    <li>Check out our <a href="#">User Guide</a> for detailed instructions on how to make the most of your CRM.</li>
                    <li>If you need any assistance, visit our <a href="#">Help Center</a> or reach out to our support team.</li>
                </ul>

                <p>We're here to support you every step of the way. If you have any questions or need help, don't hesitate to contact us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>

                <hr style="border:none; border-top:1px solid #ddd; margin:20px 0;">
                
                <h1>Email Verification</h1>
                <p>Please use the verification code below to verify your email. You can complete your login with the OTP below.</p>
                
                <strong>One Time Password (OTP)</strong>
                <p><b>${otp}</b></p>

                <p>This code expires in 20 minutes and should only be used in-app. Do not click any links or share with anybody.</p>

                <p>If you didn’t attempt to register on CRM Web App, please change your password immediately to protect your account. For further assistance, contact us at <a href="mailto:iroegbu.dg@gmail.com">iroegbu.dg@gmail.com</a>.</p>

                <p>Need help, or have questions? Please visit our <a href="#">contact us page</a> or reply to this message.</p>
                
                <p>Welcome aboard!</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>




    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Activate Your New Account",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email}`.cyan.bold);
        }
    });

}

export const welcome_mail_messanger = (user:any,) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CRM Web App</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }

                ul {
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to CRM Web App, ${user.first_name}!</h1>
                <p>Thank you for signing up to CRM Web App. We're excited to have you on board!</p>
                
                <p>As a new user, you now have access to a powerful set of tools to manage your customer relationships, streamline your workflows, and grow your business.</p>
                
                <p>Here are some quick tips to get you started:</p>
                <ul>
                    <li>Explore your dashboard to get an overview of your activities.</li>
                    <li>Check out our <a href="#">User Guide</a> for detailed instructions on how to make the most of your CRM.</li>
                    <li>If you need any assistance, visit our <a href="#">Help Center</a> or reach out to our support team.</li>
                </ul>
                
                <p>We're here to support you every step of the way. If you have any questions or need help, don't hesitate to contact us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                
                <p>Welcome aboard!</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>



    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Activate Your New Account",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email}`.cyan.bold);
        }
    });

}

export const otp_messanger = (user:any, otp: string) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CRM Web App</title>
        <style>
            body {
                text-align: center;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }

            .container {
                display: inline-block;
                text-align: left;
                margin: 3px auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                max-width: 600px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            h1 {
                color: #333;
                text-align: center;
                margin: 0 0 20px 0;
            }

            p {
                color: #555;
                line-height: 1.6;
            }

            a {
                color: #0066cc;
                text-decoration: none;
            }

            ul {
                padding-left: 20px;
            }

            li {
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
        <h1>Email Verification</h1>
            <p>Hello, ${user.first_name},</p>
            <p>Please use the verification code below to verify your email. You can complete your login with the OTP below.</p>
            
            <strong>One Time Password (OTP)</strong>
            <p><b>${otp}</b></p>

            <p>This code expires in 20 minutes and should only be used in-app. Do not click any links or share with anybody.</p>

            <p>If you didn’t attempt to register on CRM Web App, please change your password immediately to protect your account. For further assistance, contact us at <a href="mailto:iroegbu.dg@gmail.com">iroegbu.dg@gmail.com</a>.</p>

            <p>Need help, or have questions? Please visit our <a href="#">contact us page</a> or reply to this message.</p>
        </div>
    </body>
    </html>


    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Activate Your New Account",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email} `.cyan.bold);
        }
    });

}

export const inactive_account_mail = (user:any) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Status Update</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Account Status Update, ${user.first_name}</h1>
                <p>Your account on CRM Web App has been set to <strong>inactive</strong>.</p>
                
                <p>If you believe this is a mistake or have any questions, please contact our support team for assistance.</p>
                
                <p>We're here to support you every step of the way. If you have any questions or need help, don't hesitate to contact us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                
                <p>Best Regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>



    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Account Status Update",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email} `.cyan.bold);
        }
    });

}

export const active_account_mail = (user:any,) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Status Update</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Account Status Update, ${user.first_name}</h1>
                <p>We are pleased to inform you that your account on CRM Web App has been set to <strong>active</strong>.</p>
                
                <p>You now have full access to all the features and tools available to help you manage your customer relationships, streamline your workflows, and grow your business.</p>
                
                <p>If you have any questions or need assistance, please visit our <a href="#">Help Center</a> or contact us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                
                <p>Best Regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>


    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Account Status Update",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email} `.cyan.bold);
        }
    });

}

export const admin_update_user_data_mail = (user:any,) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Data Update Notification</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Account Data Update, ${user.first_name}</h1>
                <p>We wanted to inform you that some of the data related to your account on CRM Web App has been updated by an admin.</p>
                
                <p>If you have any questions about the changes or if you believe this update was made in error, please contact our support team immediately for assistance.</p>
                
                <p>We're here to support you every step of the way. If you have any questions or need help, don't hesitate to contact us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                
                <p>Best Regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>



    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Profile Update",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email} `.cyan.bold);
        }
    });

}

export const admin_delete_user_data_mail = (user:any,) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deletion Notification</title>
            <style>
                body {
                    text-align: center;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    display: inline-block;
                    text-align: left;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 600px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    color: #333;
                    text-align: center;
                    margin: 0 0 20px 0;
                }

                p {
                    color: #555;
                    line-height: 1.6;
                }

                a {
                    color: #0066cc;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Account Deletion Notice, ${user.first_name}</h1>
                <p>We regret to inform you that your account on CRM Web App has been deleted by an admin.</p>
                
                <p>If you believe this deletion was a mistake or if you have any questions, please contact our support team immediately for assistance.</p>
                
                <p>We're here to support you every step of the way. If you have any questions or need help, don't hesitate to contact us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                
                <p>Best Regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>




    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: user.email,
        subject: "CRM: Account Removal Update",
        html: htmlContent,
        text: 'Welcome'
    };
    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to ${user.email} `.cyan.bold);
        }
    });

}

export const test_email = (receiver_email:string) => {

    console.log('here')
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: email_username,
            pass: email_passowrd
        }
    });

    const htmlContent = `
    <html> 
        <body>
            <h4> Hi John Doe </h4>
            <h3> Welcome to crm web app  </h3>
        </body>
    </html>
    `
    const mailOptions = {
        from: {
            name: "crm",
            address: 'iroegbu.dg@gmail.com'
        },
        to: receiver_email ,
        subject: "CRM: Activate Your New Account",
        html: htmlContent,
        text: 'Welcom'
    };

    

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent to John Doe with res code ${info.response}`.cyan.bold);
        }
    });

}



// Setup the email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email_username,
        pass: email_passowrd,
    },
});

// Email for when the lead is created
export const send_lead_created_email = (user: any) => {
    const html_content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Lead Has Been Created</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                h1 { color: #333; }
                p { color: #555; line-height: 1.6; }
                a { color: #0066cc; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Hi ${user.first_name}, Your Lead Has Been Created!</h1>
                <p>Thank you for your interest. Our team will follow up with you soon to discuss further details.</p>
                <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                <p>Best regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>
    `;

    const mail_options = {
        from: { name: "CRM", address: 'iroegbu.dg@gmail.com' },
        to: user.email,
        subject: "Lead Created",
        html: html_content,
        text: 'Your Lead Has Been Created',
    };

    transporter.sendMail(mail_options, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Lead created email sent to ${user.email}`.cyan.bold);
        }
    });
};

// Email for when the lead has been sold 
export const send_lead_sold_email = (user: any) => {
    const html_content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Lead Has Been Sold</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                h1 { color: #333; }
                p { color: #555; line-height: 1.6; }
                a { color: #0066cc; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Hi ${user.first_name}, Congratulations! Your Lead Has Been Sold!</h1>
                <p>Your lead has been successfully sold. Thank you for choosing us!</p>
                <p>Our team is now working on creating the project. We will notify you once the job has been created and provide further details on the next steps.</p>
                <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                <p>Best regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>
    `;

    const mail_options = {
        from: { name: "CRM", address: 'iroegbu.dg@gmail.com' },
        to: user.email,
        subject: "Lead Sold Notification",
        html: html_content,
        text: 'Congratulations! Your Lead Has Been Sold!',
    };

    transporter.sendMail(mail_options, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Lead sold email sent to ${user.email}`.cyan.bold);
        }
    });
};

export const send_job_created_email = (user: any) => {
    const html_content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Job Has Been Created</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                h1 { color: #333; }
                p { color: #555; line-height: 1.6; }
                a { color: #0066cc; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Hi ${user.first_name}, Your Job Has Been Created!</h1>
                <p>We are pleased to inform you that your job has been successfully created. Our operations team is now working on your project.</p>
                <p>You can log in to your customer portal to track the progress and view the status of your job.</p>
                <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                <p>Best regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>
    `;

    const mail_options = {
        from: { name: "CRM", address: 'iroegbu.dg@gmail.com' },
        to: user.email,
        subject: "Job Created Notification",
        html: html_content,
        text: 'Your Job Has Been Created!',
    };

    transporter.sendMail(mail_options, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Job created email sent to ${user.email}`.cyan.bold);
        }
    });
};


// Email for when the lead is marked as not sold
export const send_lead_not_sold_email = (user: any) => {
    const html_content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Lead Has Been Updated</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
                h1 { color: #333; }
                p { color: #555; line-height: 1.6; }
                a { color: #0066cc; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Hi ${user.first_name}, Unfortunately, Your Lead Was Not Converted</h1>
                <p>We regret to inform you that your lead did not result in a sale. However, we're still here to assist you if you have further questions or would like to explore other services.</p>
                <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@crmwebapp.com">support@crmwebapp.com</a>.</p>
                <p>Best regards,</p>
                <p>The CRM Web App Team</p>
            </div>
        </body>
        </html>
    `;

    const mail_options = {
        from: { name: "CRM", address: 'iroegbu.dg@gmail.com' },
        to: user.email,
        subject: "Lead Not Sold",
        html: html_content,
        text: 'Your Lead Was Not Converted',
    };

    transporter.sendMail(mail_options, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log(`Lead not sold email sent to ${user.email}`.cyan.bold);
        }
    });
};

