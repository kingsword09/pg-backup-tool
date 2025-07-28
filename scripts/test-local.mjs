import { dump, restore } from '../dist/index.js';

async function main() {
  console.log('--- Running local test ---');
  
  try {
    console.log('Testing pg_dump --version...');
    await dump({ version: true });
    console.log('✅ pg_dump test passed.');
  } catch (e) {
    console.error('❌ pg_dump test failed:', e);
    process.exit(1);
  }
  
  try {
    console.log('\nTesting pg_restore --version...');
    await restore({ version: true });
    console.log('✅ pg_restore test passed.');
  } catch (e) {
    console.error('❌ pg_restore test failed:', e);
    process.exit(1);
  }
  
  console.log('\n--- All local tests passed! ---');
}

main();
