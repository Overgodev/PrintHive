import { db } from '~/server/utils/db'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password are required' })
  }

  const [rows] = await db.execute(
    'SELECT user_id, username, password_hash, role FROM users WHERE username = ? LIMIT 1',
    [username]
  )

  const user = Array.isArray(rows) ? rows[0] : null

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
  if (!isPasswordValid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid username or password' })
  }

  return {
    success: true,
    user: {
      id: user.user_id,
      username: user.username,
      role: user.role
    },
    token: 'mock-token' // Replace with JWT if needed
  }
})
