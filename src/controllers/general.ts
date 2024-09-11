import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import { salt_round } from '../helpers/constants'
import converted_datetime from '../helpers/date_time_elemets'
const bcrypt = require('bcrypt')



export const get_settings_information = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user = req.user        

        // if admin
        if (user.user_role == 'admin' || user.user_role == "super_admin") {
            
            const [user_info, company_info] = await Promise.all([

                prisma.user.findUnique({ where: {user_id: user.user_id} }),

                prisma.company.findUnique({ where: {company_id: user.company_id} }),

            ])
            
            
            return res.status(200).json({
                msg: 'Fetched Admin Settings information ', 
                user: user_info, 
                company: company_info
            })
        }else{
            const user_info = await prisma.user.findUnique({ where: {user_id: user.user_id} })

            return res.status(200).json({msg: 'Fetched User Settings information ', user: user_info,})
        }
        
    } catch (err:any) {
        console.log('Error occured while fetcing settins information : ', err);
        return res.status(500).json({err: 'Error occured while fetcing settins information : ', error: err});
        
    }
}


export const update_settings_information = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { company_logo, company_name, company_address, company_email, company_phone, number_of_admin, avatar, first_name, last_name, other_names, phone,  password  } = req.body;

    try {
        const user_id = req.user.user_id;

        let encrypted_password:string = '';
        if (password) {
            encrypted_password = await bcrypt.hash(password, salt_round);
        }

        const user = await prisma.user.findUnique({ where: { user_id } });

        if (user && user?.user_role === 'admin' && user.company_id) {
            const [updated_user, updated_company] = await Promise.all([
                prisma.user.update({
                    where: { user_id },
                    data: {
                        ...(avatar && { avatar }),
                        ...(first_name && { first_name }),
                        ...(last_name && { last_name }),
                        ...(other_names && { other_names }),
                        ...(phone && { phone_number: phone }),
                        ...(encrypted_password && { password: encrypted_password }),
                    },
                }),

                prisma.company.update({
                    where: { company_id: user.company_id },
                    data: {
                        ...(company_logo && { company_logo }),
                        ...(company_name && { company_name }),
                        ...(company_address && { company_address }),
                        ...(company_email && { company_email }),
                        ...(company_phone && { company_phone }),
                        ...(number_of_admin && { number_of_admin }),
                    },
                })
            ]);

            return res.status(200).json({ msg: 'Settings information updated successfully', updated_user, updated_company });
        } else {
            const updated_user = await prisma.user.update({
                where: { user_id: user?.user_id },
                data: {
                    ...(avatar && { avatar }),
                    ...(first_name && { first_name }),
                    ...(last_name && { last_name }),
                    ...(other_names && { other_names }),
                    ...(phone && { phone_number: phone }),
                    ...(encrypted_password && { password: encrypted_password }),
                },
            });

            return res.status(200).json({ msg: 'Settings information updated successfully', updated_user });
        }
    } catch (err: any) {
        console.error('Error occurred while updating settings information', err);
        return res.status(500).json({ err: 'Error occurred while updating settings information', error: err });
    }
};


export const all_notification = async(req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const user_id = req.user.user_id;
        const user_role = req.user.user_role; // Assuming user_role is part of the user object
        const {page_number} = req.params;

        const [number_of_notification, notification] = await Promise.all([

            prisma.notification.count({
                where: {
                    OR: [
                        { notification_to_id: user_id }, // User can see their notifications
                        { 
                            notification_to: { user_role: { not: 'customer' } }, // Admin can see all notifications except customers
                            AND: user_role.includes('admin') ? {} : { notification_to_id: user_id }
                        }
                    ]
                }
            }),

            prisma.notification.findMany({
                where: {
                    OR: [
                        { notification_to_id: user_id }, // User can see their notifications
                        { 
                            notification_to: { user_role: { not: 'customer' } }, // Admin can see all notifications except customers
                            AND: user_role.includes('admin') ? {} : { notification_to_id: user_id }
                        }
                    ]
                },
                include: {
                    notification_source: {select: {first_name: true, last_name: true, user_ind: true, user_role: true}}, 
                    notification_to: {select: {first_name: true, last_name: true, user_ind: true,}}, 
                    job: true,
                    lead: true,
                    project: true,
                    ticket: true,
                    rfi: true
                },
                skip: (Math.abs(Number(page_number)) - 1) * 15,
                take: 15,
                orderBy: { created_at: 'desc' }
            }),

        ]);

        const number_of_notification_pages = (number_of_notification <= 15) ? 1 : Math.ceil(number_of_notification / 15);

        return res.status(200).json({
            msg: 'All Notifications', 
            total_number_of_notifications: number_of_notification,
            total_number_of_notification_pages: number_of_notification_pages,
            notification: notification,
        });

    } catch (err: any) {
        console.log('Error occurred while fetching all task notifications ', err);
        return res.status(500).json({ err: 'Error occurred while fetching all task notifications', error: err });
    }
}

export const update_notification = async(req: CustomRequest, res: Response)=>{
    try {

        const user_id = req.user.user_id

        const {notification_id} = req.params

        const notification = await prisma.notification.findFirst({ where: {notification_id} })

        if (!notification) {
            return res.status(404).json({err: 'Notification not found'})
        }
        let readBy: string[] = Array.isArray(notification.read_by) ? notification.read_by as string[] : [];

        if (!readBy.includes(user_id)) {
            readBy.push(user_id);
        }

        // Update the notification with the new read_by array and read status
        const change_status = await prisma.notification.update({
            where: { notification_id },
            data: {
                read: true,  // Update the general read status if needed
                read_by: JSON.stringify(readBy),  // Save the updated read_by array
                updated_at: converted_datetime()  // Update the timestamp
            }
        });

        if (!change_status) {
            return res.status(400).json({ err: 'Unable to update notification.' });
        }

        return res.status(200).json({ msg: 'Notification updated successfully' });

    } catch (err: any) {
        console.log('Error while updating notification status', err);
        return res.status(500).json({ err: 'Error while updating notification status', error: err });
    }
};