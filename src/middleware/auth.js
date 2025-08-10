module.exports = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Verify token logic here (e.g., using JWT)
  // If valid, attach user info to request object
  // req.user = decodedUser;

  next();
};