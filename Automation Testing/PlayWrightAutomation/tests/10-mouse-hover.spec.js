const { test, expect } = require('@playwright/test');

test.describe('Mouse Hover Interactions', () => {
  
  test('Basic hover interactions', async ({ page }) => {
    // Create a page with hover effects
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .hover-element {
              width: 200px;
              height: 100px;
              background-color: lightblue;
              padding: 20px;
              margin: 20px;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            
            .hover-element:hover {
              background-color: darkblue;
              color: white;
              transform: scale(1.1);
            }
            
            .tooltip {
              position: absolute;
              background: black;
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 14px;
              display: none;
              z-index: 1000;
            }
            
            .hover-container:hover .tooltip {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="hover-element" id="hover-box">
            Hover over me!
          </div>
          
          <div class="hover-container" style="position: relative; margin: 20px;">
            <button id="tooltip-trigger">Button with Tooltip</button>
            <div class="tooltip" id="tooltip">This is a tooltip!</div>
          </div>
          
          <script>
            document.getElementById('hover-box').addEventListener('mouseenter', function() {
              console.log('Mouse entered hover box');
            });
            
            document.getElementById('hover-box').addEventListener('mouseleave', function() {
              console.log('Mouse left hover box');
            });
          </script>
        </body>
      </html>
    `);
    
    const hoverElement = page.locator('#hover-box');
    const tooltip = page.locator('#tooltip');
    const tooltipTrigger = page.locator('#tooltip-trigger');
    
    // Hover over the element
    await hoverElement.hover();
    
    // Verify hover state (this might vary based on CSS implementation)
    const backgroundColor = await hoverElement.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    console.log('Background color on hover:', backgroundColor);
    
    // Test tooltip hover
    await tooltipTrigger.hover();
    await expect(tooltip).toBeVisible();
    
    // Move mouse away and verify tooltip disappears
    await page.mouse.move(0, 0);
    await expect(tooltip).not.toBeVisible();
  });

  test('Hover with menu dropdowns', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .nav-menu {
              background: #333;
              padding: 0;
              margin: 0;
              list-style: none;
              display: flex;
            }
            
            .nav-item {
              position: relative;
            }
            
            .nav-link {
              display: block;
              color: white;
              padding: 15px 20px;
              text-decoration: none;
            }
            
            .nav-link:hover {
              background: #555;
            }
            
            .dropdown {
              position: absolute;
              top: 100%;
              left: 0;
              background: #444;
              min-width: 200px;
              display: none;
              z-index: 1000;
            }
            
            .nav-item:hover .dropdown {
              display: block;
            }
            
            .dropdown a {
              display: block;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
            }
            
            .dropdown a:hover {
              background: #666;
            }
          </style>
        </head>
        <body>
          <ul class="nav-menu">
            <li class="nav-item">
              <a href="#" class="nav-link">Home</a>
            </li>
            <li class="nav-item" id="products-menu">
              <a href="#" class="nav-link">Products</a>
              <div class="dropdown" id="products-dropdown">
                <a href="#" id="laptops-link">Laptops</a>
                <a href="#" id="phones-link">Phones</a>
                <a href="#" id="tablets-link">Tablets</a>
              </div>
            </li>
            <li class="nav-item" id="services-menu">
              <a href="#" class="nav-link">Services</a>
              <div class="dropdown" id="services-dropdown">
                <a href="#" id="support-link">Support</a>
                <a href="#" id="consulting-link">Consulting</a>
              </div>
            </li>
          </ul>
          
          <div id="status" style="margin-top: 50px; padding: 20px;"></div>
          
          <script>
            const status = document.getElementById('status');
            
            document.querySelectorAll('.dropdown a').forEach(link => {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                status.textContent = 'Clicked: ' + this.textContent;
              });
            });
          </script>
        </body>
      </html>
    `);
    
    const productsMenu = page.locator('#products-menu');
    const productsDropdown = page.locator('#products-dropdown');
    const laptopsLink = page.locator('#laptops-link');
    const status = page.locator('#status');
    
    // Hover over Products menu
    await productsMenu.hover();
    
    // Verify dropdown appears
    await expect(productsDropdown).toBeVisible();
    
    // Hover over a dropdown item and click
    await laptopsLink.hover();
    await laptopsLink.click();
    
    // Verify the click was registered
    await expect(status).toHaveText('Clicked: Laptops');
    
    // Test moving to different menu
    const servicesMenu = page.locator('#services-menu');
    const servicesDropdown = page.locator('#services-dropdown');
    const supportLink = page.locator('#support-link');
    
    await servicesMenu.hover();
    await expect(servicesDropdown).toBeVisible();
    await expect(productsDropdown).not.toBeVisible(); // Previous dropdown should hide
    
    await supportLink.hover();
    await supportLink.click();
    await expect(status).toHaveText('Clicked: Support');
  });

  test('Hover with precise mouse movements', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="tracking-area" style="width: 400px; height: 300px; border: 2px solid #ccc; position: relative; margin: 20px;">
            <div id="cursor-position" style="position: absolute; top: 10px; left: 10px; background: yellow; padding: 5px;">
              Mouse position: (0, 0)
            </div>
            <div id="hover-target" style="width: 100px; height: 100px; background: red; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
              Target
            </div>
          </div>
          
          <script>
            const trackingArea = document.getElementById('tracking-area');
            const cursorPosition = document.getElementById('cursor-position');
            const hoverTarget = document.getElementById('hover-target');
            
            trackingArea.addEventListener('mousemove', function(e) {
              const rect = this.getBoundingClientRect();
              const x = Math.round(e.clientX - rect.left);
              const y = Math.round(e.clientY - rect.top);
              cursorPosition.textContent = \`Mouse position: (\${x}, \${y})\`;
            });
            
            hoverTarget.addEventListener('mouseenter', function() {
              this.style.background = 'green';
              this.textContent = 'Hovered!';
            });
            
            hoverTarget.addEventListener('mouseleave', function() {
              this.style.background = 'red';
              this.textContent = 'Target';
            });
          </script>
        </body>
      </html>
    `);
    
    const trackingArea = page.locator('#tracking-area');
    const hoverTarget = page.locator('#hover-target');
    const cursorPosition = page.locator('#cursor-position');
    
    // Get the bounding box of the tracking area
    const trackingAreaBox = await trackingArea.boundingBox();
    
    // Move mouse to specific coordinates within the tracking area
    const targetX = trackingAreaBox.x + trackingAreaBox.width / 2;
    const targetY = trackingAreaBox.y + trackingAreaBox.height / 2;
    
    await page.mouse.move(targetX, targetY);
    
    // Verify the target is hovered
    await expect(hoverTarget).toContainText('Hovered!');
    
    // Move mouse to corner
    await page.mouse.move(trackingAreaBox.x + 10, trackingAreaBox.y + 10);
    
    // Verify target is no longer hovered
    await expect(hoverTarget).toContainText('Target');
  });

  test('Hover with drag and drop simulation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .drag-container {
              display: flex;
              gap: 50px;
              padding: 20px;
            }
            
            .draggable {
              width: 100px;
              height: 100px;
              background: lightblue;
              cursor: move;
              display: flex;
              align-items: center;
              justify-content: center;
              user-select: none;
            }
            
            .drop-zone {
              width: 150px;
              height: 150px;
              border: 2px dashed #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f9f9f9;
            }
            
            .drop-zone.drag-over {
              border-color: #007cba;
              background: #e6f3ff;
            }
            
            .draggable:hover {
              background: darkblue;
              color: white;
              transform: scale(1.05);
            }
          </style>
        </head>
        <body>
          <div class="drag-container">
            <div class="draggable" id="draggable-item" draggable="true">
              Drag Me
            </div>
            <div class="drop-zone" id="drop-zone">
              Drop Here
            </div>
          </div>
          
          <script>
            const draggable = document.getElementById('draggable-item');
            const dropZone = document.getElementById('drop-zone');
            
            draggable.addEventListener('dragstart', function(e) {
              e.dataTransfer.setData('text/plain', this.id);
            });
            
            dropZone.addEventListener('dragover', function(e) {
              e.preventDefault();
              this.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', function() {
              this.classList.remove('drag-over');
            });
            
            dropZone.addEventListener('drop', function(e) {
              e.preventDefault();
              this.classList.remove('drag-over');
              const draggedId = e.dataTransfer.getData('text/plain');
              const draggedElement = document.getElementById(draggedId);
              this.appendChild(draggedElement);
              this.textContent = '';
            });
          </script>
        </body>
      </html>
    `);
    
    const draggableItem = page.locator('#draggable-item');
    const dropZone = page.locator('#drop-zone');
    
    // Hover over draggable item to see hover effect
    await draggableItem.hover();
    
    // Perform drag and drop
    await draggableItem.dragTo(dropZone);
    
    // Verify the item was moved
    const itemInDropZone = dropZone.locator('#draggable-item');
    await expect(itemInDropZone).toBeVisible();
  });

  test('Hover with complex interactions', async ({ page }) => {
    // Go to TodoMVC to test hover on real elements
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add some todos first
    const todos = ['Hover test 1', 'Hover test 2', 'Hover test 3'];
    
    for (const todo of todos) {
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }
    
    const todoItems = page.locator('.todo-list li');
    const firstTodo = todoItems.first();
    
    // Hover over the first todo item
    await firstTodo.hover();
    
    // The destroy button should become visible on hover
    const destroyButton = firstTodo.locator('.destroy');
    await expect(destroyButton).toBeVisible();
    
    // Hover over the destroy button specifically
    await destroyButton.hover();
    
    // Click the destroy button
    await destroyButton.click();
    
    // Verify the todo was removed
    await expect(todoItems).toHaveCount(2);
    
    // Test hover on different todo
    const secondTodo = todoItems.first(); // Now the first item after deletion
    await secondTodo.hover();
    
    const secondDestroyButton = secondTodo.locator('.destroy');
    await expect(secondDestroyButton).toBeVisible();
    
    // Move mouse away and verify destroy button becomes invisible
    await page.mouse.move(0, 0);
    await expect(secondDestroyButton).not.toBeVisible();
  });

  test('Hover with timing and delays', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="delayed-hover" style="width: 200px; height: 100px; background: lightgray; padding: 20px; margin: 20px;">
            Hover and wait...
          </div>
          
          <div id="status" style="margin: 20px; padding: 20px; background: #f0f0f0;">
            Status: Ready
          </div>
          
          <script>
            const hoverElement = document.getElementById('delayed-hover');
            const status = document.getElementById('status');
            let hoverTimeout;
            
            hoverElement.addEventListener('mouseenter', function() {
              status.textContent = 'Status: Hover detected, waiting...';
              hoverTimeout = setTimeout(() => {
                status.textContent = 'Status: Hover confirmed after delay';
                this.style.background = 'lightgreen';
              }, 1000);
            });
            
            hoverElement.addEventListener('mouseleave', function() {
              clearTimeout(hoverTimeout);
              status.textContent = 'Status: Mouse left';
              this.style.background = 'lightgray';
            });
          </script>
        </body>
      </html>
    `);
    
    const hoverElement = page.locator('#delayed-hover');
    const status = page.locator('#status');
    
    // Hover and immediately move away (before delay)
    await hoverElement.hover();
    await expect(status).toHaveText('Status: Hover detected, waiting...');
    
    // Move away quickly
    await page.mouse.move(0, 0);
    await expect(status).toHaveText('Status: Mouse left');
    
    // Now hover and wait for the delay
    await hoverElement.hover();
    await expect(status).toHaveText('Status: Hover detected, waiting...');
    
    // Wait for the timeout to trigger
    await page.waitForTimeout(1200);
    await expect(status).toHaveText('Status: Hover confirmed after delay');
  });

  test('Multiple hover targets and sequences', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div style="display: flex; gap: 20px; padding: 20px;">
            <div class="hover-sequence" id="step1" style="width: 100px; height: 100px; background: red; color: white; display: flex; align-items: center; justify-content: center;">
              Step 1
            </div>
            <div class="hover-sequence" id="step2" style="width: 100px; height: 100px; background: orange; color: white; display: flex; align-items: center; justify-content: center;">
              Step 2
            </div>
            <div class="hover-sequence" id="step3" style="width: 100px; height: 100px; background: green; color: white; display: flex; align-items: center; justify-content: center;">
              Step 3
            </div>
          </div>
          
          <div id="sequence-status" style="margin: 20px; padding: 20px; background: #f0f0f0;">
            Hover sequence: None
          </div>
          
          <script>
            const steps = document.querySelectorAll('.hover-sequence');
            const status = document.getElementById('sequence-status');
            let sequence = [];
            
            steps.forEach((step, index) => {
              step.addEventListener('mouseenter', function() {
                sequence.push(index + 1);
                status.textContent = 'Hover sequence: ' + sequence.join(' -> ');
                
                if (sequence.length === 3) {
                  status.textContent += ' (Complete!)';
                  status.style.background = 'lightgreen';
                }
              });
            });
            
            // Reset on click
            document.addEventListener('click', function() {
              sequence = [];
              status.textContent = 'Hover sequence: None';
              status.style.background = '#f0f0f0';
            });
          </script>
        </body>
      </html>
    `);
    
    const step1 = page.locator('#step1');
    const step2 = page.locator('#step2');
    const step3 = page.locator('#step3');
    const status = page.locator('#sequence-status');
    
    // Hover in sequence
    await step1.hover();
    await expect(status).toContainText('Hover sequence: 1');
    
    await step2.hover();
    await expect(status).toContainText('Hover sequence: 1 -> 2');
    
    await step3.hover();
    await expect(status).toContainText('Hover sequence: 1 -> 2 -> 3 (Complete!)');
    
    // Reset and try different sequence
    await page.click('body');
    await expect(status).toHaveText('Hover sequence: None');
    
    // Try reverse sequence
    await step3.hover();
    await step2.hover();
    await step1.hover();
    await expect(status).toContainText('Hover sequence: 3 -> 2 -> 1 (Complete!)');
  });
});