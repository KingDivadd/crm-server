import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'



export const get_settings_information = async(req: CustomRequest, res: Response, next: NextFunction)=>{
    try {
        const user = req.user

        console.log(user);
        
        
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