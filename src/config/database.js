module.exports = {
  url: process.env.DATABASE_URL || 'mongodb://localhost:27017/client-finder-bot',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
};