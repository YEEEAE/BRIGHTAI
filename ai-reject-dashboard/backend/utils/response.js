function success(data, source, warnings) {
  return {
    success: true,
    source: source || 'unknown',
    warnings: warnings || [],
    data
  };
}

function fail(message, statusCode) {
  return {
    success: false,
    message,
    statusCode: statusCode || 500
  };
}

module.exports = { success, fail };
