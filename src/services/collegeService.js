import mongoose from 'mongoose';
import College from '../models/College.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';

const SORT_FIELDS = {
  name: 'name',
  createdAt: 'createdAt',
  averageRating: 'averageRating',
};

function statsLookup() {
  return {
    $lookup: {
      from: 'reviews',
      let: { collegeId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$collegeId', '$$collegeId'] } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ],
      as: 'stats',
    },
  };
}

function statsAddFields() {
  return {
    $addFields: {
      averageRating: {
        $round: [
          { $ifNull: [{ $arrayElemAt: ['$stats.averageRating', 0] }, 0] },
          2,
        ],
      },
      reviewCount: {
        $ifNull: [{ $arrayElemAt: ['$stats.reviewCount', 0] }, 0],
      },
    },
  };
}

function formatCollege(doc) {
  let createdBy = null;
  if (doc.createdBy && doc.createdBy._id) {
    createdBy = {
      id: doc.createdBy._id.toString(),
      name: doc.createdBy.name,
      email: doc.createdBy.email,
      role: doc.createdBy.role,
    };
  } else if (doc.createdBy) {
    createdBy = { id: doc.createdBy.toString() };
  }

  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    location: doc.location,
    website: doc.website || null,
    createdBy,
    averageRating: Number((doc.averageRating ?? 0).toFixed(2)),
    reviewCount: doc.reviewCount ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function createCollege(payload, userId) {
  const nameNormalized = payload.name.trim().toLowerCase();
  const locationNormalized = payload.location.trim().toLowerCase();
  const duplicate = await College.findOne({ nameNormalized, locationNormalized });
  if (duplicate) {
    throw ApiError.conflict('A college with this name and location already exists');
  }

  const college = await College.create({
    name: payload.name,
    description: payload.description,
    location: payload.location,
    website: payload.website || undefined,
    createdBy: userId,
  });

  await college.populate('createdBy', 'name email role');

  return formatCollege({
    ...college.toObject(),
    averageRating: 0,
    reviewCount: 0,
  });
}

async function listColleges({ page, limit, search, location, sortBy, sortOrder }) {
  const match = {};
  if (search) {
    match.name = { $regex: escapeRegex(search), $options: 'i' };
  }
  if (location) {
    match.location = { $regex: escapeRegex(location), $options: 'i' };
  }

  const sortField = SORT_FIELDS[sortBy] || 'createdAt';
  const direction = sortOrder === 'asc' ? 1 : -1;

  const pipeline = [
    { $match: match },
    statsLookup(),
    statsAddFields(),
    { $project: { stats: 0, nameNormalized: 0, locationNormalized: 0, __v: 0 } },
    { $sort: { [sortField]: direction, _id: 1 } },
    {
      $facet: {
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'createdBy',
              foreignField: '_id',
              pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
              as: 'createdByUser',
            },
          },
          {
            $addFields: {
              createdBy: { $arrayElemAt: ['$createdByUser', 0] },
            },
          },
          { $project: { createdByUser: 0 } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await College.aggregate(pipeline);
  const items = (result.items || []).map(formatCollege);
  const total = result.total[0] ? result.total[0].count : 0;
  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items,
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

async function getCollegeById(id) {
  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    statsLookup(),
    statsAddFields(),
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, email: 1, role: 1 } }],
        as: 'createdByUser',
      },
    },
    {
      $addFields: {
        createdBy: { $arrayElemAt: ['$createdByUser', 0] },
      },
    },
    { $project: { stats: 0, createdByUser: 0, nameNormalized: 0, locationNormalized: 0, __v: 0 } },
  ];

  const [doc] = await College.aggregate(pipeline);
  if (!doc) {
    throw ApiError.notFound('College not found');
  }

  return formatCollege(doc);
}

async function updateCollege(id, payload) {
  const college = await College.findById(id);
  if (!college) {
    throw ApiError.notFound('College not found');
  }

  if (payload.name !== undefined) {
    college.name = payload.name;
  }
  if (payload.description !== undefined) {
    college.description = payload.description;
  }
  if (payload.location !== undefined) {
    college.location = payload.location;
  }
  if (payload.website !== undefined) {
    college.website = payload.website || undefined;
  }

  const nameNormalized = college.name.trim().toLowerCase();
  const locationNormalized = college.location.trim().toLowerCase();
  const duplicate = await College.findOne({
    nameNormalized,
    locationNormalized,
    _id: { $ne: college._id },
  });
  if (duplicate) {
    throw ApiError.conflict('A college with this name and location already exists');
  }

  await college.save();
  return getCollegeById(college._id.toString());
}

async function deleteCollege(id) {
  const college = await College.findById(id);
  if (!college) {
    throw ApiError.notFound('College not found');
  }

  await Review.deleteMany({ collegeId: college._id });
  await College.deleteOne({ _id: college._id });
}

export { createCollege, listColleges, getCollegeById, updateCollege, deleteCollege };
export default { createCollege, listColleges, getCollegeById, updateCollege, deleteCollege };
