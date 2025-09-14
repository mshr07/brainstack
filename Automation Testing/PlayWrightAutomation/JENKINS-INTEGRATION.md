# Jenkins Pipeline Integration with Bitbucket for Playwright Tests

## 📋 Overview

This guide explains how to integrate your Playwright test automation framework with Jenkins CI/CD pipeline using Bitbucket as the version control system.

## 🔧 Prerequisites

### Jenkins Setup
- Jenkins server with admin access
- Node.js plugin installed
- Bitbucket plugin installed
- Pipeline plugin installed
- HTML Publisher plugin (for reports)
- Allure Jenkins plugin (for Allure reports)

### Bitbucket Setup
- Bitbucket repository with your Playwright tests
- SSH keys or App passwords configured
- Webhook access for auto-triggering builds

### System Requirements
- Node.js 18+ on Jenkins agents
- Docker (optional but recommended)
- Sufficient disk space for test artifacts

## 🚀 Step-by-Step Integration

### 1. Bitbucket Repository Setup

First, push your Playwright tests to Bitbucket:

```bash
# Initialize git repository (if not already done)
cd /Users/srihemanthreddy/Documents/PlayWrightAutomation
git init

# Add Bitbucket remote
git remote add origin https://your-username@bitbucket.org/your-workspace/playwright-automation.git

# Add all files
git add .

# Commit changes
git commit -m "Initial Playwright test automation framework"

# Push to Bitbucket
git push -u origin main
```

### 2. Jenkins Plugins Installation

Install these essential Jenkins plugins:

1. **Bitbucket Plugin** - For Bitbucket integration
2. **Pipeline Plugin** - For Pipeline as Code
3. **NodeJS Plugin** - For Node.js environment
4. **HTML Publisher Plugin** - For HTML reports
5. **Allure Jenkins Plugin** - For Allure reports
6. **JUnit Plugin** - For test results
7. **Timestamper Plugin** - For build timestamps
8. **Workspace Cleanup Plugin** - For cleanup

```bash
# Via Jenkins CLI (optional)
java -jar jenkins-cli.jar -s http://your-jenkins-url install-plugin bitbucket nodejs htmlpublisher allure-jenkins junit timestamper ws-cleanup
```

### 3. Global Tool Configuration

Configure Node.js in Jenkins:

1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Add **NodeJS** installation:
   - Name: `Node18`
   - Version: `18.x.x` (latest LTS)
   - Global npm packages: `@playwright/test allure-commandline`

### 4. Credentials Setup

Add credentials for Bitbucket access:

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Add **Username with password** or **SSH Username with private key**
3. ID: `bitbucket-credentials`
4. Description: `Bitbucket Access for Playwright Tests`

### 5. Create Jenkins Pipeline Job

1. Create **New Item** → **Pipeline**
2. Name: `Playwright-Automation-Pipeline`
3. Configure:
   - **Build Triggers**: Check "Build when a change is pushed to Bitbucket"
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your Bitbucket repository URL
   - **Credentials**: Select your Bitbucket credentials
   - **Branch**: `*/main` (or your default branch)
   - **Script Path**: `Jenkinsfile`

## 📄 Jenkinsfile Configuration

Create a `Jenkinsfile` in your repository root:

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        PLAYWRIGHT_BROWSERS_PATH = "${WORKSPACE}/browsers"
        CI = 'true'
        NODE_ENV = 'test'
    }
    
    options {
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        skipStagesAfterUnstable()
    }
    
    tools {
        nodejs "${NODE_VERSION}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🚀 Starting Playwright Test Pipeline"
                    echo "Branch: ${env.GIT_BRANCH}"
                    echo "Commit: ${env.GIT_COMMIT}"
                }
                
                // Clean workspace
                cleanWs()
                
                // Checkout code
                checkout scm
                
                // Display repository info
                sh '''
                    echo "Repository Information:"
                    git log --oneline -5
                    echo "Current directory contents:"
                    ls -la
                '''
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    echo "🔧 Setting up Node.js environment"
                }
                
                // Verify Node.js and npm versions
                sh '''
                    echo "Node.js version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                '''
                
                // Install dependencies
                sh '''
                    echo "📦 Installing dependencies..."
                    npm ci --prefer-offline --no-audit
                '''
                
                // Install Playwright browsers
                sh '''
                    echo "🌐 Installing Playwright browsers..."
                    npx playwright install --with-deps chromium firefox webkit
                '''
            }
        }
        
        stage('Code Quality Checks') {
            parallel {
                stage('Lint Check') {
                    steps {
                        script {
                            try {
                                sh '''
                                    echo "🔍 Running code linting..."
                                    # Add your linting commands here if you have ESLint configured
                                    # npm run lint
                                '''
                            } catch (Exception e) {
                                echo "⚠️ Linting step skipped or failed: ${e.getMessage()}"
                            }
                        }
                    }
                }
                
                stage('Security Audit') {
                    steps {
                        script {
                            try {
                                sh '''
                                    echo "🔒 Running security audit..."
                                    npm audit --audit-level=high
                                '''
                            } catch (Exception e) {
                                echo "⚠️ Security audit found issues: ${e.getMessage()}"
                            }
                        }
                    }
                }
            }
        }
        
        stage('Test Execution') {
            parallel {
                stage('Chrome Tests') {
                    steps {
                        script {
                            echo "🟢 Running Chrome tests"
                        }
                        sh '''
                            echo "Executing Playwright tests in Chrome..."
                            npx playwright test --project=chromium --reporter=html,junit,allure-playwright
                        '''
                    }
                    post {
                        always {
                            // Archive test artifacts
                            archiveArtifacts artifacts: 'test-results/**/*', fingerprint: true, allowEmptyArchive: true
                        }
                    }
                }
                
                stage('Firefox Tests') {
                    steps {
                        script {
                            echo "🟠 Running Firefox tests"
                        }
                        sh '''
                            echo "Executing Playwright tests in Firefox..."
                            npx playwright test --project=firefox --reporter=html,junit,allure-playwright
                        '''
                    }
                }
                
                stage('Safari Tests') {
                    when {
                        // Run Safari tests only on macOS agents
                        expression { return isUnix() }
                    }
                    steps {
                        script {
                            echo "🔵 Running Safari tests"
                        }
                        sh '''
                            echo "Executing Playwright tests in Safari..."
                            npx playwright test --project=webkit --reporter=html,junit,allure-playwright
                        '''
                    }
                }
            }
        }
        
        stage('Mobile Tests') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    echo "📱 Running Mobile tests"
                }
                sh '''
                    echo "Executing Mobile Playwright tests..."
                    npx playwright test --project="Mobile Chrome" --project="Mobile Safari" --reporter=html,junit,allure-playwright
                '''
            }
        }
        
        stage('API Tests') {
            steps {
                script {
                    echo "🔗 Running API tests"
                }
                sh '''
                    echo "Executing API tests..."
                    npx playwright test api-test.spec.js --reporter=html,junit,allure-playwright
                '''
            }
        }
        
        stage('Generate Reports') {
            steps {
                script {
                    echo "📊 Generating test reports"
                }
                
                // Generate Allure report
                sh '''
                    echo "Generating Allure report..."
                    if [ -d "test-results/allure-results" ] && [ "$(ls -A test-results/allure-results)" ]; then
                        allure generate test-results/allure-results --clean -o test-results/allure-report
                    else
                        echo "No Allure results found, skipping Allure report generation"
                    fi
                '''
                
                // Generate custom summary
                sh '''
                    echo "Creating test summary..."
                    echo "Test Execution Summary - Build ${BUILD_NUMBER}" > test-summary.txt
                    echo "=======================================" >> test-summary.txt
                    echo "Branch: ${GIT_BRANCH}" >> test-summary.txt
                    echo "Commit: ${GIT_COMMIT}" >> test-summary.txt
                    echo "Build Time: $(date)" >> test-summary.txt
                    echo "=======================================" >> test-summary.txt
                    
                    # Count test results if JUnit XML exists
                    if [ -f "test-results/junit.xml" ]; then
                        echo "Detailed test results available in reports" >> test-summary.txt
                    fi
                '''
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Performing post-build actions"
            }
            
            // Publish JUnit test results
            publishTestResults testResultsPattern: 'test-results/junit.xml'
            
            // Publish HTML reports
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright HTML Report'
            ])
            
            // Publish Allure report
            script {
                if (fileExists('test-results/allure-results')) {
                    allure([
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: 'test-results/allure-results']]
                    ])
                }
            }
            
            // Archive artifacts
            archiveArtifacts artifacts: '''
                test-results/**/*,
                playwright-report/**/*,
                test-summary.txt,
                screenshots/**/*
            ''', fingerprint: true, allowEmptyArchive: true
            
            // Clean up workspace
            cleanWs(
                cleanWhenAborted: true,
                cleanWhenFailure: true,
                cleanWhenNotBuilt: true,
                cleanWhenSuccess: true,
                cleanWhenUnstable: true,
                deleteDirs: true
            )
        }
        
        success {
            script {
                echo "✅ Pipeline completed successfully!"
            }
            
            // Send success notification
            emailext (
                subject: "✅ Playwright Tests Passed - Build ${BUILD_NUMBER}",
                body: """
                    <h2>Playwright Test Automation - SUCCESS</h2>
                    <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                    <p><strong>Branch:</strong> ${GIT_BRANCH}</p>
                    <p><strong>Commit:</strong> ${GIT_COMMIT}</p>
                    <p><strong>Duration:</strong> ${BUILD_DURATION}</p>
                    <p><strong>Reports:</strong> <a href="${BUILD_URL}Playwright_HTML_Report/">View Test Report</a></p>
                    <p><strong>Allure Report:</strong> <a href="${BUILD_URL}allure/">View Allure Report</a></p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL ?: 'team@example.com'}",
                mimeType: 'text/html'
            )
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
            }
            
            // Send failure notification
            emailext (
                subject: "❌ Playwright Tests Failed - Build ${BUILD_NUMBER}",
                body: """
                    <h2>Playwright Test Automation - FAILED</h2>
                    <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                    <p><strong>Branch:</strong> ${GIT_BRANCH}</p>
                    <p><strong>Commit:</strong> ${GIT_COMMIT}</p>
                    <p><strong>Duration:</strong> ${BUILD_DURATION}</p>
                    <p><strong>Console Output:</strong> <a href="${BUILD_URL}console">View Logs</a></p>
                    <p><strong>Reports:</strong> <a href="${BUILD_URL}Playwright_HTML_Report/">View Test Report</a></p>
                    <p>Please check the failed tests and fix the issues.</p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL ?: 'team@example.com'}",
                mimeType: 'text/html'
            )
        }
        
        unstable {
            script {
                echo "⚠️ Pipeline completed with unstable results"
            }
            
            // Send unstable notification
            emailext (
                subject: "⚠️ Playwright Tests Unstable - Build ${BUILD_NUMBER}",
                body: """
                    <h2>Playwright Test Automation - UNSTABLE</h2>
                    <p>Some tests failed, but the build continued.</p>
                    <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                    <p><strong>Branch:</strong> ${GIT_BRANCH}</p>
                    <p><strong>Reports:</strong> <a href="${BUILD_URL}Playwright_HTML_Report/">View Test Report</a></p>
                    <p>Please review the failed tests.</p>
                """,
                to: "${env.CHANGE_AUTHOR_EMAIL ?: 'team@example.com'}",
                mimeType: 'text/html'
            )
        }
    }
}
```

## 🔧 Advanced Jenkins Configuration

### Multi-Branch Pipeline

For better branch management, use Multi-branch Pipeline:

1. Create **New Item** → **Multibranch Pipeline**
2. Configure:
   - **Branch Sources**: Bitbucket
   - **Repository HTTPS URL**: Your Bitbucket repo URL
   - **Credentials**: Your Bitbucket credentials
   - **Behaviors**: Discover branches, Discover pull requests from origin

### Webhook Configuration

Set up Bitbucket webhook for auto-triggering:

1. In Bitbucket repository → **Settings** → **Webhooks**
2. Add webhook:
   - **Title**: Jenkins Trigger
   - **URL**: `http://your-jenkins-url/bitbucket-hook/`
   - **Triggers**: Repository push, Pull request created/updated

### Environment-Specific Builds

Create different pipeline configurations for different environments:

```groovy
// Environment-specific stage
stage('Environment Setup') {
    steps {
        script {
            def environment = env.BRANCH_NAME == 'main' ? 'production' : 
                             env.BRANCH_NAME == 'develop' ? 'staging' : 'development'
            
            echo "🌍 Setting up ${environment} environment"
            
            // Load environment-specific configurations
            sh """
                echo "ENVIRONMENT=${environment}" > .env
                echo "BASE_URL=\$(cat tests/test-data/config.json | jq -r '.environments.${environment}.url')" >> .env
            """
        }
    }
}
```

## 🐳 Docker Integration

### Dockerfile for Playwright

Create `Dockerfile` for containerized execution:

```dockerfile
FROM node:18-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy test files
COPY . .

# Set environment variables
ENV CI=true
ENV NODE_ENV=test

# Run tests
CMD ["npx", "playwright", "test"]
```

### Docker Compose for Services

Create `docker-compose.yml` for testing with external services:

```yaml
version: '3.8'
services:
  playwright-tests:
    build: .
    environment:
      - CI=true
      - NODE_ENV=test
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
    depends_on:
      - selenium-hub

  selenium-hub:
    image: selenium/hub:4.15.0
    ports:
      - "4444:4444"

  chrome:
    image: selenium/node-chrome:4.15.0
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
```

## 📊 Advanced Reporting Setup

### Custom Report Dashboard

Create a custom HTML dashboard:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Playwright Test Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
        .metric { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Playwright Test Automation Dashboard</h1>
        <p>Build: ${BUILD_NUMBER} | Branch: ${GIT_BRANCH} | Date: ${BUILD_TIMESTAMP}</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>Total Tests</h3>
            <div id="total-tests">Loading...</div>
        </div>
        <div class="metric success">
            <h3>Passed</h3>
            <div id="passed-tests">Loading...</div>
        </div>
        <div class="metric failure">
            <h3>Failed</h3>
            <div id="failed-tests">Loading...</div>
        </div>
        <div class="metric warning">
            <h3>Duration</h3>
            <div id="test-duration">Loading...</div>
        </div>
    </div>
    
    <div class="reports">
        <h2>Available Reports</h2>
        <ul>
            <li><a href="playwright-report/index.html">Playwright HTML Report</a></li>
            <li><a href="allure-report/index.html">Allure Report</a></li>
            <li><a href="test-results/junit.xml">JUnit XML Results</a></li>
        </ul>
    </div>
</body>
</html>
```

### Slack Integration

Add Slack notifications to your pipeline:

```groovy
// Add to post section
post {
    always {
        script {
            def color = currentBuild.result == 'SUCCESS' ? 'good' : 
                       currentBuild.result == 'UNSTABLE' ? 'warning' : 'danger'
            
            def message = """
                *Playwright Tests ${currentBuild.result}*
                Build: ${BUILD_NUMBER}
                Branch: ${GIT_BRANCH}
                Duration: ${BUILD_DURATION}
                <${BUILD_URL}|View Build> | <${BUILD_URL}Playwright_HTML_Report/|Test Report>
            """
            
            slackSend(
                channel: '#test-automation',
                color: color,
                message: message,
                teamDomain: 'your-workspace',
                token: 'your-slack-token'
            )
        }
    }
}
```

## 🔐 Security Best Practices

### Secrets Management

Store sensitive data as Jenkins secrets:

```groovy
environment {
    API_KEY = credentials('api-key')
    DB_PASSWORD = credentials('db-password')
    TEST_USER_PASSWORD = credentials('test-user-password')
}
```

### Access Control

1. **Role-based Access Control**:
   - Configure matrix-based security
   - Create roles for different team members
   - Restrict sensitive operations

2. **Bitbucket Integration Security**:
   - Use SSH keys instead of passwords
   - Enable two-factor authentication
   - Regularly rotate credentials

## 📈 Performance Optimization

### Parallel Execution

```groovy
stage('Parallel Test Execution') {
    parallel {
        stage('Smoke Tests') {
            steps {
                sh 'npx playwright test --grep @smoke'
            }
        }
        stage('Regression Tests') {
            steps {
                sh 'npx playwright test --grep @regression'
            }
        }
        stage('API Tests') {
            steps {
                sh 'npx playwright test api-*.spec.js'
            }
        }
    }
}
```

### Caching Strategy

```groovy
stage('Setup with Cache') {
    steps {
        // Cache node_modules
        script {
            if (fileExists('node_modules/.cache-timestamp')) {
                def cacheTime = readFile('node_modules/.cache-timestamp').trim()
                def currentTime = sh(script: 'stat -c %Y package-lock.json', returnStdout: true).trim()
                
                if (cacheTime != currentTime) {
                    sh 'npm ci'
                    sh 'stat -c %Y package-lock.json > node_modules/.cache-timestamp'
                }
            } else {
                sh 'npm ci'
                sh 'stat -c %Y package-lock.json > node_modules/.cache-timestamp'
            }
        }
    }
}
```

## 📋 Checklist for Implementation

### Pre-Implementation
- [ ] Jenkins server setup with required plugins
- [ ] Bitbucket repository created and configured
- [ ] SSH keys/credentials configured
- [ ] Node.js tool configured in Jenkins
- [ ] Email/Slack notifications configured

### Implementation
- [ ] `Jenkinsfile` added to repository
- [ ] Webhook configured in Bitbucket
- [ ] Pipeline job created in Jenkins
- [ ] Test execution verified
- [ ] Reports generation working
- [ ] Notifications configured

### Post-Implementation
- [ ] Pipeline performance optimized
- [ ] Security review completed
- [ ] Team training conducted
- [ ] Documentation updated
- [ ] Monitoring and alerting setup

This comprehensive setup will give you a robust CI/CD pipeline for your Playwright tests with proper integration between Jenkins and Bitbucket!