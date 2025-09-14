const { test, expect } = require('@playwright/test');

test.describe('Dropdown Handling and Verification', () => {
  
  test('Handle select dropdown with options', async ({ page }) => {
    // Using a demo page that has dropdowns
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    const dropdown = page.locator('#dropdown');
    
    // Verify dropdown is visible
    await expect(dropdown).toBeVisible();
    
    // Get all options
    const options = await dropdown.locator('option').allTextContents();
    console.log('Available options:', options);
    
    // Select by value
    await dropdown.selectOption('1');
    await expect(dropdown).toHaveValue('1');
    
    // Verify selected option text
    const selectedText = await dropdown.locator('option:checked').textContent();
    console.log('Selected option text:', selectedText);
    
    // Select by visible text
    await dropdown.selectOption({ label: 'Option 2' });
    await expect(dropdown).toHaveValue('2');
    
    // Select by index
    await dropdown.selectOption({ index: 1 });
    await expect(dropdown).toHaveValue('1');
  });

  test('Handle multi-select dropdown', async ({ page }) => {
    // Create a simple page with multi-select for testing
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <select id="multi-dropdown" multiple>
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="cherry">Cherry</option>
            <option value="date">Date</option>
            <option value="elderberry">Elderberry</option>
          </select>
          <p id="selected-display">Selected: None</p>
          <script>
            document.getElementById('multi-dropdown').addEventListener('change', function() {
              const selected = Array.from(this.selectedOptions).map(option => option.text);
              document.getElementById('selected-display').textContent = 'Selected: ' + (selected.length > 0 ? selected.join(', ') : 'None');
            });
          </script>
        </body>
      </html>
    `);
    
    const multiDropdown = page.locator('#multi-dropdown');
    const selectedDisplay = page.locator('#selected-display');
    
    // Select multiple options
    await multiDropdown.selectOption(['apple', 'cherry', 'elderberry']);
    
    // Verify multiple selections
    const selectedValues = await multiDropdown.evaluate(el => 
      Array.from(el.selectedOptions).map(option => option.value)
    );
    expect(selectedValues).toEqual(['apple', 'cherry', 'elderberry']);
    
    // Verify display text
    await expect(selectedDisplay).toContainText('Apple, Cherry, Elderberry');
    
    // Clear selection and select different options
    await multiDropdown.selectOption(['banana', 'date']);
    await expect(selectedDisplay).toContainText('Banana, Date');
  });

  test('Handle custom dropdown (div-based)', async ({ page }) => {
    // Create a custom dropdown for testing
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .custom-dropdown {
              position: relative;
              width: 200px;
              border: 1px solid #ccc;
              cursor: pointer;
            }
            .dropdown-header {
              padding: 10px;
              background: #f9f9f9;
            }
            .dropdown-list {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 1px solid #ccc;
              border-top: none;
              max-height: 200px;
              overflow-y: auto;
              display: none;
            }
            .dropdown-list.open {
              display: block;
            }
            .dropdown-item {
              padding: 10px;
              cursor: pointer;
            }
            .dropdown-item:hover {
              background: #f0f0f0;
            }
            .dropdown-item.selected {
              background: #007cba;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="custom-dropdown" id="custom-dropdown">
            <div class="dropdown-header" id="dropdown-header">Select a fruit...</div>
            <div class="dropdown-list" id="dropdown-list">
              <div class="dropdown-item" data-value="apple">Apple</div>
              <div class="dropdown-item" data-value="banana">Banana</div>
              <div class="dropdown-item" data-value="cherry">Cherry</div>
              <div class="dropdown-item" data-value="date">Date</div>
            </div>
          </div>
          
          <script>
            const header = document.getElementById('dropdown-header');
            const list = document.getElementById('dropdown-list');
            const items = document.querySelectorAll('.dropdown-item');
            
            header.addEventListener('click', () => {
              list.classList.toggle('open');
            });
            
            items.forEach(item => {
              item.addEventListener('click', () => {
                const value = item.dataset.value;
                const text = item.textContent;
                header.textContent = text;
                header.dataset.value = value;
                
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                list.classList.remove('open');
              });
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
              if (!e.target.closest('.custom-dropdown')) {
                list.classList.remove('open');
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const customDropdown = page.locator('#custom-dropdown');
    const dropdownHeader = page.locator('#dropdown-header');
    const dropdownList = page.locator('#dropdown-list');
    
    // Verify initial state
    await expect(dropdownHeader).toHaveText('Select a fruit...');
    await expect(dropdownList).not.toHaveClass(/open/);
    
    // Click to open dropdown
    await dropdownHeader.click();
    await expect(dropdownList).toHaveClass(/open/);
    
    // Select an item
    await page.locator('.dropdown-item[data-value="banana"]').click();
    
    // Verify selection
    await expect(dropdownHeader).toHaveText('Banana');
    await expect(dropdownList).not.toHaveClass(/open/);
    
    // Verify selected item has correct class
    await expect(page.locator('.dropdown-item[data-value="banana"]')).toHaveClass(/selected/);
  });

  test('Verify dropdown options and values', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    const dropdown = page.locator('#dropdown');
    const options = page.locator('#dropdown option');
    
    // Get all option values
    const optionValues = await options.evaluateAll(elements => 
      elements.map(el => ({ value: el.value, text: el.textContent }))
    );
    
    console.log('Option values and texts:', optionValues);
    
    // Verify specific options exist
    await expect(options.filter({ hasText: 'Option 1' })).toBeVisible();
    await expect(options.filter({ hasText: 'Option 2' })).toBeVisible();
    
    // Verify option count
    await expect(options).toHaveCount(3); // Including the "Please select an option" option
    
    // Test each selectable option
    const selectableOptions = optionValues.filter(opt => opt.value !== '');
    
    for (const option of selectableOptions) {
      await dropdown.selectOption(option.value);
      await expect(dropdown).toHaveValue(option.value);
      
      const selectedOptionText = await dropdown.locator('option:checked').textContent();
      expect(selectedOptionText).toBe(option.text);
    }
  });

  test('Handle dropdown with search/filter functionality', async ({ page }) => {
    // Create a searchable dropdown
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .searchable-dropdown {
              position: relative;
              width: 300px;
            }
            .search-input {
              width: 100%;
              padding: 10px;
              border: 1px solid #ccc;
              box-sizing: border-box;
            }
            .dropdown-options {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 1px solid #ccc;
              border-top: none;
              max-height: 200px;
              overflow-y: auto;
              display: none;
            }
            .dropdown-options.show {
              display: block;
            }
            .dropdown-option {
              padding: 10px;
              cursor: pointer;
            }
            .dropdown-option:hover {
              background: #f0f0f0;
            }
            .dropdown-option.hidden {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="searchable-dropdown">
            <input type="text" class="search-input" id="search-input" placeholder="Search countries...">
            <div class="dropdown-options" id="dropdown-options">
              <div class="dropdown-option" data-value="us">United States</div>
              <div class="dropdown-option" data-value="uk">United Kingdom</div>
              <div class="dropdown-option" data-value="ca">Canada</div>
              <div class="dropdown-option" data-value="au">Australia</div>
              <div class="dropdown-option" data-value="de">Germany</div>
              <div class="dropdown-option" data-value="fr">France</div>
              <div class="dropdown-option" data-value="jp">Japan</div>
            </div>
          </div>
          
          <p id="selected-country">Selected: None</p>
          
          <script>
            const searchInput = document.getElementById('search-input');
            const dropdownOptions = document.getElementById('dropdown-options');
            const options = document.querySelectorAll('.dropdown-option');
            const selectedCountry = document.getElementById('selected-country');
            
            searchInput.addEventListener('focus', () => {
              dropdownOptions.classList.add('show');
            });
            
            searchInput.addEventListener('input', () => {
              const filter = searchInput.value.toLowerCase();
              
              options.forEach(option => {
                const text = option.textContent.toLowerCase();
                if (text.includes(filter)) {
                  option.classList.remove('hidden');
                } else {
                  option.classList.add('hidden');
                }
              });
            });
            
            options.forEach(option => {
              option.addEventListener('click', () => {
                const value = option.dataset.value;
                const text = option.textContent;
                
                searchInput.value = text;
                selectedCountry.textContent = 'Selected: ' + text;
                dropdownOptions.classList.remove('show');
              });
            });
            
            document.addEventListener('click', (e) => {
              if (!e.target.closest('.searchable-dropdown')) {
                dropdownOptions.classList.remove('show');
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const searchInput = page.locator('#search-input');
    const dropdownOptions = page.locator('#dropdown-options');
    const selectedCountry = page.locator('#selected-country');
    
    // Focus on input to open dropdown
    await searchInput.click();
    await expect(dropdownOptions).toHaveClass(/show/);
    
    // Type to search
    await searchInput.fill('uni');
    
    // Wait for filtering to happen
    await page.waitForTimeout(100);
    
    // Verify filtered options are visible
    await expect(page.locator('.dropdown-option:not(.hidden)')).toHaveCount(2); // United States, United Kingdom
    
    // Select an option
    await page.locator('.dropdown-option[data-value="uk"]').click();
    
    // Verify selection
    await expect(searchInput).toHaveValue('United Kingdom');
    await expect(selectedCountry).toHaveText('Selected: United Kingdom');
    await expect(dropdownOptions).not.toHaveClass(/show/);
  });

  test('Handle dropdown with dynamic options', async ({ page }) => {
    // Create a dropdown that loads options dynamically
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <select id="category-dropdown">
            <option value="">Select Category</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
          </select>
          
          <select id="subcategory-dropdown" disabled>
            <option value="">Select Subcategory</option>
          </select>
          
          <script>
            const categoryDropdown = document.getElementById('category-dropdown');
            const subcategoryDropdown = document.getElementById('subcategory-dropdown');
            
            const subcategories = {
              electronics: ['Phones', 'Laptops', 'Tablets', 'Accessories'],
              clothing: ['Shirts', 'Pants', 'Shoes', 'Accessories'],
              books: ['Fiction', 'Non-Fiction', 'Textbooks', 'Comics']
            };
            
            categoryDropdown.addEventListener('change', function() {
              const category = this.value;
              
              // Clear subcategory options
              subcategoryDropdown.innerHTML = '<option value="">Select Subcategory</option>';
              
              if (category && subcategories[category]) {
                // Add new options
                subcategories[category].forEach(sub => {
                  const option = document.createElement('option');
                  option.value = sub.toLowerCase();
                  option.textContent = sub;
                  subcategoryDropdown.appendChild(option);
                });
                
                subcategoryDropdown.disabled = false;
              } else {
                subcategoryDropdown.disabled = true;
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const categoryDropdown = page.locator('#category-dropdown');
    const subcategoryDropdown = page.locator('#subcategory-dropdown');
    
    // Verify initial state
    await expect(subcategoryDropdown).toBeDisabled();
    
    // Select a category
    await categoryDropdown.selectOption('electronics');
    
    // Wait for subcategories to load
    await expect(subcategoryDropdown).toBeEnabled();
    
    // Verify subcategory options were loaded
    const subcategoryOptions = await subcategoryDropdown.locator('option').allTextContents();
    console.log('Subcategory options:', subcategoryOptions);
    
    expect(subcategoryOptions).toContain('Phones');
    expect(subcategoryOptions).toContain('Laptops');
    
    // Select a subcategory
    await subcategoryDropdown.selectOption('laptops');
    await expect(subcategoryDropdown).toHaveValue('laptops');
    
    // Change category and verify subcategories change
    await categoryDropdown.selectOption('clothing');
    
    // Wait for new subcategories
    await page.waitForTimeout(100);
    
    const newSubcategoryOptions = await subcategoryDropdown.locator('option').allTextContents();
    expect(newSubcategoryOptions).toContain('Shirts');
    expect(newSubcategoryOptions).toContain('Shoes');
  });

  test('Test dropdown keyboard navigation', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dropdown');
    
    const dropdown = page.locator('#dropdown');
    
    // Focus on the dropdown
    await dropdown.focus();
    
    // Use keyboard to navigate
    await page.keyboard.press('ArrowDown'); // Should select first option
    await expect(dropdown).toHaveValue('1');
    
    await page.keyboard.press('ArrowDown'); // Should select second option
    await expect(dropdown).toHaveValue('2');
    
    await page.keyboard.press('ArrowUp'); // Should go back to first option
    await expect(dropdown).toHaveValue('1');
    
    // Use Enter to confirm selection
    await page.keyboard.press('Enter');
    await expect(dropdown).toHaveValue('1');
  });

  test('Handle dropdown error states and validation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="test-form">
            <select id="required-dropdown" required>
              <option value="">Please select an option</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
            <div id="error-message" style="color: red; display: none;">Please select an option</div>
            <button type="submit">Submit</button>
          </form>
          
          <script>
            const form = document.getElementById('test-form');
            const dropdown = document.getElementById('required-dropdown');
            const errorMessage = document.getElementById('error-message');
            
            form.addEventListener('submit', function(e) {
              if (!dropdown.value) {
                e.preventDefault();
                errorMessage.style.display = 'block';
              } else {
                errorMessage.style.display = 'none';
              }
            });
            
            dropdown.addEventListener('change', function() {
              if (this.value) {
                errorMessage.style.display = 'none';
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const dropdown = page.locator('#required-dropdown');
    const submitButton = page.locator('button[type="submit"]');
    const errorMessage = page.locator('#error-message');
    
    // Try to submit without selection
    await submitButton.click();
    
    // Verify error message appears
    await expect(errorMessage).toBeVisible();
    
    // Select an option
    await dropdown.selectOption('option1');
    
    // Verify error message disappears
    await expect(errorMessage).not.toBeVisible();
    
    // Submit form successfully
    await submitButton.click();
    
    // Verify no error message
    await expect(errorMessage).not.toBeVisible();
  });
});