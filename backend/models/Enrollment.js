const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to block duplicate enrollment in the same course for the same academic year
enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
