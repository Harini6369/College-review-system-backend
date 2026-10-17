import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';

async function listUsers({ page, limit, search, role }) {
  const filter = {};
  if (role) {
    filter.role = role;
  }
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    items: items.map((user) => user.toPublic()),
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

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user.toPublic();
}

async function updateUserRole(actor, targetId, role) {
  if (actor._id.toString() === targetId && role !== 'admin') {
    throw ApiError.forbidden('You cannot demote your own admin account');
  }

  const user = await User.findById(targetId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.role = role;
  await user.save();
  return user.toPublic();
}

export { listUsers, getUserById, updateUserRole };
export default { listUsers, getUserById, updateUserRole };
