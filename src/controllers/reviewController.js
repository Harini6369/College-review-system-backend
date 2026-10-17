import reviewService from '../services/reviewService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse.js';

const create = asyncHandler(async (req, res) => {
  const { collegeId, rating, comment } = req.body;
  const review = await reviewService.createReview(collegeId, req.user, { rating, comment });
  return sendCreated(res, {
    message: 'Review created',
    data: review,
  });
});

const list = asyncHandler(async (req, res) => {
  const result = await reviewService.listReviews(req.body);
  return sendSuccess(res, {
    message: 'Reviews retrieved',
    data: result.items,
    meta: result.meta,
  });
});

const listForCollege = asyncHandler(async (req, res) => {
  const { collegeId, ...query } = req.body;
  const result = await reviewService.listReviewsForCollege(collegeId, query);
  return sendSuccess(res, {
    message: 'Reviews retrieved',
    data: result.items,
    meta: result.meta,
  });
});

const getById = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewById(req.body.id);
  return sendSuccess(res, {
    message: 'Review retrieved',
    data: review,
  });
});

const update = asyncHandler(async (req, res) => {
  const { id, ...payload } = req.body;
  const review = await reviewService.updateReview(id, req.user, payload);
  return sendSuccess(res, {
    message: 'Review updated',
    data: review,
  });
});

const remove = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.body.id, req.user);
  return sendNoContent(res);
});

export { create, list, listForCollege, getById, update, remove };
export default { create, list, listForCollege, getById, update, remove };
