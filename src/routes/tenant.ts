import express, { NextFunction, Response } from 'express'
import { TenantController } from '../controllers/TenantController'
import { AppDataSource } from '../config/data-source'
import { Tenant } from '../entity/Tenant'
import { TenantService } from '../services/TenantService'
import logger from '../config/logger'
import authenticate from '../middlewares/authenticate'
import { canAccess } from '../middlewares/canAccess'
import { ROLES } from '../constants'
import tenantValidator from '../validators/tenant-validator'
import { CreateTenantRequest } from '../types'
import listTenantsValidator from '../validators/list-tenants-validator'
import { Request } from 'express-jwt'

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)

const tenantService = new TenantService(tenantRepository)

const tenantController = new TenantController(tenantService, logger)

router.post(
  '/',
  authenticate,
  canAccess([ROLES.ADMIN]),
  tenantValidator,
  (req: CreateTenantRequest, res: Response, next: NextFunction) =>
    tenantController.create(req, res, next),
)

router.patch(
  '/:id',
  authenticate,
  canAccess([ROLES.ADMIN]),
  tenantValidator,
  (req: CreateTenantRequest, res: Response, next: NextFunction) =>
    tenantController.update(req, res, next),
)

router.get(
  '/',
  listTenantsValidator,
  (req: Request, res: Response, next: NextFunction) =>
    tenantController.getAll(req, res, next),
)
router.get('/:id', authenticate, canAccess([ROLES.ADMIN]), (req, res, next) =>
  tenantController.getOne(req, res, next),
)
router.delete(
  '/:id',
  authenticate,
  canAccess([ROLES.ADMIN]),
  (req, res, next) => tenantController.destroy(req, res, next),
)

export default router
