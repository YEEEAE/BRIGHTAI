const { handleRequest } = require('../backend/server');

module.exports = async (req, res) => {
  return handleRequest(req, res);
};
