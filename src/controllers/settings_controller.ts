import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import { salt_round } from '../helpers/constants'
const bcrypt = require('bcrypt')



export const get_settings_information = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user = req.user        
        
        // if admin
        if (user.user_role == 'admin') {
            
            const [user_info, company_info] = await Promise.all([

                prisma.user.findUnique({ where: {user_id: user.user_id} }),

                prisma.company.findUnique({ where: {company_id: user.company_id} }),

            ])

            return res.status(200).json({msg: 'Fetched Admin Settings information ', user: user_info, company: company_info})
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
