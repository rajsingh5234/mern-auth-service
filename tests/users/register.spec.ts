import request from 'supertest'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { ROLES } from '../../src/constants'
import { isJwt } from '../utils'

describe('POST /auth/register', () => {
  let connection: DataSource

  beforeAll(async () => {
    connection = await AppDataSource.initialize()
  })

  beforeEach(async () => {
    // database truncate
    await connection.dropDatabase()
    await connection.synchronize()
  })

  afterAll(async () => {
    await connection.destroy()
  })

  describe('Given all fields', () => {
    it('should return 201 status code', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(201)
    })

    it('should return valid json response', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.headers['content-type']).toEqual(
        expect.stringContaining('json'),
      )
    })

    it('should persist user in database', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(1)
      expect(users[0].firstName).toBe(userData.firstName)
      expect(users[0].lastName).toBe(userData.lastName)
      expect(users[0].email).toBe(userData.email)
    })

    it('should return an id of the created user', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.body).toHaveProperty('id')
      const repository = connection.getRepository(User)
      const users = await repository.find()
      expect((response.body as Record<string, string>).id).toBe(users[0].id)
    })

    it('should assign a customer rule', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users[0].role).toBe(ROLES.CUSTOMER)
    })

    it('should store hashed password in database', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users[0].password).not.toBe(userData.password)
      expect(users[0].password).toHaveLength(60)
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
    })

    it('should return 400 status code if email is already exists', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      const userRespository = connection.getRepository(User)
      await userRespository.save({ ...userData, role: ROLES.CUSTOMER })

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const users = await userRespository.find()
      expect(users).toHaveLength(1)
    })

    it('should return the access token and refresh token inside the cookie', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert

      // accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjkzOTA5Mjc2LCJleHAiOjE2OTM5MDkzMzYsImlzcyI6Im1lcm5zcGFjZSJ9.KetQMEzY36vxhO6WKwSR-P_feRU1yI-nJtp6RhCEZQTPlQlmVsNTP7mO-qfCdBr0gszxHi9Jd1mqf-hGhfiK8BRA_Zy2CH9xpPTBud_luqLMvfPiz3gYR24jPjDxfZJscdhE_AIL6Uv2fxCKvLba17X0WbefJSy4rtx3ZyLkbnnbelIqu5J5_7lz4aIkHjt-rb_sBaoQ0l8wE5KzyDNy7mGUf7cI_yR8D8VlO7x9llbhvCHF8ts6YSBRBt_e2Mjg5txtfBaDq5auCTXQ2lmnJtMb75t1nAFu8KwQPrDYmwtGZDkHUcpQhlP7R-y3H99YnrWpXbP8Zr_oO67hWnoCSw; Max-Age=43200; Domain=localhost; Path=/; Expires=Tue, 05 Sep 2023 22:21:16 GMT; HttpOnly; SameSite=Strict
      interface Headers {
        ['set-cookie']: string[]
      }

      let accessToken = null
      let refreshToken = null

      const cookies =
        (response.headers as unknown as Headers)['set-cookie'] || []

      cookies.forEach((cookie) => {
        if (cookie.startsWith('accessToken=')) {
          accessToken = cookie.split(';')[0].split('=')[1]
        }

        if (cookie.startsWith('refreshToken=')) {
          refreshToken = cookie.split(';')[0].split('=')[1]
        }
      })

      expect(accessToken).not.toBeNull()
      expect(refreshToken).not.toBeNull()

      console.log(accessToken)

      expect(isJwt(accessToken)).toBeTruthy()
      expect(isJwt(refreshToken)).toBeTruthy()
    })
  })

  describe('Fields are missing', () => {
    it('should return 400 status code if email field is missing', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: '',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(0)
    })

    it('should return 400 status code if firstName field is missing', async () => {
      // Arrange
      const userData = {
        firstName: '',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(0)
    })

    it('should return 400 status code if lastName field is missing', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: '',
        email: 'raj@gmail.com',
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(0)
    })

    it('should return 400 status code if password field is missing', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: '',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(0)
    })
  })

  describe('Fields are not in proper format', () => {
    it('should trim the email field', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: ' raj@gmail.com ',
        password: 'password',
      }

      // Act
      await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      const user = users[0]
      expect(user.email).toBe(userData.email.trim())
    })

    it('should return 400 status code if email is not a valid email', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj', // invalid email
        password: 'password',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(0)
    })

    it('should return 400 status code if password length is less than 8 chars', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'secret', // password length is less than 8 characters
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(400)
      const userRespository = connection.getRepository(User)
      const users = await userRespository.find()
      expect(users).toHaveLength(0)
    })

    it('shoud return an array of error messages if email is missing', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: '',
        password: 'password',
      }
      // Act
      const response = await request(app).post('/auth/register').send(userData)

      // Assert
      expect(response.body).toHaveProperty('errors')
      expect(
        (response.body as Record<string, string>).errors.length,
      ).toBeGreaterThan(0)
    })
  })
})
