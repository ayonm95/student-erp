const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    examType: {
      type: String,
      enum: ['internal1', 'internal2', 'external'],
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index preventing duplicate grades for the same exam type per student per course
gradeSchema.index({ student: 1, course: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
