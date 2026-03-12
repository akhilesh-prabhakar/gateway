function errorLogger(req, res, next) {
  const startTime = Date.now();
  let responseBody;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };

  res.send = (body) => {
    responseBody = body;
    return originalSend(body);
  };

  res.on('finish', () => {
    if (res.statusCode < 400) {
      return;
    }

    const durationMs = Date.now() - startTime;
    const message =
      responseBody && typeof responseBody === 'object'
        ? responseBody.message
        : undefined;

    const base = `[${new Date().toISOString()}] ${req.method} ${
      req.originalUrl
    } -> ${res.statusCode} (${durationMs}ms)`;
    const details = message ? ` - ${message}` : '';

    console.error(base + details);

    if (res.locals && res.locals.error) {
      console.error(res.locals.error);
    }
  });

  next();
}

module.exports = { errorLogger };
