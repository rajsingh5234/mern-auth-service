import request from 'supertest'
import app from '../../src/app'
import { User } from '../../src/entity/User'
import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import { truncateTables } from '../utils'

describe('POST /auth/register', () => {
  let connection: DataSource

  beforeAll(async () => {
    connection = await AppDataSource.initialize()
  })

  beforeEach(async () => {
    // database truncate
    await truncateTables(connection)
  })

  afterAll(async () => {
    await connection.destroy()
  })

  describe('Given all fields', () => {
    it('Should return 201 status code', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'secret',
      }

      // Act
      const response = await request(app as any)
        .post('/auth/register')
        .send(userData)

      // Assert
      expect(response.statusCode).toBe(201)
    })

    it('Should return valid json response', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'secret',
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

    it('Should persist user in database', async () => {
      // Arrange
      const userData = {
        firstName: 'raj',
        lastName: 'singh',
        email: 'raj@gmail.com',
        password: 'secret',
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
  })

  describe('Fields are missing', () => {})
})
