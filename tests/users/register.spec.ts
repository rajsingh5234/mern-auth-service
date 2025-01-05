import request from 'supertest'
import app from '../../src/app'

describe('POST /auth/register', () => {
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
      const response = await request(app).post('/auth/register').send(userData)

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
      const response = await request(app).post('/auth/register').send(userData)

      // Assert
      expect(response.headers['content-type']).toEqual(
        expect.stringContaining('json'),
      )
    })
  })

  describe('Fields are missing', () => {})
})
