import { NumberLiteralType } from "typescript";

function converted_datetime(milliseconds?: number | string): number {
    let currentDateInMillis: number;
    
    if (milliseconds) {
        currentDateInMillis = typeof milliseconds === 'string' ? parseFloat(milliseconds) : milliseconds;
    } else {
        currentDateInMillis = new Date().getTime();
    }

    return currentDateInMillis;
}

export default converted_datetime;


export function readableDate(ms:number) {
    const date = new Date(ms * 1000);

    // Format the date and time
    const options:any = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
    };
    const readableDate = date.toLocaleString('en-US', options);
    return readableDate;
}
