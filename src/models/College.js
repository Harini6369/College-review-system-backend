import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nameNormalized: {
      type: String,
      required: true,
    },
    locationNormalized: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

collegeSchema.index({ nameNormalized: 1, locationNormalized: 1 }, { unique: true });
collegeSchema.index({ createdAt: -1 });
collegeSchema.index({ name: 1 });
collegeSchema.index({ locationNormalized: 1 });

collegeSchema.pre('validate', function normalizeIdentity() {
  if (this.name) {
    this.nameNormalized = this.name.trim().toLowerCase();
  }
  if (this.location) {
    this.locationNormalized = this.location.trim().toLowerCase();
  }
});

export default mongoose.model('College', collegeSchema);
