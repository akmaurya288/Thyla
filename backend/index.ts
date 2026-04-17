import { createServerApp } from './api/server';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

createServerApp(PORT).catch(console.error);
