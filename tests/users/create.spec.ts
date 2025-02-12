import { DataSource } from 'typeorm'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import { AppDataSource } from '../../src/config/data-source'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { ROLES } from '../../src/constants'
import { createTenant } from '../utils'
import { Tenant } from '../../src/entity/Tenant'

describe('POST /users', () => {
  let connection: DataSource
  let jwks: ReturnType<typeof createJWKSMock>

  beforeAll(async () => {
    jwks = createJWKSMock('http://localhost:5501')
    connection = await AppDataSource.initialize()
  })

  beforeEach(async () => {
    jwks.start()
    await connection.dropDatabase()
    await connection.synchronize()
  })

  afterEach(() => {
    jwks.stop()
  })

  afterAll(async () => {
    await connection?.destroy()
  })

  describe('Given all fields', () => {
    it('should persist the user in the database', async () => {
      // Create tenant first
      const tenant = await createTenant(connection.getRepository(Tenant))

      const adminToken = jwks.token({
        sub: '1',
        role: ROLES.ADMIN,
      })

      // Register user
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      }

      // Add token to cookie
      const response = await request(app)
        .post('/users')
        .set('Cookie', [`accessToken=${adminToken};`])
        .send(userData)

      expect(response.statusCode).toBe(201)

      const userRepository = connection.getRepository(User)
      const users = await userRepository.find()

      expect(users).toHaveLength(1)
      expect(users[0].email).toBe(userData.email)
    })

    it('should create a manager user', async () => {
      // Create tenant
      const tenant = await createTenant(connection.getRepository(Tenant))

      const adminToken = jwks.token({
        sub: '1',
        role: ROLES.ADMIN,
      })

      // Register user
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      }

      // Add token to cookie
      const response = await request(app)
        .post('/users')
        .set('Cookie', [`accessToken=${adminToken};`])
        .send(userData)

      expect(response.statusCode).toBe(201)

      const userRepository = connection.getRepository(User)
      const users = await userRepository.find()

      expect(users).toHaveLength(1)
      expect(users[0].role).toBe(ROLES.MANAGER)
    })

    it('should return 403 if non admin user tries to create a user', async () => {
      // Create tenant first
      const tenant = await createTenant(connection.getRepository(Tenant))

      const nonAdminToken = jwks.token({
        sub: '1',
        role: ROLES.MANAGER,
      })

      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
        tenantId: tenant.id,
        role: ROLES.MANAGER,
      }

      // Add token to cookie
      const response = await request(app)
        .post('/users')
        .set('Cookie', [`accessToken=${nonAdminToken};`])
        .send(userData)

      expect(response.statusCode).toBe(403)

      const userRepository = connection.getRepository(User)
      const users = await userRepository.find()

      expect(users).toHaveLength(0)
    })
  })
})
