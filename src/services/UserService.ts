import { Repository } from 'typeorm'
import { User } from '../entity/User'
import { UserData } from '../types'
import createHttpError from 'http-errors'
import { ROLES } from '../constants'
import bcrypt from 'bcrypt'

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ firstName, lastName, email, password }: UserData) {
    const user = await this.userRepository.findOne({ where: { email } })

    if (user) {
      const err = createHttpError(400, 'Email is already exists')
      throw err
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    try {
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: ROLES.CUSTOMER,
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const error = createHttpError(
        500,
        'Failed to store the data in the database',
      )
      throw error
    }
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } })
  }
}
