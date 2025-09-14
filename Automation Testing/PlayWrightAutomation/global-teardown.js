// global-teardown.js
const fs = require('fs');
const path = require('path');

async function globalTeardown(config) {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up test artifacts
    console.log('🗑️  Cleaning up test artifacts...');
    
    const testResultsDir = path.join(__dirname, 'test-results');
    const screenshotsDir = path.join(testResultsDir, 'screenshots');
    const videosDir = path.join(testResultsDir, 'videos');
    
    // Generate test summary
    console.log('📊 Generating test summary...');
    
    const resultsJsonPath = path.join(testResultsDir, 'results.json');
    if (fs.existsSync(resultsJsonPath)) {
      const results = JSON.parse(fs.readFileSync(resultsJsonPath, 'utf8'));
      
      const summary = {
        totalTests: results.suites?.reduce((acc, suite) => acc + (suite.tests?.length || 0), 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: results.stats?.duration || 0
      };
      
      // Count test results
      const countResults = (suites) => {
        suites?.forEach(suite => {
          suite.tests?.forEach(test => {
            if (test.outcome === 'expected') summary.passed++;
            else if (test.outcome === 'unexpected') summary.failed++;
            else if (test.outcome === 'skipped') summary.skipped++;
          });
          
          if (suite.suites) {
            countResults(suite.suites);
          }
        });
      };
      
      countResults(results.suites);
      
      console.log('📈 Test Summary:');
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   ✅ Passed: ${summary.passed}`);
      console.log(`   ❌ Failed: ${summary.failed}`);
      console.log(`   ⏭️  Skipped: ${summary.skipped}`);
      console.log(`   ⏱️  Duration: ${Math.round(summary.duration / 1000)}s`);
      
      // Write summary to file
      fs.writeFileSync(
        path.join(testResultsDir, 'summary.json'),
        JSON.stringify(summary, null, 2)
      );
    }
    
    // Clean up old artifacts (keep only last 5 runs)
    if (fs.existsSync(screenshotsDir)) {
      const screenshots = fs.readdirSync(screenshotsDir);
      if (screenshots.length > 50) {
        console.log('🧹 Cleaning up old screenshots...');
        screenshots
          .map(file => ({
            file,
            time: fs.statSync(path.join(screenshotsDir, file)).mtime
          }))
          .sort((a, b) => b.time - a.time)
          .slice(50)
          .forEach(({ file }) => {
            fs.unlinkSync(path.join(screenshotsDir, file));
          });
      }
    }
    
    if (fs.existsSync(videosDir)) {
      const videos = fs.readdirSync(videosDir);
      if (videos.length > 20) {
        console.log('🧹 Cleaning up old videos...');
        videos
          .map(file => ({
            file,
            time: fs.statSync(path.join(videosDir, file)).mtime
          }))
          .sort((a, b) => b.time - a.time)
          .slice(20)
          .forEach(({ file }) => {
            fs.unlinkSync(path.join(videosDir, file));
          });
      }
    }
    
    // Log performance metrics if available
    console.log('📊 Performance metrics logged to test-results/summary.json');
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;