import { NextFunction, Response } from 'express'
import { AuthRequest, RegisterUserRequest } from '../types'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator'
import { JwtPayload } from 'jsonwebtoken'
import { TokenService } from '../services/TokenService'
import createHttpError from 'http-errors'
import { CredentialService } from '../services/CredentialService'
import { ROLES } from '../constants'

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
  ) {}
  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const { firstName, lastName, email, password } = req.body

    const result = validationResult(req)
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() })
      return
    }

    this.logger.debug('New request to register a user', {
      firstName,
      lastName,
      email,
      password: '*****',
    })

    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role: ROLES.CUSTOMER,
      })

      this.logger.info('User has been registered', { id: user.id })

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      }

      const accessToken = this.tokenService.generateAccessToken(payload)

      // Persist the refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user)

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      })

      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60, // 1h
        httpOnly: true, // important
      })

      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
        httpOnly: true, // important
      })

      res.status(201).json({ id: user.id })
    } catch (err) {
      next(err)
      return
    }
  }

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const { email, password } = req.body

    const result = validationResult(req)
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() })
      return
    }

    this.logger.debug('New request to login a user', {
      email,
      password: '*****',
    })

    try {
      const user = await this.userService.findByEmail(email)

      if (!user) {
        const error = createHttpError(400, 'Email or password not match')
        next(error)
        return
      }

      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      )

      if (!passwordMatch) {
        const error = createHttpError(400, 'Email or password not match')
        next(error)
        return
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      }

      const accessToken = this.tokenService.generateAccessToken(payload)

      // Persist the refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user)

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      })

      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60, // 1h
        httpOnly: true, // important
      })

      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
        httpOnly: true, // important
      })

      this.logger.info('User has been logged in', { id: user.id })

      res.json({ id: user.id })
    } catch (err) {
      next(err)
      return
    }
  }

  async self(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // token req.auth.sub
      const user = await this.userService.findById(Number(req.auth.sub))
      res.json({ ...user, password: undefined })
    } catch (err) {
      next(err)
      return
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload: JwtPayload = {
        sub: req.auth.sub,
        role: req.auth.role,
      }

      const accessToken = this.tokenService.generateAccessToken(payload)

      const user = await this.userService.findById(Number(req.auth.sub))

      if (!user) {
        const error = createHttpError(400, 'User with the token could not find')
        next(error)
        return
      }

      // Persist the refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user)

      // Delete the old refresh token
      await this.tokenService.deleteRefreshToken(Number(req.auth.id))

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      })

      res.cookie('accessToken', accessToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60, // 1h
        httpOnly: true, // important
      })

      res.cookie('refreshToken', refreshToken, {
        domain: 'localhost',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
        httpOnly: true, // important
      })

      res.status(201).json({ id: user.id })
    } catch (err) {
      next(err)
      return
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.tokenService.deleteRefreshToken(Number(req.auth.id))
      this.logger.info('Refresh token has been deleted', { id: req.auth.id })
      this.logger.info('User has been logged out', { id: req.auth.sub })

      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')
      res.json({})
    } catch (err) {
      next(err)
      return
    }
  }
}
