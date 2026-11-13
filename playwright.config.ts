import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
export default defineConfig({testDir:'./tests',timeout:60000,use:{baseURL:'http://localhost:3010',browserName:'chromium',channel:'chrome',headless:true},webServer:{command:'npm run dev -- --port 3010',url:'http://localhost:3010',reuseExistingServer:true,timeout:120000},reporter:'list'});
