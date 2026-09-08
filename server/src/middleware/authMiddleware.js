const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Provide default engineer user for seamless demonstration
    req.user = { id: 'guest_user_1', name: 'DRDO Thermal Engineer', email: 'engineer@drdo.in' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'drdo_passive_shelter_thermal_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    req.user = { id: 'guest_user_1', name: 'DRDO Thermal Engineer', email: 'engineer@drdo.in' };
    next();
  }
};

module.exports = authMiddleware;
