import { TRPCError } from '@trpc/server'
import { UserRepository } from '../repositories/user.repository'
import { PasswordService } from './password.service'
import type { RegisterInput, AuthResponse } from '../schemas/auth.schema'
import type { User } from '../db/schema'
import { ENV } from '../env'

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtSign: (payload: any) => string,
  ) {}

  async register(registerDto: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    )
    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Email already registered',
      })
    }

    // Hash the password
    const hashedPassword = await this.passwordService.hash(registerDto.password)

    // Create the user
    const user = await this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      username: registerDto.username,
    })

    // Generate JWT token
    return this.generateAuthResponse(user)
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      return null
    }

    const isPasswordValid = await this.passwordService.compare(
      password,
      user.password,
    )
    if (!isPasswordValid) {
      return null
    }

    if (!user.isActive) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User account is inactive',
      })
    }

    return user
  }

  async login(user: User): Promise<AuthResponse> {
    return this.generateAuthResponse(user)
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }
    return user
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload = { sub: user.id, email: user.email }
    const accessToken = this.jwtSign(payload)

    // 7 days in seconds for development convenience
    // In production, consider using refresh tokens for longer sessions
    const expiresIn = 7 * 24 * 60 * 60 // 7 days

    return {
      accessToken,
      tokenType: 'bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
      },
    }
  }
}
