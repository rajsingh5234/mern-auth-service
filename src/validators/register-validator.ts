import { checkSchema } from 'express-validator'

export default checkSchema({
  email: {
    errorMessage: 'Email is required!',
    notEmpty: true,
    trim: true,
    isEmail: {
      errorMessage: 'Email should be a valid email!',
    },
  },
  firstName: {
    errorMessage: 'Firstname is required!',
    notEmpty: true,
    trim: true,
  },
  lastName: {
    errorMessage: 'Lastname is required!',
    notEmpty: true,
    trim: true,
  },
  password: {
    errorMessage: 'Password is required!',
    notEmpty: true,
    trim: true,
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: 'Password length should be at least 8 chars!',
    },
  },
})
