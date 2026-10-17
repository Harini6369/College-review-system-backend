function sendSuccess(res, { status = 200, message = 'Request successful', data = null, meta }) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
}

function sendCreated(res, { message = 'Resource created', data = null, meta }) {
  return sendSuccess(res, { status: 201, message, data, meta });
}

function sendNoContent(res) {
  return res.status(204).send();
}

export { sendSuccess, sendCreated, sendNoContent };
