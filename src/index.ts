const api = require('@actual-app/api');
const fs = require('fs');
const { Command } = require('commander');
const dotenv = require('dotenv');

dotenv.config();

interface Account {
  id: string;
  name: string;
}

// Validate required environment variables
const requiredEnvVars = ['DATA_DIR', 'SERVER_URL', 'PASSWORD', 'SYNC_ID'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    console.error('Please set it in your .env file or as an environment variable');
    process.exit(1);
  }
}

// Initialize API connection
async function initApi(): Promise<void> {
  if (!fs.existsSync(process.env.DATA_DIR)) {
    fs.mkdirSync(process.env.DATA_DIR);
  }

  await api.init({
    dataDir: process.env.DATA_DIR,
    serverURL: process.env.SERVER_URL,
    password: process.env.PASSWORD,
  });

  await api.downloadBudget(process.env.SYNC_ID);
}

// List all accounts
async function listAccounts(): Promise<void> {
  console.log('listAccounts');
  await initApi();
  console.log('getAccounts');
  const accounts = await api.getAccounts() as Account[];
  
  console.log('\nAvailable Accounts:');
  console.log('------------------');
  accounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.name} (ID: ${account.id})`);
  });
  
  await api.shutdown();
}

// Sync a specific account
async function syncAccount(accountId: string): Promise<void> {
  console.log('syncAccount', accountId);

  console.log('initApi');
  await initApi();
  console.log('getAccounts');
  const accounts = await api.getAccounts() as Account[];
  console.log('accounts', accounts);
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    console.error(`Account with ID ${accountId} not found`);
    await api.shutdown();
    return;
  }

  console.log(`Running bank sync for account ${account.name}`);
  try {
    await api.runBankSync({ accountId: account.id });
    console.log(`Completed Bank sync for account ${account.name}`);
  } catch (err) {
    console.error(`Error syncing account ${account.name}: ${err}`);
    if (err instanceof Error && err.message.includes('rate limit')) {
      console.log(`Rate limit hit for account ${account.name}. Please try again later.`);
    }
  }

  await api.shutdown();
}

// Set up CLI commands
const program = new Command();

program
  .name('actual-api')
  .description('CLI for Actual API operations')
  .version('1.0.0');

program
  .command('list')
  .description('List all available accounts')
  .action(listAccounts);

program
  .command('sync')
  .description('Sync a specific account')
  .argument('<accountId>', 'ID of the account to sync')
  .action(syncAccount);

// Parse command line arguments
program.parse(); 