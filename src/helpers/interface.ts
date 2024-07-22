import { Document, PopulatedDoc } from "mongoose";

export interface CustomRequest {
    params?:any;
    user?: any;
    headers?: any;
    body?: any;
    user_email?:string;
}


export interface UserInterface {
    
}
export interface Media {
    media_name: string;
    media_type: string;
    media_url: string;
}

