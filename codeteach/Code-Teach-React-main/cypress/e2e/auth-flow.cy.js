describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('User Registration', () => {
    it('should complete full registration flow with email verification', () => {
      const testUser = {
        username: 'newuser',
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!'
      };

      // Visit signup page
      cy.visit('/signup');
      
      // Fill out registration form
      cy.get('input[name="username"]').type(testUser.username);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to OTP verification page
      cy.url().should('include', '/verify-email');
      cy.contains(/verification code sent/i).should('be.visible');
      
      // Enter OTP (in real scenario, you'd need to intercept email or use test OTP)
      cy.get('input[name="otp"]').type('123456');
      cy.get('button').contains(/verify/i).click();
      
      // Should redirect to dashboard after successful verification
      cy.url().should('include', '/learning-dashboard');
      cy.contains(/welcome/i).should('be.visible');
    });

    it('should show validation errors for invalid input', () => {
      cy.visit('/signup');
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors
      cy.contains(/username is required/i).should('be.visible');
      cy.contains(/email is required/i).should('be.visible');
      cy.contains(/password is required/i).should('be.visible');
    });

    it('should show error for existing email', () => {
      cy.visit('/signup');
      
      // Try to register with existing email
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[name="email"]').type('existing@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains(/user already exists/i).should('be.visible');
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.visit('/signin');
      
      // Enter credentials
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/learning-dashboard');
      
      // Should store token in localStorage
      cy.window().then((window) => {
        expect(window.localStorage.getItem('token')).to.exist;
      });
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/signin');
      
      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Should show error message
      cy.contains(/invalid email or password/i).should('be.visible');
      
      // Should not redirect
      cy.url().should('include', '/signin');
    });

    it('should redirect admin users to admin dashboard', () => {
      cy.visit('/signin');
      
      cy.get('input[type="email"]').type('admin@example.com');
      cy.get('input[type="password"]').type('adminpassword');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to admin dashboard
      cy.url().should('include', '/admin');
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset flow', () => {
      cy.visit('/forgot-password');
      
      // Enter email
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Should show success message
      cy.contains(/reset code sent/i).should('be.visible');
      
      // Enter OTP
      cy.get('input[name="otp"]').type('123456');
      cy.get('button').contains(/verify/i).click();
      
      // Should show new password form
      cy.get('input[name="newPassword"]').should('be.visible');
      cy.get('input[name="newPassword"]').type('NewPassword123!');
      cy.get('input[name="confirmPassword"]').type('NewPassword123!');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to signin
      cy.url().should('include', '/signin');
      cy.contains(/password reset successful/i).should('be.visible');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      // Login first
      cy.login();
      
      // Click logout button
      cy.get('button').contains(/logout/i).click();
      
      // Should redirect to home page
      cy.url().should('not.include', '/learning-dashboard');
      
      // Should clear token from localStorage
      cy.window().then((window) => {
        expect(window.localStorage.getItem('token')).to.be.null;
      });
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to signin when accessing protected route without auth', () => {
      cy.visit('/learning-dashboard');
      
      // Should redirect to signin
      cy.url().should('include', '/signin');
    });

    it('should allow access to protected route with valid token', () => {
      // Login first
      cy.login();
      
      // Visit protected route
      cy.visit('/learning-dashboard');
      
      // Should stay on protected route
      cy.url().should('include', '/learning-dashboard');
    });
  });
});
