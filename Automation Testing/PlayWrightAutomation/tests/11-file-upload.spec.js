const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('File Upload Handling in Playwright', () => {
  
  test.beforeAll(async () => {
    // Create test files for upload
    const testFilesDir = 'test-files';
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    // Create a simple text file
    fs.writeFileSync(path.join(testFilesDir, 'test-document.txt'), 'This is a test document for file upload.');
    
    // Create a simple CSV file
    const csvContent = 'Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles\nBob Johnson,35,Chicago';
    fs.writeFileSync(path.join(testFilesDir, 'test-data.csv'), csvContent);
    
    // Create a simple JSON file
    const jsonContent = JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      preferences: ['option1', 'option2']
    }, null, 2);
    fs.writeFileSync(path.join(testFilesDir, 'test-config.json'), jsonContent);
  });

  test('Basic file upload with input element', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form enctype="multipart/form-data">
            <label for="file-input">Choose file:</label>
            <input type="file" id="file-input" name="file" accept=".txt,.csv,.json">
            <button type="button" id="upload-btn">Upload</button>
          </form>
          
          <div id="file-info" style="margin-top: 20px; padding: 20px; background: #f0f0f0;"></div>
          
          <script>
            const fileInput = document.getElementById('file-input');
            const uploadBtn = document.getElementById('upload-btn');
            const fileInfo = document.getElementById('file-info');
            
            fileInput.addEventListener('change', function(e) {
              const file = e.target.files[0];
              if (file) {
                fileInfo.innerHTML = \`
                  <strong>File Selected:</strong><br>
                  Name: \${file.name}<br>
                  Size: \${file.size} bytes<br>
                  Type: \${file.type}<br>
                  Last Modified: \${new Date(file.lastModified).toLocaleString()}
                \`;
              }
            });
            
            uploadBtn.addEventListener('click', function() {
              const file = fileInput.files[0];
              if (file) {
                fileInfo.innerHTML += '<br><strong>Status: Upload simulated successfully!</strong>';
              } else {
                alert('Please select a file first.');
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const fileInput = page.locator('#file-input');
    const uploadBtn = page.locator('#upload-btn');
    const fileInfo = page.locator('#file-info');
    
    // Upload a text file
    const textFilePath = path.join('test-files', 'test-document.txt');
    await fileInput.setInputFiles(textFilePath);
    
    // Verify file information is displayed
    await expect(fileInfo).toContainText('test-document.txt');
    await expect(fileInfo).toContainText('bytes');
    
    // Click upload button
    await uploadBtn.click();
    await expect(fileInfo).toContainText('Upload simulated successfully!');
  });

  test('Multiple file upload', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form enctype="multipart/form-data">
            <label for="multi-file-input">Choose multiple files:</label>
            <input type="file" id="multi-file-input" name="files" multiple accept=".txt,.csv,.json">
            <button type="button" id="upload-multiple-btn">Upload All</button>
          </form>
          
          <div id="files-list" style="margin-top: 20px; padding: 20px; background: #f0f0f0;"></div>
          
          <script>
            const multiFileInput = document.getElementById('multi-file-input');
            const uploadMultipleBtn = document.getElementById('upload-multiple-btn');
            const filesList = document.getElementById('files-list');
            
            multiFileInput.addEventListener('change', function(e) {
              const files = Array.from(e.target.files);
              if (files.length > 0) {
                let html = '<strong>Selected Files:</strong><br>';
                files.forEach((file, index) => {
                  html += \`\${index + 1}. \${file.name} (\${file.size} bytes)<br>\`;
                });
                filesList.innerHTML = html;
              }
            });
            
            uploadMultipleBtn.addEventListener('click', function() {
              const files = multiFileInput.files;
              if (files.length > 0) {
                filesList.innerHTML += \`<br><strong>Status: \${files.length} files uploaded successfully!</strong>\`;
              } else {
                alert('Please select at least one file.');
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const multiFileInput = page.locator('#multi-file-input');
    const uploadMultipleBtn = page.locator('#upload-multiple-btn');
    const filesList = page.locator('#files-list');
    
    // Upload multiple files
    const filePaths = [
      path.join('test-files', 'test-document.txt'),
      path.join('test-files', 'test-data.csv'),
      path.join('test-files', 'test-config.json')
    ];
    
    await multiFileInput.setInputFiles(filePaths);
    
    // Verify all files are listed
    await expect(filesList).toContainText('test-document.txt');
    await expect(filesList).toContainText('test-data.csv');
    await expect(filesList).toContainText('test-config.json');
    
    // Upload all files
    await uploadMultipleBtn.click();
    await expect(filesList).toContainText('3 files uploaded successfully!');
  });

  test('Drag and drop file upload', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .drop-zone {
              width: 400px;
              height: 200px;
              border: 2px dashed #ccc;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 20px;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            
            .drop-zone.drag-over {
              border-color: #007cba;
              background-color: #e6f3ff;
            }
            
            .drop-zone.has-files {
              border-color: #28a745;
              background-color: #d4edda;
            }
          </style>
        </head>
        <body>
          <div class="drop-zone" id="drop-zone">
            <p>Drag and drop files here or click to select</p>
          </div>
          
          <input type="file" id="hidden-file-input" style="display: none;" multiple>
          
          <div id="dropped-files-info" style="margin: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const dropZone = document.getElementById('drop-zone');
            const hiddenFileInput = document.getElementById('hidden-file-input');
            const droppedFilesInfo = document.getElementById('dropped-files-info');
            
            // Click to select files
            dropZone.addEventListener('click', () => {
              hiddenFileInput.click();
            });
            
            hiddenFileInput.addEventListener('change', handleFiles);
            
            // Drag and drop events
            dropZone.addEventListener('dragover', (e) => {
              e.preventDefault();
              dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', () => {
              dropZone.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', (e) => {
              e.preventDefault();
              dropZone.classList.remove('drag-over');
              const files = e.dataTransfer.files;
              handleFiles({ target: { files } });
            });
            
            function handleFiles(event) {
              const files = Array.from(event.target.files);
              if (files.length > 0) {
                dropZone.classList.add('has-files');
                dropZone.innerHTML = \`<p>✓ \${files.length} file(s) selected</p>\`;
                
                let html = '<strong>Files ready for upload:</strong><br>';
                files.forEach((file, index) => {
                  html += \`\${index + 1}. \${file.name} (\${(file.size / 1024).toFixed(2)} KB)<br>\`;
                });
                droppedFilesInfo.innerHTML = html;
              }
            }
          </script>
        </body>
      </html>
    `);
    
    const dropZone = page.locator('#drop-zone');
    const hiddenFileInput = page.locator('#hidden-file-input');
    const droppedFilesInfo = page.locator('#dropped-files-info');
    
    // Test click to select files
    await dropZone.click();
    
    // Upload file through the hidden input
    await hiddenFileInput.setInputFiles(path.join('test-files', 'test-document.txt'));
    
    // Verify file information
    await expect(dropZone).toContainText('1 file(s) selected');
    await expect(droppedFilesInfo).toContainText('test-document.txt');
    
    // Test multiple files
    const multiplePaths = [
      path.join('test-files', 'test-data.csv'),
      path.join('test-files', 'test-config.json')
    ];
    
    await dropZone.click();
    await hiddenFileInput.setInputFiles(multiplePaths);
    
    await expect(dropZone).toContainText('2 file(s) selected');
    await expect(droppedFilesInfo).toContainText('test-data.csv');
    await expect(droppedFilesInfo).toContainText('test-config.json');
  });

  test('File upload with validation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form enctype="multipart/form-data">
            <label for="validated-file-input">Upload Image (max 2MB, jpg/png only):</label>
            <input type="file" id="validated-file-input" name="image" accept="image/jpeg,image/png">
            <button type="button" id="validate-upload-btn">Validate & Upload</button>
          </form>
          
          <div id="validation-messages" style="margin-top: 20px; padding: 20px;"></div>
          
          <script>
            const fileInput = document.getElementById('validated-file-input');
            const validateBtn = document.getElementById('validate-upload-btn');
            const messages = document.getElementById('validation-messages');
            
            validateBtn.addEventListener('click', function() {
              const file = fileInput.files[0];
              
              if (!file) {
                showMessage('Please select a file.', 'error');
                return;
              }
              
              // Validate file type
              const allowedTypes = ['image/jpeg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                showMessage('Invalid file type. Please upload JPG or PNG images only.', 'error');
                return;
              }
              
              // Validate file size (2MB = 2 * 1024 * 1024 bytes)
              const maxSize = 2 * 1024 * 1024;
              if (file.size > maxSize) {
                showMessage('File too large. Maximum size is 2MB.', 'error');
                return;
              }
              
              showMessage(\`✓ File "\${file.name}" is valid and ready for upload!\`, 'success');
            });
            
            function showMessage(text, type) {
              const color = type === 'error' ? '#dc3545' : '#28a745';
              const bgColor = type === 'error' ? '#f8d7da' : '#d4edda';
              messages.innerHTML = \`
                <div style="color: \${color}; background-color: \${bgColor}; padding: 10px; border-radius: 4px;">
                  \${text}
                </div>
              \`;
            }
          </script>
        </body>
      </html>
    `);
    
    const fileInput = page.locator('#validated-file-input');
    const validateBtn = page.locator('#validate-upload-btn');
    const messages = page.locator('#validation-messages');
    
    // Test with no file selected
    await validateBtn.click();
    await expect(messages).toContainText('Please select a file.');
    
    // Test with valid file (using our text file, but the validation will catch it)
    await fileInput.setInputFiles(path.join('test-files', 'test-document.txt'));
    await validateBtn.click();
    await expect(messages).toContainText('Invalid file type');
    
    // We can't easily create actual image files in the test, but this shows the validation pattern
  });

  test('File upload with progress simulation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form enctype="multipart/form-data">
            <input type="file" id="progress-file-input" accept=".txt,.csv,.json">
            <button type="button" id="upload-with-progress-btn">Upload with Progress</button>
          </form>
          
          <div id="upload-progress" style="margin-top: 20px; display: none;">
            <div style="margin-bottom: 10px;">
              <span id="progress-text">Uploading...</span>
              <span id="progress-percent" style="float: right;">0%</span>
            </div>
            <div style="width: 100%; background-color: #f0f0f0; border-radius: 4px;">
              <div id="progress-bar" style="width: 0%; height: 20px; background-color: #007cba; border-radius: 4px; transition: width 0.3s ease;"></div>
            </div>
          </div>
          
          <div id="upload-result" style="margin-top: 20px; padding: 20px;"></div>
          
          <script>
            const fileInput = document.getElementById('progress-file-input');
            const uploadBtn = document.getElementById('upload-with-progress-btn');
            const progressDiv = document.getElementById('upload-progress');
            const progressText = document.getElementById('progress-text');
            const progressPercent = document.getElementById('progress-percent');
            const progressBar = document.getElementById('progress-bar');
            const uploadResult = document.getElementById('upload-result');
            
            uploadBtn.addEventListener('click', async function() {
              const file = fileInput.files[0];
              if (!file) {
                alert('Please select a file first.');
                return;
              }
              
              // Show progress
              progressDiv.style.display = 'block';
              uploadResult.innerHTML = '';
              
              // Simulate upload progress
              for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                progressBar.style.width = i + '%';
                progressPercent.textContent = i + '%';
                
                if (i < 100) {
                  progressText.textContent = 'Uploading...';
                } else {
                  progressText.textContent = 'Upload complete!';
                  progressText.style.color = '#28a745';
                }
              }
              
              // Show result
              setTimeout(() => {
                uploadResult.innerHTML = \`
                  <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 4px;">
                    <strong>✓ Upload successful!</strong><br>
                    File: \${file.name}<br>
                    Size: \${(file.size / 1024).toFixed(2)} KB
                  </div>
                \`;
                progressDiv.style.display = 'none';
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
    
    const fileInput = page.locator('#progress-file-input');
    const uploadBtn = page.locator('#upload-with-progress-btn');
    const progressDiv = page.locator('#upload-progress');
    const uploadResult = page.locator('#upload-result');
    
    // Upload a file
    await fileInput.setInputFiles(path.join('test-files', 'test-data.csv'));
    await uploadBtn.click();
    
    // Wait for progress to start
    await expect(progressDiv).toBeVisible();
    
    // Wait for upload to complete
    await expect(uploadResult).toContainText('Upload successful!', { timeout: 15000 });
    await expect(uploadResult).toContainText('test-data.csv');
  });

  test('Clear file selection', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form>
            <input type="file" id="clearable-file-input" multiple>
            <button type="button" id="clear-files-btn">Clear Selection</button>
          </form>
          
          <div id="file-list" style="margin-top: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const fileInput = document.getElementById('clearable-file-input');
            const clearBtn = document.getElementById('clear-files-btn');
            const fileList = document.getElementById('file-list');
            
            fileInput.addEventListener('change', function() {
              const files = Array.from(this.files);
              if (files.length > 0) {
                let html = '<strong>Selected files:</strong><br>';
                files.forEach(file => {
                  html += \`• \${file.name}<br>\`;
                });
                fileList.innerHTML = html;
              } else {
                fileList.innerHTML = '<em>No files selected</em>';
              }
            });
            
            clearBtn.addEventListener('click', function() {
              fileInput.value = '';
              fileInput.dispatchEvent(new Event('change'));
            });
          </script>
        </body>
      </html>
    `);
    
    const fileInput = page.locator('#clearable-file-input');
    const clearBtn = page.locator('#clear-files-btn');
    const fileList = page.locator('#file-list');
    
    // Upload files
    const filePaths = [
      path.join('test-files', 'test-document.txt'),
      path.join('test-files', 'test-data.csv')
    ];
    
    await fileInput.setInputFiles(filePaths);
    await expect(fileList).toContainText('test-document.txt');
    await expect(fileList).toContainText('test-data.csv');
    
    // Clear files
    await clearBtn.click();
    await expect(fileList).toContainText('No files selected');
    
    // Test that input can accept new files after clearing
    await fileInput.setInputFiles(path.join('test-files', 'test-config.json'));
    await expect(fileList).toContainText('test-config.json');
  });

  test('File upload with buffer/content', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <input type="file" id="buffer-file-input">
          <button type="button" id="read-file-btn">Read File Content</button>
          
          <div id="file-content" style="margin-top: 20px; padding: 20px; background: #f8f9fa; white-space: pre-wrap;"></div>
          
          <script>
            const fileInput = document.getElementById('buffer-file-input');
            const readBtn = document.getElementById('read-file-btn');
            const contentDiv = document.getElementById('file-content');
            
            readBtn.addEventListener('click', function() {
              const file = fileInput.files[0];
              if (!file) {
                alert('Please select a file first.');
                return;
              }
              
              const reader = new FileReader();
              reader.onload = function(e) {
                contentDiv.innerHTML = \`
                  <strong>File: \${file.name}</strong><br>
                  <strong>Content:</strong><br>
                  \${e.target.result}
                \`;
              };
              reader.readAsText(file);
            });
          </script>
        </body>
      </html>
    `);
    
    const fileInput = page.locator('#buffer-file-input');
    const readBtn = page.locator('#read-file-btn');
    const contentDiv = page.locator('#file-content');
    
    // Create file from buffer
    const fileContent = 'This is test content created from buffer in Playwright test.';
    const buffer = Buffer.from(fileContent, 'utf8');
    
    // Upload file using buffer
    await fileInput.setInputFiles({
      name: 'buffer-test.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });
    
    // Read the file content
    await readBtn.click();
    
    // Verify content is displayed
    await expect(contentDiv).toContainText('buffer-test.txt');
    await expect(contentDiv).toContainText(fileContent);
  });
});

test.afterAll(async () => {
  // Clean up test files
  try {
    fs.rmSync('test-files', { recursive: true, force: true });
  } catch (error) {
    console.log('Cleanup warning: Could not remove test-files directory');
  }
});