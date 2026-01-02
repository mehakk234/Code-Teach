const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: false, // Make optional for now
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Advanced', 'Intermediate to Advanced', 'Comprehensive'],
    default: 'Beginner'
  },
  duration: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    
  },
  price: {
    type: String,
    required: false // Add price field
  },
  image: {
    type: String,
    required: false // Add image field
  },
  path: {
    type: String,
    required: false, // Make optional
    unique: true,
    sparse: true // Allow multiple null values
  }
}, { 
  timestamps: true,
  collection: 'courses' // explicitly set collection name
});

// Auto-generate path and debug middleware
courseSchema.pre('save', function(next) {
  // Auto-generate path if not provided
  if (!this.path) {
    this.path = '/modules/' + this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  console.log('Attempting to save course:', JSON.stringify(this.toObject(), null, 2));
  next();
});

// Create indexes for better query performance
courseSchema.index({ title: 1 }, { unique: true });
courseSchema.index({ path: 1 }, { unique: true, sparse: true });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ updatedAt: -1 });

// Compound indexes for common queries
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ category: 1, createdAt: -1 });

// Text index for search functionality
courseSchema.index({ 
  title: 'text', 
  description: 'text',
  category: 'text'
}, {
  weights: {
    title: 10,
    category: 5,
    description: 1
  }
});

module.exports = mongoose.model('Course', courseSchema);
