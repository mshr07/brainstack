const { test, expect } = require('@playwright/test');

test.describe('Autocomplete and Auto-suggestion Handling', () => {
  
  test('Basic autocomplete dropdown interaction', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .autocomplete-container {
              position: relative;
              width: 300px;
              margin: 20px;
            }
            
            .autocomplete-input {
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 4px;
              font-size: 16px;
            }
            
            .autocomplete-suggestions {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 2px solid #ddd;
              border-top: none;
              border-radius: 0 0 4px 4px;
              max-height: 200px;
              overflow-y: auto;
              z-index: 1000;
              display: none;
            }
            
            .autocomplete-suggestions.show {
              display: block;
            }
            
            .suggestion-item {
              padding: 10px;
              cursor: pointer;
              border-bottom: 1px solid #eee;
            }
            
            .suggestion-item:hover,
            .suggestion-item.highlighted {
              background-color: #f0f8ff;
            }
            
            .suggestion-item:last-child {
              border-bottom: none;
            }
          </style>
        </head>
        <body>
          <div class="autocomplete-container">
            <input type="text" 
                   class="autocomplete-input" 
                   id="country-input" 
                   placeholder="Type a country name..."
                   autocomplete="off">
            
            <div class="autocomplete-suggestions" id="suggestions-list">
              <!-- Suggestions will be populated here -->
            </div>
          </div>
          
          <div id="selected-result" style="margin: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const countries = [
              'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
              'France', 'Italy', 'Spain', 'Japan', 'China', 'India', 'Brazil',
              'Mexico', 'Russia', 'South Africa', 'Egypt', 'Thailand', 'Vietnam',
              'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Uruguay'
            ];
            
            const input = document.getElementById('country-input');
            const suggestionsList = document.getElementById('suggestions-list');
            const selectedResult = document.getElementById('selected-result');
            
            let currentHighlight = -1;
            let filteredSuggestions = [];
            
            input.addEventListener('input', function() {
              const query = this.value.toLowerCase().trim();
              
              if (query.length === 0) {
                hideSuggestions();
                return;
              }
              
              filteredSuggestions = countries.filter(country => 
                country.toLowerCase().includes(query)
              );
              
              if (filteredSuggestions.length > 0) {
                showSuggestions(filteredSuggestions);
              } else {
                hideSuggestions();
              }
              
              currentHighlight = -1;
            });
            
            input.addEventListener('keydown', function(e) {
              if (!suggestionsList.classList.contains('show')) return;
              
              const suggestions = suggestionsList.querySelectorAll('.suggestion-item');
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentHighlight = Math.min(currentHighlight + 1, suggestions.length - 1);
                highlightSuggestion(currentHighlight);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentHighlight = Math.max(currentHighlight - 1, -1);
                highlightSuggestion(currentHighlight);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentHighlight >= 0) {
                  selectSuggestion(filteredSuggestions[currentHighlight]);
                }
              } else if (e.key === 'Escape') {
                hideSuggestions();
              }
            });
            
            function showSuggestions(suggestions) {
              suggestionsList.innerHTML = '';
              
              suggestions.forEach((suggestion, index) => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion;
                item.addEventListener('click', () => selectSuggestion(suggestion));
                suggestionsList.appendChild(item);
              });
              
              suggestionsList.classList.add('show');
            }
            
            function hideSuggestions() {
              suggestionsList.classList.remove('show');
              currentHighlight = -1;
            }
            
            function highlightSuggestion(index) {
              const suggestions = suggestionsList.querySelectorAll('.suggestion-item');
              suggestions.forEach(item => item.classList.remove('highlighted'));
              
              if (index >= 0 && index < suggestions.length) {
                suggestions[index].classList.add('highlighted');
              }
            }
            
            function selectSuggestion(country) {
              input.value = country;
              selectedResult.innerHTML = \`<strong>Selected:</strong> \${country}\`;
              hideSuggestions();
            }
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', function(e) {
              if (!e.target.closest('.autocomplete-container')) {
                hideSuggestions();
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const input = page.locator('#country-input');
    const suggestionsList = page.locator('#suggestions-list');
    const selectedResult = page.locator('#selected-result');
    
    // Type to trigger autocomplete
    await input.click();
    await input.fill('uni');
    
    // Wait for suggestions to appear
    await expect(suggestionsList).toHaveClass(/show/);
    
    // Verify suggestions contain expected countries
    const suggestions = page.locator('.suggestion-item');
    await expect(suggestions).toContainText(['United States', 'United Kingdom']);
    
    // Click on a suggestion
    await page.locator('.suggestion-item').filter({ hasText: 'United Kingdom' }).click();
    
    // Verify selection
    await expect(input).toHaveValue('United Kingdom');
    await expect(selectedResult).toContainText('Selected: United Kingdom');
    await expect(suggestionsList).not.toHaveClass(/show/);
  });

  test('Keyboard navigation in autocomplete', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .autocomplete {
              position: relative;
              width: 400px;
              margin: 20px;
            }
            
            .autocomplete input {
              width: 100%;
              padding: 12px;
              border: 2px solid #ccc;
              border-radius: 6px;
              font-size: 16px;
            }
            
            .suggestions {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 2px solid #ccc;
              border-top: none;
              border-radius: 0 0 6px 6px;
              max-height: 300px;
              overflow-y: auto;
              display: none;
              z-index: 1000;
            }
            
            .suggestions.visible {
              display: block;
            }
            
            .suggestion {
              padding: 12px;
              cursor: pointer;
              border-bottom: 1px solid #eee;
            }
            
            .suggestion:hover,
            .suggestion.active {
              background-color: #e3f2fd;
            }
            
            .suggestion:last-child {
              border-bottom: none;
            }
            
            .no-results {
              padding: 12px;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="autocomplete">
            <input type="text" id="search-input" placeholder="Search programming languages...">
            <div class="suggestions" id="suggestions"></div>
          </div>
          
          <div id="navigation-info" style="margin: 20px; padding: 20px; background: #f5f5f5;"></div>
          
          <script>
            const languages = [
              'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby',
              'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'Scala',
              'Perl', 'Haskell', 'Lua', 'R', 'Matlab', 'Objective-C'
            ];
            
            const input = document.getElementById('search-input');
            const suggestions = document.getElementById('suggestions');
            const navInfo = document.getElementById('navigation-info');
            
            let activeIndex = -1;
            let filteredLanguages = [];
            
            input.addEventListener('input', function() {
              const query = this.value.toLowerCase().trim();
              
              if (query.length === 0) {
                hideSuggestions();
                return;
              }
              
              filteredLanguages = languages.filter(lang => 
                lang.toLowerCase().includes(query)
              );
              
              showSuggestions(filteredLanguages);
              activeIndex = -1;
              updateNavigationInfo();
            });
            
            input.addEventListener('keydown', function(e) {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (suggestions.classList.contains('visible')) {
                  activeIndex = Math.min(activeIndex + 1, filteredLanguages.length - 1);
                  updateActiveItem();
                  updateNavigationInfo();
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (suggestions.classList.contains('visible')) {
                  activeIndex = Math.max(activeIndex - 1, -1);
                  updateActiveItem();
                  updateNavigationInfo();
                }
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < filteredLanguages.length) {
                  selectItem(filteredLanguages[activeIndex]);
                }
              } else if (e.key === 'Escape') {
                hideSuggestions();
                updateNavigationInfo();
              }
            });
            
            function showSuggestions(items) {
              suggestions.innerHTML = '';
              
              if (items.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No results found';
                suggestions.appendChild(noResults);
              } else {
                items.forEach((item, index) => {
                  const div = document.createElement('div');
                  div.className = 'suggestion';
                  div.textContent = item;
                  div.addEventListener('click', () => selectItem(item));
                  suggestions.appendChild(div);
                });
              }
              
              suggestions.classList.add('visible');
            }
            
            function hideSuggestions() {
              suggestions.classList.remove('visible');
              activeIndex = -1;
            }
            
            function updateActiveItem() {
              const items = suggestions.querySelectorAll('.suggestion');
              items.forEach(item => item.classList.remove('active'));
              
              if (activeIndex >= 0 && activeIndex < items.length) {
                items[activeIndex].classList.add('active');
                items[activeIndex].scrollIntoView({ block: 'nearest' });
              }
            }
            
            function selectItem(item) {
              input.value = item;
              hideSuggestions();
              updateNavigationInfo();
            }
            
            function updateNavigationInfo() {
              if (suggestions.classList.contains('visible') && filteredLanguages.length > 0) {
                navInfo.innerHTML = \`
                  <strong>Navigation:</strong> \${activeIndex + 1} of \${filteredLanguages.length} items selected<br>
                  <strong>Use:</strong> ↑↓ to navigate, Enter to select, Esc to close
                \`;
              } else {
                navInfo.innerHTML = '<em>Type to search and use keyboard to navigate</em>';
              }
            }
            
            // Initialize
            updateNavigationInfo();
          </script>
        </body>
      </html>
    `);
    
    const input = page.locator('#search-input');
    const suggestions = page.locator('#suggestions');
    const navInfo = page.locator('#navigation-info');
    
    // Type to trigger autocomplete
    await input.click();
    await input.fill('java');
    
    // Wait for suggestions to appear
    await expect(suggestions).toHaveClass(/visible/);
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    await expect(navInfo).toContainText('1 of');
    
    await page.keyboard.press('ArrowDown');
    await expect(navInfo).toContainText('2 of');
    
    // Select with Enter
    await page.keyboard.press('Enter');
    
    // Verify selection (should be the second Java-related item)
    const inputValue = await input.inputValue();
    expect(['Java', 'JavaScript'].includes(inputValue)).toBe(true);
    
    // Verify suggestions are hidden
    await expect(suggestions).not.toHaveClass(/visible/);
  });

  test('Autocomplete with async data loading', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .search-container {
              position: relative;
              width: 400px;
              margin: 20px;
            }
            
            .search-input {
              width: 100%;
              padding: 15px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
            }
            
            .loading-indicator {
              position: absolute;
              right: 15px;
              top: 50%;
              transform: translateY(-50%);
              display: none;
            }
            
            .loading-indicator.show {
              display: block;
            }
            
            .results-dropdown {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 2px solid #ddd;
              border-top: none;
              border-radius: 0 0 8px 8px;
              max-height: 250px;
              overflow-y: auto;
              display: none;
              z-index: 1000;
            }
            
            .results-dropdown.open {
              display: block;
            }
            
            .result-item {
              padding: 15px;
              cursor: pointer;
              border-bottom: 1px solid #f0f0f0;
              display: flex;
              align-items: center;
            }
            
            .result-item:hover,
            .result-item.selected {
              background-color: #f8f9fa;
            }
            
            .result-item:last-child {
              border-bottom: none;
            }
            
            .result-title {
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .result-description {
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="search-container">
            <input type="text" 
                   class="search-input" 
                   id="async-search" 
                   placeholder="Search users (try 'john' or 'jane')...">
            
            <div class="loading-indicator" id="loading">⏳ Loading...</div>
            
            <div class="results-dropdown" id="results-dropdown">
              <!-- Results will be populated here -->
            </div>
          </div>
          
          <div id="selection-display" style="margin: 20px; padding: 20px; background: #e8f5e8;"></div>
          
          <script>
            // Simulate user data
            const userData = [
              { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Developer' },
              { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Designer' },
              { id: 3, name: 'John Wilson', email: 'j.wilson@example.com', role: 'Manager' },
              { id: 4, name: 'Jane Brown', email: 'jane.brown@example.com', role: 'Tester' },
              { id: 5, name: 'Bob Johnson', email: 'bob.j@example.com', role: 'Developer' },
              { id: 6, name: 'Alice Cooper', email: 'alice.c@example.com', role: 'Analyst' }
            ];
            
            const input = document.getElementById('async-search');
            const loading = document.getElementById('loading');
            const dropdown = document.getElementById('results-dropdown');
            const display = document.getElementById('selection-display');
            
            let searchTimeout;
            let currentIndex = -1;
            let currentResults = [];
            
            input.addEventListener('input', function() {
              const query = this.value.trim();
              
              // Clear previous timeout
              clearTimeout(searchTimeout);
              
              if (query.length < 2) {
                hideResults();
                return;
              }
              
              // Show loading indicator
              loading.classList.add('show');
              
              // Simulate async search with delay
              searchTimeout = setTimeout(() => {
                searchUsers(query);
              }, 500);
            });
            
            input.addEventListener('keydown', function(e) {
              if (!dropdown.classList.contains('open')) return;
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, currentResults.length - 1);
                highlightResult(currentIndex);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, -1);
                highlightResult(currentIndex);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentIndex >= 0) {
                  selectUser(currentResults[currentIndex]);
                }
              } else if (e.key === 'Escape') {
                hideResults();
              }
            });
            
            function searchUsers(query) {
              // Simulate API call delay
              const results = userData.filter(user => 
                user.name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase()) ||
                user.role.toLowerCase().includes(query.toLowerCase())
              );
              
              setTimeout(() => {
                loading.classList.remove('show');
                showResults(results);
              }, 200);
            }
            
            function showResults(results) {
              currentResults = results;
              dropdown.innerHTML = '';
              
              if (results.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'result-item';
                noResults.innerHTML = '<em>No users found</em>';
                dropdown.appendChild(noResults);
              } else {
                results.forEach((user, index) => {
                  const item = document.createElement('div');
                  item.className = 'result-item';
                  item.innerHTML = \`
                    <div>
                      <div class="result-title">\${user.name}</div>
                      <div class="result-description">\${user.email} • \${user.role}</div>
                    </div>
                  \`;
                  item.addEventListener('click', () => selectUser(user));
                  dropdown.appendChild(item);
                });
              }
              
              dropdown.classList.add('open');
              currentIndex = -1;
            }
            
            function hideResults() {
              dropdown.classList.remove('open');
              loading.classList.remove('show');
              currentIndex = -1;
            }
            
            function highlightResult(index) {
              const items = dropdown.querySelectorAll('.result-item');
              items.forEach(item => item.classList.remove('selected'));
              
              if (index >= 0 && index < items.length) {
                items[index].classList.add('selected');
                items[index].scrollIntoView({ block: 'nearest' });
              }
            }
            
            function selectUser(user) {
              input.value = user.name;
              display.innerHTML = \`
                <strong>Selected User:</strong><br>
                Name: \${user.name}<br>
                Email: \${user.email}<br>
                Role: \${user.role}
              \`;
              hideResults();
            }
            
            // Hide results when clicking outside
            document.addEventListener('click', function(e) {
              if (!e.target.closest('.search-container')) {
                hideResults();
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const input = page.locator('#async-search');
    const loading = page.locator('#loading');
    const dropdown = page.locator('#results-dropdown');
    const display = page.locator('#selection-display');
    
    // Type to trigger search
    await input.click();
    await input.fill('john');
    
    // Wait for loading indicator
    await expect(loading).toHaveClass(/show/);
    
    // Wait for results to load
    await expect(dropdown).toHaveClass(/open/, { timeout: 2000 });
    
    // Verify results contain John-related entries
    await expect(dropdown).toContainText('John Doe');
    await expect(dropdown).toContainText('John Wilson');
    
    // Use keyboard to select
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Verify selection
    await expect(display).toContainText('Selected User:');
    await expect(display).toContainText('john');
  });

  test('Multi-select autocomplete with tags', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .tag-input-container {
              width: 500px;
              margin: 20px;
              border: 2px solid #ddd;
              border-radius: 6px;
              padding: 8px;
              min-height: 50px;
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 6px;
              cursor: text;
            }
            
            .tag {
              background: #e3f2fd;
              border: 1px solid #2196f3;
              border-radius: 4px;
              padding: 4px 8px;
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
            }
            
            .tag-remove {
              cursor: pointer;
              color: #2196f3;
              font-weight: bold;
            }
            
            .tag-input {
              border: none;
              outline: none;
              flex: 1;
              min-width: 120px;
              padding: 6px;
              font-size: 16px;
            }
            
            .tag-suggestions {
              position: relative;
              width: 500px;
              margin-left: 20px;
              background: white;
              border: 2px solid #ddd;
              border-radius: 6px;
              max-height: 200px;
              overflow-y: auto;
              display: none;
            }
            
            .tag-suggestions.visible {
              display: block;
            }
            
            .tag-suggestion {
              padding: 10px;
              cursor: pointer;
              border-bottom: 1px solid #f0f0f0;
            }
            
            .tag-suggestion:hover,
            .tag-suggestion.highlight {
              background-color: #f5f5f5;
            }
            
            .tag-suggestion:last-child {
              border-bottom: none;
            }
          </style>
        </head>
        <body>
          <div class="tag-input-container" id="tag-container">
            <input type="text" class="tag-input" id="tag-input" placeholder="Type to add tags...">
          </div>
          
          <div class="tag-suggestions" id="tag-suggestions"></div>
          
          <div id="selected-tags" style="margin: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const availableTags = [
              'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 
              'Vue.js', 'Angular', 'TypeScript', 'MongoDB', 'PostgreSQL',
              'Docker', 'Kubernetes', 'AWS', 'Git', 'REST API', 'GraphQL',
              'Machine Learning', 'Data Science', 'DevOps', 'Agile', 'Scrum'
            ];
            
            const container = document.getElementById('tag-container');
            const input = document.getElementById('tag-input');
            const suggestions = document.getElementById('tag-suggestions');
            const selectedTagsDisplay = document.getElementById('selected-tags');
            
            let selectedTags = [];
            let highlightedIndex = -1;
            let filteredSuggestions = [];
            
            container.addEventListener('click', () => input.focus());
            
            input.addEventListener('input', function() {
              const query = this.value.toLowerCase().trim();
              
              if (query.length === 0) {
                hideSuggestions();
                return;
              }
              
              filteredSuggestions = availableTags.filter(tag => 
                tag.toLowerCase().includes(query) && 
                !selectedTags.includes(tag)
              );
              
              if (filteredSuggestions.length > 0) {
                showSuggestions(filteredSuggestions);
              } else {
                hideSuggestions();
              }
              
              highlightedIndex = -1;
            });
            
            input.addEventListener('keydown', function(e) {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0) {
                  addTag(filteredSuggestions[highlightedIndex]);
                } else if (this.value.trim()) {
                  addTag(this.value.trim());
                }
              } else if (e.key === 'Backspace' && this.value === '' && selectedTags.length > 0) {
                removeTag(selectedTags.length - 1);
              } else if (e.key === 'ArrowDown' && suggestions.classList.contains('visible')) {
                e.preventDefault();
                highlightedIndex = Math.min(highlightedIndex + 1, filteredSuggestions.length - 1);
                highlightSuggestion();
              } else if (e.key === 'ArrowUp' && suggestions.classList.contains('visible')) {
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, -1);
                highlightSuggestion();
              } else if (e.key === 'Escape') {
                hideSuggestions();
              }
            });
            
            function showSuggestions(tags) {
              suggestions.innerHTML = '';
              
              tags.forEach((tag, index) => {
                const item = document.createElement('div');
                item.className = 'tag-suggestion';
                item.textContent = tag;
                item.addEventListener('click', () => addTag(tag));
                suggestions.appendChild(item);
              });
              
              suggestions.classList.add('visible');
            }
            
            function hideSuggestions() {
              suggestions.classList.remove('visible');
              highlightedIndex = -1;
            }
            
            function highlightSuggestion() {
              const items = suggestions.querySelectorAll('.tag-suggestion');
              items.forEach(item => item.classList.remove('highlight'));
              
              if (highlightedIndex >= 0) {
                items[highlightedIndex].classList.add('highlight');
              }
            }
            
            function addTag(tagText) {
              if (!selectedTags.includes(tagText) && tagText.trim()) {
                selectedTags.push(tagText);
                renderTags();
                input.value = '';
                hideSuggestions();
                updateSelectedTagsDisplay();
              }
            }
            
            function removeTag(index) {
              selectedTags.splice(index, 1);
              renderTags();
              updateSelectedTagsDisplay();
            }
            
            function renderTags() {
              // Remove existing tags (but keep the input)
              const existingTags = container.querySelectorAll('.tag');
              existingTags.forEach(tag => tag.remove());
              
              // Add tags before the input
              selectedTags.forEach((tag, index) => {
                const tagElement = document.createElement('div');
                tagElement.className = 'tag';
                tagElement.innerHTML = \`
                  \${tag}
                  <span class="tag-remove" onclick="removeTagByIndex(\${index})">×</span>
                \`;
                container.insertBefore(tagElement, input);
              });
            }
            
            function updateSelectedTagsDisplay() {
              if (selectedTags.length > 0) {
                selectedTagsDisplay.innerHTML = \`
                  <strong>Selected Tags (\${selectedTags.length}):</strong><br>
                  \${selectedTags.join(', ')}
                \`;
              } else {
                selectedTagsDisplay.innerHTML = '<em>No tags selected</em>';
              }
            }
            
            // Global function for removing tags
            window.removeTagByIndex = function(index) {
              removeTag(index);
            };
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', function(e) {
              if (!e.target.closest('.tag-input-container') && !e.target.closest('.tag-suggestions')) {
                hideSuggestions();
              }
            });
            
            // Initialize display
            updateSelectedTagsDisplay();
          </script>
        </body>
      </html>
    `);
    
    const container = page.locator('#tag-container');
    const input = page.locator('#tag-input');
    const suggestions = page.locator('#tag-suggestions');
    const selectedTagsDisplay = page.locator('#selected-tags');
    
    // Add first tag
    await input.click();
    await input.fill('java');
    await expect(suggestions).toHaveClass(/visible/);
    
    // Select JavaScript using keyboard
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Verify first tag was added
    await expect(container).toContainText('JavaScript');
    await expect(selectedTagsDisplay).toContainText('JavaScript');
    
    // Add second tag
    await input.fill('react');
    await expect(suggestions).toHaveClass(/visible/);
    
    // Click on React suggestion
    await page.locator('.tag-suggestion').filter({ hasText: 'React' }).click();
    
    // Verify both tags are present
    await expect(container).toContainText('JavaScript');
    await expect(container).toContainText('React');
    await expect(selectedTagsDisplay).toContainText('Selected Tags (2)');
    
    // Remove a tag by clicking the × button
    await page.locator('.tag-remove').first().click();
    
    // Verify tag was removed
    await expect(selectedTagsDisplay).toContainText('Selected Tags (1)');
  });

  test('Autocomplete with custom formatting and rich content', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .rich-autocomplete {
              position: relative;
              width: 500px;
              margin: 20px;
            }
            
            .rich-input {
              width: 100%;
              padding: 15px;
              border: 2px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
            }
            
            .rich-suggestions {
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: white;
              border: 2px solid #ddd;
              border-top: none;
              border-radius: 0 0 8px 8px;
              max-height: 400px;
              overflow-y: auto;
              display: none;
              z-index: 1000;
            }
            
            .rich-suggestions.show {
              display: block;
            }
            
            .rich-suggestion {
              padding: 15px;
              cursor: pointer;
              border-bottom: 1px solid #f0f0f0;
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .rich-suggestion:hover,
            .rich-suggestion.active {
              background-color: #f8f9fa;
            }
            
            .rich-suggestion:last-child {
              border-bottom: none;
            }
            
            .suggestion-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: #2196f3;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
            }
            
            .suggestion-content {
              flex: 1;
            }
            
            .suggestion-name {
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .suggestion-details {
              color: #666;
              font-size: 14px;
            }
            
            .suggestion-meta {
              color: #999;
              font-size: 12px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="rich-autocomplete">
            <input type="text" 
                   class="rich-input" 
                   id="rich-input" 
                   placeholder="Search employees...">
            
            <div class="rich-suggestions" id="rich-suggestions"></div>
          </div>
          
          <div id="employee-details" style="margin: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;"></div>
          
          <script>
            const employees = [
              {
                id: 1,
                name: 'Sarah Johnson',
                position: 'Senior Frontend Developer',
                department: 'Engineering',
                email: 'sarah.j@company.com',
                phone: '+1 (555) 123-4567',
                avatar: 'SJ'
              },
              {
                id: 2,
                name: 'Michael Chen',
                position: 'Product Manager',
                department: 'Product',
                email: 'm.chen@company.com',
                phone: '+1 (555) 234-5678',
                avatar: 'MC'
              },
              {
                id: 3,
                name: 'Emily Rodriguez',
                position: 'UX Designer',
                department: 'Design',
                email: 'emily.r@company.com',
                phone: '+1 (555) 345-6789',
                avatar: 'ER'
              },
              {
                id: 4,
                name: 'David Kim',
                position: 'Backend Developer',
                department: 'Engineering',
                email: 'david.k@company.com',
                phone: '+1 (555) 456-7890',
                avatar: 'DK'
              }
            ];
            
            const input = document.getElementById('rich-input');
            const suggestions = document.getElementById('rich-suggestions');
            const details = document.getElementById('employee-details');
            
            let activeIndex = -1;
            let filteredEmployees = [];
            
            input.addEventListener('input', function() {
              const query = this.value.toLowerCase().trim();
              
              if (query.length < 2) {
                hideSuggestions();
                return;
              }
              
              filteredEmployees = employees.filter(emp => 
                emp.name.toLowerCase().includes(query) ||
                emp.position.toLowerCase().includes(query) ||
                emp.department.toLowerCase().includes(query)
              );
              
              if (filteredEmployees.length > 0) {
                showRichSuggestions(filteredEmployees);
              } else {
                showNoResults();
              }
              
              activeIndex = -1;
            });
            
            input.addEventListener('keydown', function(e) {
              if (!suggestions.classList.contains('show')) return;
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, filteredEmployees.length - 1);
                highlightSuggestion();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, -1);
                highlightSuggestion();
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0) {
                  selectEmployee(filteredEmployees[activeIndex]);
                }
              } else if (e.key === 'Escape') {
                hideSuggestions();
              }
            });
            
            function showRichSuggestions(employees) {
              suggestions.innerHTML = '';
              
              employees.forEach((emp, index) => {
                const item = document.createElement('div');
                item.className = 'rich-suggestion';
                item.innerHTML = \`
                  <div class="suggestion-avatar">\${emp.avatar}</div>
                  <div class="suggestion-content">
                    <div class="suggestion-name">\${emp.name}</div>
                    <div class="suggestion-details">\${emp.position} • \${emp.department}</div>
                  </div>
                  <div class="suggestion-meta">ID: \${emp.id}</div>
                \`;
                
                item.addEventListener('click', () => selectEmployee(emp));
                suggestions.appendChild(item);
              });
              
              suggestions.classList.add('show');
            }
            
            function showNoResults() {
              suggestions.innerHTML = '<div class="rich-suggestion"><em>No employees found</em></div>';
              suggestions.classList.add('show');
            }
            
            function hideSuggestions() {
              suggestions.classList.remove('show');
              activeIndex = -1;
            }
            
            function highlightSuggestion() {
              const items = suggestions.querySelectorAll('.rich-suggestion');
              items.forEach(item => item.classList.remove('active'));
              
              if (activeIndex >= 0 && activeIndex < items.length) {
                items[activeIndex].classList.add('active');
                items[activeIndex].scrollIntoView({ block: 'nearest' });
              }
            }
            
            function selectEmployee(employee) {
              input.value = employee.name;
              
              details.innerHTML = \`
                <h3>Employee Details</h3>
                <p><strong>Name:</strong> \${employee.name}</p>
                <p><strong>Position:</strong> \${employee.position}</p>
                <p><strong>Department:</strong> \${employee.department}</p>
                <p><strong>Email:</strong> \${employee.email}</p>
                <p><strong>Phone:</strong> \${employee.phone}</p>
                <p><strong>ID:</strong> \${employee.id}</p>
              \`;
              
              hideSuggestions();
            }
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', function(e) {
              if (!e.target.closest('.rich-autocomplete')) {
                hideSuggestions();
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const input = page.locator('#rich-input');
    const suggestions = page.locator('#rich-suggestions');
    const details = page.locator('#employee-details');
    
    // Search for an employee
    await input.click();
    await input.fill('sarah');
    
    // Wait for rich suggestions to appear
    await expect(suggestions).toHaveClass(/show/);
    
    // Verify rich content is displayed
    await expect(suggestions).toContainText('Sarah Johnson');
    await expect(suggestions).toContainText('Senior Frontend Developer');
    await expect(suggestions).toContainText('Engineering');
    await expect(suggestions).toContainText('SJ'); // Avatar
    
    // Select using keyboard navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Verify selection and details display
    await expect(input).toHaveValue('Sarah Johnson');
    await expect(details).toContainText('Employee Details');
    await expect(details).toContainText('sarah.j@company.com');
    await expect(details).toContainText('+1 (555) 123-4567');
  });
});