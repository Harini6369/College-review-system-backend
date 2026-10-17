import authService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/apiResponse.js';

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendCreated(res, {
    message: 'Registration successful',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, {
    message: 'Login successful',
    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    message: 'Current user retrieved',
    data: authService.getCurrentUser(req.user),
  });
});

export { register, login, me };
export default { register, login, me };
