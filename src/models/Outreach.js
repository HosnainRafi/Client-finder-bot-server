module.exports = {
  outreachId: {
    type: String,
    required: true,
    unique: true,
  },
  clientId: {
    type: String,
    required: true,
  },
  emailContent: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  responseReceived: {
    type: Boolean,
    default: false,
  },
  followUpCount: {
    type: Number,
    default: 0,
  },
};