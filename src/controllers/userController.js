import userService from '../services/userService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const list = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.body);
  return sendSuccess(res, {
    message: 'Users retrieved',
    data: result.items,
    meta: result.meta,
  });
});

const getById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.body.id);
  return sendSuccess(res, {
    message: 'User retrieved',
    data: user,
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const { id, role } = req.body;
  const user = await userService.updateUserRole(req.user, id, role);
  return sendSuccess(res, {
    message: 'User role updated',
    data: user,
  });
});

export { list, getById, updateRole };
export default { list, getById, updateRole };
