module.exports = {
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  company: String,
  industry: String,
  jobTitle: String,
  website: String,
  phone: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
};