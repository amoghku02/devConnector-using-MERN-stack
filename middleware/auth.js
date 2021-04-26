const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    // get the token from header
    const token = req.header('x-auth-token');

    //check if there is no token
    if(!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    //check if token is valid
    try {
        const decoded = jwt.verify(token, config.get('jwtToken'));

        req.user = decoded.user;
        next();
    }catch(err) {
        res.status(401).json({ msg: 'Invalid token' });
    }
}