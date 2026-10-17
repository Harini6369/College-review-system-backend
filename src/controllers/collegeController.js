import collegeService from '../services/collegeService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse.js';

const create = asyncHandler(async (req, res) => {
  const college = await collegeService.createCollege(req.body, req.user._id);
  return sendCreated(res, {
    message: 'College created',
    data: college,
  });
});

const list = asyncHandler(async (req, res) => {
  const result = await collegeService.listColleges(req.body);
  return sendSuccess(res, {
    message: 'Colleges retrieved',
    data: result.items,
    meta: result.meta,
  });
});

const getById = asyncHandler(async (req, res) => {
  const college = await collegeService.getCollegeById(req.body.id);
  return sendSuccess(res, {
    message: 'College retrieved',
    data: college,
  });
});

const update = asyncHandler(async (req, res) => {
  const { id, ...payload } = req.body;
  const college = await collegeService.updateCollege(id, payload);
  return sendSuccess(res, {
    message: 'College updated',
    data: college,
  });
});

const remove = asyncHandler(async (req, res) => {
  await collegeService.deleteCollege(req.body.id);
  return sendNoContent(res);
});

export { create, list, getById, update, remove };
export default { create, list, getById, update, remove };
