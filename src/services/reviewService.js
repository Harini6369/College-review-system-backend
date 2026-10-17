import Review from '../models/Review.js';
import College from '../models/College.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';

function publicUser(user) {
  if (!user || !user._id) {
    return user ? { id: user.toString() } : null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function formatReview(review) {
  const obj = review.toObject ? review.toObject() : review;
  const college = obj.collegeId && obj.collegeId._id
    ? {
        id: obj.collegeId._id.toString(),
        name: obj.collegeId.name,
        location: obj.collegeId.location,
      }
    : { id: obj.collegeId.toString() };

  return {
    id: obj._id.toString(),
    college,
    user: publicUser(obj.userId),
    rating: obj.rating,
    comment: obj.comment,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function assertCanModify(review, user) {
  const ownerId = review.userId._id ? review.userId._id.toString() : review.userId.toString();
  const isOwner = ownerId === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    throw ApiError.forbidden('You can only modify your own reviews');
  }
}

async function getReviewById(id) {
  const review = await Review.findById(id)
    .populate('userId', 'name email role')
    .populate('collegeId', 'name location');

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  return formatReview(review);
}

async function createReview(collegeId, user, { rating, comment }) {
  const college = await College.findById(collegeId);
  if (!college) {
    throw ApiError.notFound('College not found');
  }

  const existing = await Review.findOne({ collegeId: college._id, userId: user._id });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this college');
  }

  const review = await Review.create({
    collegeId: college._id,
    userId: user._id,
    rating,
    comment,
  });

  return getReviewById(review._id);
}

async function listReviews({
  page,
  limit,
  collegeId,
  userId,
  rating,
  search,
  sortBy,
  sortOrder,
}) {
  const filter = {};
  if (collegeId) {
    filter.collegeId = collegeId;
  }
  if (userId) {
    filter.userId = userId;
  }
  if (rating !== undefined) {
    filter.rating = rating;
  }
  if (search) {
    filter.comment = { $regex: escapeRegex(search), $options: 'i' };
  }

  const sortField = sortBy === 'rating' ? 'rating' : 'createdAt';
  const direction = sortOrder === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ [sortField]: direction, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email role')
      .populate('collegeId', 'name location'),
    Review.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: items.map(formatReview),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

async function listReviewsForCollege(collegeId, query) {
  const college = await College.findById(collegeId);
  if (!college) {
    throw ApiError.notFound('College not found');
  }

  return listReviews({ ...query, collegeId });
}

async function updateReview(id, user, payload) {
  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  assertCanModify(review, user);

  if (payload.rating !== undefined) {
    review.rating = payload.rating;
  }
  if (payload.comment !== undefined) {
    review.comment = payload.comment;
  }

  await review.save();
  return getReviewById(review._id);
}

async function deleteReview(id, user) {
  const review = await Review.findById(id);
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  assertCanModify(review, user);
  await review.deleteOne();
}

export { createReview, listReviews, listReviewsForCollege, getReviewById, updateReview, deleteReview };
export default { createReview, listReviews, listReviewsForCollege, getReviewById, updateReview, deleteReview };
