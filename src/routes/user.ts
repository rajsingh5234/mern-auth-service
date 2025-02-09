import express, { NextFunction, Response } from 'express'
import authenticate from '../middlewares/authenticate'
import { canAccess } from '../middlewares/canAccess'
import { CreateUserRequest, UpdateUserRequest } from '../types'
import { ROLES } from '../constants'
import { UserController } from '../controllers/UserController'
import { UserService } from '../services/UserService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import createUserValidator from '../validators/create-user-validator'
import updateUserValidator from '../validators/update-user-validator'
import logger from '../config/logger'
import listUsersValidator from '../validators/list-users-validator'
import { Request } from 'express-jwt'

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)

const userService = new UserService(userRepository)

const userController = new UserController(userService, logger)

router.post(
  '/',
  authenticate,
  canAccess([ROLES.ADMIN]),
  createUserValidator,
  (req: CreateUserRequest, res: Response, next: NextFunction) =>
    userController.create(req, res, next),
)

router.patch(
  '/:id',
  authenticate,
  canAccess([ROLES.ADMIN]),
  updateUserValidator,
  (req: UpdateUserRequest, res: Response, next: NextFunction) =>
    userController.update(req, res, next),
)

router.get(
  '/',
  authenticate,
  canAccess([ROLES.ADMIN]),
  listUsersValidator,
  (req: Request, res: Response, next: NextFunction) =>
    userController.getAll(req, res, next),
)

router.get('/:id', authenticate, canAccess([ROLES.ADMIN]), (req, res, next) =>
  userController.getOne(req, res, next),
)

router.delete(
  '/:id',
  authenticate,
  canAccess([ROLES.ADMIN]),
  (req, res, next) => userController.destroy(req, res, next),
)

export default router
