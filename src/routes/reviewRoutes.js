import express from 'express';
import reviewController from '../controllers/reviewController.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import {
  listReviewsSchema,
  reviewIdBodySchema,
  updateReviewSchema,
} from '../validators/reviewValidator.js';

const router = express.Router();

router.post('/list', validate(listReviewsSchema), reviewController.list);
router.post('/get', validate(reviewIdBodySchema), reviewController.getById);
router.post('/update', authenticate, validate(updateReviewSchema), reviewController.update);
router.post('/delete', authenticate, validate(reviewIdBodySchema), reviewController.remove);

export default router;
