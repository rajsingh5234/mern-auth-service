import express, { NextFunction, Request, Response } from 'express'
import { TenantController } from '../controllers/TenantController'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import { TenantService } from '../services/TenantService'
import logger from '../config/logger'
import authenticate from '../middlewares/authenticate'
import { canAccess } from '../middlewares/canAccess'
import { ROLES } from '../constants'

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)

const tenantService = new TenantService(tenantRepository)

const tenantController = new TenantController(tenantService, logger)

router.post(
  '/',
  authenticate,
  canAccess([ROLES.ADMIN]),
  (req: Request, res: Response, next: NextFunction) =>
    tenantController.create(req, res, next),
)

export default router
