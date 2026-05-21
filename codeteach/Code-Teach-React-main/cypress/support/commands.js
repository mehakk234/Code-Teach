// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/signin');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/learning-dashboard');
});

// Custom command for signup
Cypress.Commands.add('signup', (username, email, password) => {
  cy.visit('/signup');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Custom command for verifying OTP
Cypress.Commands.add('verifyOTP', (otp = '123456') => {
  cy.get('input[name="otp"]').type(otp);
  cy.get('button').contains(/verify/i).click();
});

// Custom command to clear database (requires backend endpoint)
Cypress.Commands.add('clearDatabase', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/clear-database`);
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/seed-data`);
});
