describe('Course Enrollment Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.login();
  });

  describe('Browse Courses', () => {
    it('should display list of available courses', () => {
      cy.visit('/courses');
      
      // Should show course cards
      cy.get('[data-testid="course-card"]').should('have.length.greaterThan', 0);
      
      // Each course should have title, description, and difficulty
      cy.get('[data-testid="course-card"]').first().within(() => {
        cy.get('[data-testid="course-title"]').should('be.visible');
        cy.get('[data-testid="course-description"]').should('be.visible');
        cy.get('[data-testid="course-difficulty"]').should('be.visible');
      });
    });

    it('should filter courses by difficulty', () => {
      cy.visit('/courses');
      
      // Select difficulty filter
      cy.get('[data-testid="difficulty-filter"]').select('Beginner');
      
      // Should only show beginner courses
      cy.get('[data-testid="course-difficulty"]').each(($el) => {
        expect($el.text()).to.include('Beginner');
      });
    });

    it('should search courses by title', () => {
      cy.visit('/courses');
      
      // Type in search box
      cy.get('[data-testid="course-search"]').type('JavaScript');
      
      // Should filter courses
      cy.get('[data-testid="course-card"]').should('have.length.lessThan', 10);
      cy.get('[data-testid="course-title"]').first().should('contain', 'JavaScript');
    });
  });

  describe('Course Enrollment', () => {
    it('should enroll in a course successfully', () => {
      cy.visit('/courses');
      
      // Click on first course
      cy.get('[data-testid="course-card"]').first().click();
      
      // Should navigate to course details
      cy.url().should('include', '/courses/');
      
      // Click enroll button
      cy.get('button').contains(/enroll/i).click();
      
      // Should show success message
      cy.contains(/successfully enrolled/i).should('be.visible');
      
      // Button should change to "Continue Learning"
      cy.get('button').contains(/continue learning/i).should('be.visible');
    });

    it('should show enrolled courses in dashboard', () => {
      // Enroll in a course first
      cy.visit('/courses');
      cy.get('[data-testid="course-card"]').first().click();
      cy.get('button').contains(/enroll/i).click();
      
      // Navigate to dashboard
      cy.visit('/learning-dashboard');
      
      // Should show enrolled course
      cy.get('[data-testid="enrolled-course"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="progress-bar"]').should('be.visible');
    });

    it('should not allow enrolling in same course twice', () => {
      // Enroll in a course
      cy.visit('/courses');
      cy.get('[data-testid="course-card"]').first().click();
      cy.get('button').contains(/enroll/i).click();
      
      // Try to enroll again
      cy.get('button').contains(/enroll/i).should('not.exist');
      cy.get('button').contains(/continue learning/i).should('be.visible');
    });
  });

  describe('Course Progress Tracking', () => {
    beforeEach(() => {
      // Enroll in a course
      cy.visit('/courses');
      cy.get('[data-testid="course-card"]').first().click();
      cy.get('button').contains(/enroll/i).click();
      cy.get('button').contains(/continue learning/i).click();
    });

    it('should display course modules', () => {
      // Should show module list
      cy.get('[data-testid="module-list"]').should('be.visible');
      cy.get('[data-testid="module-item"]').should('have.length.greaterThan', 0);
    });

    it('should mark module as complete when finished', () => {
      // Click on first module
      cy.get('[data-testid="module-item"]').first().click();
      
      // Navigate through module content
      cy.get('button').contains(/next/i).click();
      
      // Complete module
      cy.get('button').contains(/mark as complete/i).click();
      
      // Should show completion checkmark
      cy.get('[data-testid="module-item"]').first().within(() => {
        cy.get('[data-testid="completion-icon"]').should('be.visible');
      });
    });

    it('should update progress bar when completing modules', () => {
      // Get initial progress
      cy.get('[data-testid="progress-percentage"]').invoke('text').then((initialProgress) => {
        // Complete a module
        cy.get('[data-testid="module-item"]').first().click();
        cy.get('button').contains(/mark as complete/i).click();
        
        // Progress should increase
        cy.get('[data-testid="progress-percentage"]').invoke('text').should((newProgress) => {
          expect(parseInt(newProgress)).to.be.greaterThan(parseInt(initialProgress));
        });
      });
    });

    it('should show completion certificate when course is 100% complete', () => {
      // Complete all modules (simplified - in reality would need to complete each)
      cy.get('[data-testid="module-item"]').each(($module) => {
        cy.wrap($module).click();
        cy.get('button').contains(/mark as complete/i).click();
      });
      
      // Should show certificate
      cy.contains(/congratulations/i).should('be.visible');
      cy.get('[data-testid="certificate"]').should('be.visible');
      cy.get('button').contains(/download certificate/i).should('be.visible');
    });
  });

  describe('Course Unenrollment', () => {
    it('should unenroll from a course', () => {
      // Enroll in a course first
      cy.visit('/courses');
      cy.get('[data-testid="course-card"]').first().click();
      cy.get('button').contains(/enroll/i).click();
      
      // Go to dashboard
      cy.visit('/learning-dashboard');
      
      // Click unenroll button
      cy.get('[data-testid="enrolled-course"]').first().within(() => {
        cy.get('button').contains(/unenroll/i).click();
      });
      
      // Confirm unenrollment
      cy.get('button').contains(/confirm/i).click();
      
      // Should show success message
      cy.contains(/successfully unenrolled/i).should('be.visible');
      
      // Course should be removed from enrolled list
      cy.get('[data-testid="enrolled-course"]').should('have.length', 0);
    });
  });

  describe('Resume Learning', () => {
    it('should resume from last accessed module', () => {
      // Enroll and start a course
      cy.visit('/courses');
      cy.get('[data-testid="course-card"]').first().click();
      cy.get('button').contains(/enroll/i).click();
      cy.get('button').contains(/continue learning/i).click();
      
      // Access a specific module
      cy.get('[data-testid="module-item"]').eq(2).click();
      
      // Go back to dashboard
      cy.visit('/learning-dashboard');
      
      // Click continue learning
      cy.get('[data-testid="enrolled-course"]').first().within(() => {
        cy.get('button').contains(/continue/i).click();
      });
      
      // Should resume at the last accessed module
      cy.get('[data-testid="current-module"]').should('contain', 'Module 3');
    });
  });
});
