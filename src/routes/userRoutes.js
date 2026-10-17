import express from 'express';
import userController from '../controllers/userController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import {
  listUsersSchema,
  userIdBodySchema,
  updateUserRoleSchema,
} from '../validators/userValidator.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.post('/list', validate(listUsersSchema), userController.list);
router.post('/get', validate(userIdBodySchema), userController.getById);
router.post('/update-role', validate(updateUserRoleSchema), userController.updateRole);

export default router;
