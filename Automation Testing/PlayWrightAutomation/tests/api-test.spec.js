const { test, expect } = require('@playwright/test');

// Base URL - change this to your API endpoint
const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('API Testing Suite', () => {
  
  // GET request test
  test('should fetch a single post', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    
    const data = await response.json();
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('body');
    expect(data).toHaveProperty('userId');
    
    console.log('GET Response:', data);
  });

  // GET request test with query parameters
  test('should fetch posts with query parameters', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`, {
      params: {
        userId: 1
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    
    // Verify all posts belong to userId 1
    data.forEach(post => {
      expect(post.userId).toBe(1);
    });
  });

  // POST request test
  test('should create a new post', async ({ request }) => {
    const newPost = {
      title: 'Test Post Title',
      body: 'This is a test post body created by Playwright',
      userId: 1
    };

    const response = await request.post(`${BASE_URL}/posts`, {
      data: newPost,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.title).toBe(newPost.title);
    expect(data.body).toBe(newPost.body);
    expect(data.userId).toBe(newPost.userId);
    
    console.log('POST Response:', data);
  });

  // PUT request test
  test('should update an existing post', async ({ request }) => {
    const updatedPost = {
      id: 1,
      title: 'Updated Test Post Title',
      body: 'This post has been updated by Playwright',
      userId: 1
    };

    const response = await request.put(`${BASE_URL}/posts/1`, {
      data: updatedPost,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.id).toBe(1);
    expect(data.title).toBe(updatedPost.title);
    expect(data.body).toBe(updatedPost.body);
    
    console.log('PUT Response:', data);
  });

  // PATCH request test
  test('should partially update a post', async ({ request }) => {
    const partialUpdate = {
      title: 'Partially Updated Title'
    };

    const response = await request.patch(`${BASE_URL}/posts/1`, {
      data: partialUpdate,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.title).toBe(partialUpdate.title);
    expect(data).toHaveProperty('body'); // Original body should still exist
    
    console.log('PATCH Response:', data);
  });

  // DELETE request test
  test('should delete a post', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/1`);
    
    expect(response.status()).toBe(200);
    
    console.log('DELETE successful for post ID 1');
  });

  // Error handling test
  test('should handle 404 errors gracefully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/9999`);
    
    expect(response.status()).toBe(404);
    
    console.log('404 error handled correctly');
  });

  // Authentication test example (with headers)
  test('should send requests with authentication headers', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`, {
      headers: {
        'Authorization': 'Bearer your-token-here',
        'X-API-Key': 'your-api-key-here'
      }
    });
    
    // JSONPlaceholder doesn't require auth, but this shows the pattern
    expect(response.status()).toBe(200);
  });

  // Response time test
  test('should respond within acceptable time', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get(`${BASE_URL}/posts/1`);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    
    console.log(`Response time: ${responseTime}ms`);
  });

  // JSON Schema validation example
  test('should validate response schema', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Basic schema validation
    expect(typeof data.id).toBe('number');
    expect(typeof data.title).toBe('string');
    expect(typeof data.body).toBe('string');
    expect(typeof data.userId).toBe('number');
    
    // Additional validations
    expect(data.title.length).toBeGreaterThan(0);
    expect(data.body.length).toBeGreaterThan(0);
  });

});