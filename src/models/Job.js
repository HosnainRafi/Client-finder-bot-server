module.exports = {
  title: String,
  description: String,
  company: String,
  location: String,
  requirements: [String],
  responsibilities: [String],
  salaryRange: {
    min: Number,
    max: Number,
    currency: String
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  applicationLink: String,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  }
};