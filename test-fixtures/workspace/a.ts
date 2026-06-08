// a.ts - fixture for workspace cleanup tests
const greeting = "hello";
console.log('🧪 [a.ts:3] debug'); // probemark:auto

function doWork() {
  const result = 42;
  console.log('🧪 [a.ts:7] doWork → result:', result); // probemark:auto
  console.log('normal log', result);
  return result;
}

logger.info('application started');
console.log('🧪 [a.ts:13] debug'); // probemark:auto
