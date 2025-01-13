import express, { NextFunction, Response } from 'express'
import authenticate from '../middlewares/authenticate'
import { canAccess } from '../middlewares/canAccess'
import { CreateUserRequest } from '../types'
import { ROLES } from '../constants'
import { UserController } from '../controllers/UserController'
import { UserService } from '../services/UserService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)

const userService = new UserService(userRepository)

const userController = new UserController(userService)

router.post(
  '/',
  authenticate,
  canAccess([ROLES.ADMIN]),
  (req: CreateUserRequest, res: Response, next: NextFunction) =>
    userController.create(req, res, next),
)

export default router
