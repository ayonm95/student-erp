const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index to speed up lookups by student and course
attendanceSchema.index({ student: 1, course: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
