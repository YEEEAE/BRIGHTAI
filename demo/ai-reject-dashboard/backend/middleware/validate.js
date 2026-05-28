function validate(schema, property) {
  return function validateRequest(req, res, next) {
    const target = property || 'body';
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map((detail) => detail.message)
      });
    }

    req[target] = value;
    return next();
  };
}

module.exports = validate;
