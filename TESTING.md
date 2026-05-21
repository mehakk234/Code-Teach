# Testing Guide for CodeTeach Platform

## ✅ Current Status (Updated: 2025-12-19)

### What's Working
- ✅ **Backend Unit Tests**: 21/21 tests passing (User model)
- ✅ **Frontend Component Tests**: 4/4 tests passing (Basic form validation)
- ✅ **Test Infrastructure**: Jest, MongoDB Memory Server, React Testing Library configured
- ✅ **Redis**: Running as system service on port 6379
- ✅ **MongoDB**: Connected to MongoDB Atlas

### What Needs Setup
- ⚠️ **Integration Tests**: Example files created but require route/module setup
- ⚠️ **E2E Tests**: Cypress configured with example tests (not yet runnable)
- ⚠️ **CI/CD**: GitHub Actions workflow created but not tested

---

## Table of Contents

- [Current Status](#current-status)
- [Running Tests (What Works Now)](#running-tests-what-works-now)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [E2E Testing (Future)](#e2e-testing-future)
- [Project Setup](#project-setup)
- [Troubleshooting](#troubleshooting)

---

## Running Tests (What Works Now)

### ✅ Backend Unit Tests (WORKING)

```bash
cd code-teach-backend-main
npm test
```

**Output**: 21 tests passing
- User creation and validation (7 tests)
- Password methods (2 tests)
- Course enrollment (4 tests)
- Module progress tracking (3 tests)
- User methods (2 tests)
- Schema validation (3 tests)

**Coverage**: ~82% for User model, ~12% overall (only models tested so far)

### ✅ Frontend Tests (WORKING)

```bash
cd Code-Teach-React-main
npm test
```

**Output**: 4 tests passing
- Form element rendering
- Input type validation
- Submit button presence

---

## Backend Testing

### What's Implemented

**Working:**
- ✅ Jest configuration (`jest.config.js`)
- ✅ MongoDB Memory Server setup (`tests/setup.js`)
- ✅ Test helpers (`tests/helpers/testHelpers.js`)
- ✅ User model unit tests (`tests/unit/models/User.test.js`) - 21 passing tests

**Not Yet Working:**
- ⚠️ Integration tests for routes (examples created, need actual route imports)
- ⚠️ Tests for other models (Course, Notification)
- ⚠️ Utility function tests

### Test Structure

### Running Backend Tests

```bash
cd code-teach-backend-main

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Writing Backend Tests

#### Unit Test Example

```javascript
const User = require('../../../models/User');
const { createTestUser } = require('../../helpers/testHelpers');

describe('User Model', () => {
  it('should create a new user with hashed password', async () => {
    const user = await createTestUser({ password: 'plaintext123' });
    
    expect(user.password).not.toBe('plaintext123');
    expect(user.password).toMatch(/^\$2[aby]\$.{56}$/);
  });
});
```

#### Integration Test Example

```javascript
const request = require('supertest');
const app = require('../../../server');

describe('POST /auth/signin', () => {
  it('should sign in with correct credentials', async () => {
    const response = await request(app)
      .post('/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(response.body.token).toBeDefined();
  });
});
```

## Frontend Testing

### Setup

The frontend uses React Testing Library and Jest for component testing.

**Dependencies:**
- `@testing-library/react`: React component testing
- `@testing-library/jest-dom`: Custom matchers
- `@testing-library/user-event`: User interaction simulation
- `msw`: API mocking

### Test Structure

```
Code-Teach-React-main/
├── src/
│   ├── setupTests.js            # Test environment setup
│   ├── mocks/
│   │   └── handlers.js          # MSW API handlers
│   └── Frontend/
│       ├── Components/
│       │   └── __tests__/       # Component tests
│       └── pages/
│           └── __tests__/       # Page tests
│               └── SignIn.test.js
```

### Running Frontend Tests

```bash
cd Code-Teach-React-main

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Frontend Tests

#### Component Test Example

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignIn from '../SignIn';

describe('SignIn Component', () => {
  it('should render sign in form', () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

## E2E Testing

### Setup

Cypress is used for end-to-end testing of complete user flows.

### Test Structure

```
Code-Teach-React-main/
├── cypress/
│   ├── e2e/
│   │   ├── auth-flow.cy.js
│   │   └── course-enrollment.cy.js
│   ├── support/
│   │   ├── commands.js          # Custom commands
│   │   └── e2e.js               # Support file
│   └── fixtures/                # Test data
└── cypress.config.js
```

### Running E2E Tests

```bash
cd Code-Teach-React-main

# Open Cypress Test Runner (interactive)
npm run cypress:open

# Run Cypress tests (headless)
npm run cypress:run
```

**Prerequisites:**
- Backend server must be running on `http://localhost:5000`
- Frontend server must be running on `http://localhost:3000`

### Writing E2E Tests

```javascript
describe('User Login', () => {
  it('should login successfully', () => {
    cy.visit('/signin');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/learning-dashboard');
  });
});
```

### Custom Cypress Commands

```javascript
// Login command
cy.login('test@example.com', 'password123');

// Signup command
cy.signup('username', 'email@example.com', 'password');

// Verify OTP
cy.verifyOTP('123456');
```

## Project Setup

### Prerequisites

1. **Redis** - Already running as system service
   ```bash
   # Verify Redis is running
   redis-cli ping
   # Should respond: PONG
   ```

2. **MongoDB** - Using MongoDB Atlas (cloud)
   - Connection string in `.env` file
   - Already seeded with courses

3. **Node.js** - Version 18.x or 20.x

### Starting the Application

```bash
# Terminal 1: Start Backend
cd code-teach-backend-main
npm start
# Runs on: http://localhost:5000

# Terminal 2: Start Frontend (new terminal)
cd Code-Teach-React-main
npm start
# Runs on: http://localhost:3000
```

### Running Tests

#### Backend Tests (✅ Working)
```bash
cd code-teach-backend-main
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode
```

#### Frontend Tests (✅ Working)
```bash
cd Code-Teach-React-main
npm test                    # Run all tests
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode (interactive)
```

#### E2E Tests (⚠️ Not Yet Configured)
```bash
# These commands exist but tests need actual app running
cd Code-Teach-React-main
npm run cypress:open       # Interactive mode
npm run cypress:run        # Headless mode
```

## CI/CD Integration

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration:

- **Backend Tests**: Runs on Node 18.x and 20.x
- **Frontend Tests**: Runs on Node 18.x and 20.x
- **E2E Tests**: Runs on Node 20.x
- **Build Check**: Verifies production build
- **Coverage Reports**: Uploads to Codecov

### Workflow Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Viewing CI Results

1. Go to the repository's "Actions" tab
2. Click on the latest workflow run
3. View individual job results and logs
4. Download artifacts (screenshots, videos, build files)

## Best Practices

### General

1. **Write tests first**: Follow TDD when possible
2. **Keep tests isolated**: Each test should be independent
3. **Use descriptive names**: Test names should explain what they test
4. **Test behavior, not implementation**: Focus on user-facing behavior
5. **Mock external dependencies**: Use mocks for APIs, databases, etc.

### Backend Testing

1. **Use test helpers**: Leverage `testHelpers.js` for common operations
2. **Clean up after tests**: Database is automatically cleaned between tests
3. **Test error cases**: Don't just test happy paths
4. **Use meaningful assertions**: Be specific about what you're testing

### Frontend Testing

1. **Query by accessibility**: Use `getByRole`, `getByLabelText` when possible
2. **Avoid implementation details**: Don't test internal state
3. **Test user interactions**: Simulate real user behavior
4. **Mock API calls**: Use MSW for consistent API responses

### E2E Testing

1. **Test critical flows**: Focus on important user journeys
2. **Use custom commands**: Reduce duplication with reusable commands
3. **Handle async operations**: Use Cypress's built-in retry logic
4. **Keep tests independent**: Each test should set up its own state

## Troubleshooting

### Common Issues

#### MongoDB Memory Server Fails to Start

```bash
# Clear MongoDB binary cache
rm -rf ~/.cache/mongodb-memory-server
```

#### Tests Timeout

Increase timeout in `jest.config.js`:
```javascript
testTimeout: 30000 // 30 seconds
```

#### Cypress Tests Fail Locally

Ensure servers are running:
```bash
# Terminal 1: Start backend
cd code-teach-backend-main && npm start

# Terminal 2: Start frontend
cd Code-Teach-React-main && npm start

# Terminal 3: Run Cypress
cd Code-Teach-React-main && npm run cypress:open
```

#### Coverage Not Generated

Ensure you're using the coverage scripts:
```bash
npm run test:coverage  # Not just npm test
```

### Getting Help

- Check test logs for detailed error messages
- Review the implementation plan for test structure
- Consult Jest/Cypress documentation
- Check GitHub Actions logs for CI failures

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [MSW Documentation](https://mswjs.io/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
