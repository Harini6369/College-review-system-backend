import express from 'express';
import collegeController from '../controllers/collegeController.js';
import reviewController from '../controllers/reviewController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import {
  createCollegeSchema,
  updateCollegeSchema,
  listCollegesSchema,
  collegeIdBodySchema,
} from '../validators/collegeValidator.js';
import {
  createReviewSchema,
  listCollegeReviewsSchema,
} from '../validators/reviewValidator.js';

const router = express.Router();

router.post('/list', validate(listCollegesSchema), collegeController.list);
router.post('/create', authenticate, authorize('admin'), validate(createCollegeSchema), collegeController.create);
router.post('/get', validate(collegeIdBodySchema), collegeController.getById);
router.post('/update', authenticate, authorize('admin'), validate(updateCollegeSchema), collegeController.update);
router.post('/delete', authenticate, authorize('admin'), validate(collegeIdBodySchema), collegeController.remove);

router.post('/reviews/list', validate(listCollegeReviewsSchema), reviewController.listForCollege);
router.post(
  '/reviews/create',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validate(createReviewSchema),
  reviewController.create
);

export default router;
