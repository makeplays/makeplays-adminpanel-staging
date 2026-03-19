import { toast } from 'sonner';
export const ToastDurationTime = 2000;
const defultVal_duration = ToastDurationTime;
const defultVal_delay = 100;
/**
 * Base function to show a toast of any type
 * @param {Object} props - The toast parameters.
 * @param {"success" | "error" | "info"} props.type - The type of toast.
 * @param {string} props.msg - The message to display.
 * @param {number} [props.duration] - Duration for toast display.
 * @param {number} [props.delay] - Delay before showing toast.
*/
export const CustomToastHandler = ({ type = "success", msg, duration = defultVal_duration, delay = defultVal_delay }) => {
    toast[type](msg, {
        duration,
        delay,
    });
};
