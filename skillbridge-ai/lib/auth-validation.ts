import {z} from 'zod';
export const registerSchema=z.object({name:z.string().trim().min(2).max(60),email:z.string().trim().email().max(254).transform(s=>s.toLowerCase()),password:z.string().min(10).max(128).regex(/[a-zA-Z]/,'Include a letter').regex(/[0-9]/,'Include a number')});
export const loginSchema=z.object({email:z.string().trim().email().max(254).transform(s=>s.toLowerCase()),password:z.string().min(1).max(128)});
