import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,workers:1,timeout:30000,reporter:'list',use:{baseURL:process.env.REPUTATION_TEST_ORIGIN || 'http://127.0.0.1:3000',channel:'chrome',headless:true,trace:'retain-on-failure'},outputDir:'test-results'});
