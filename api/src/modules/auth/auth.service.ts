import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserRepository } from './user.repository'
import { PasswordService } from './password.service'
import { RegisterDto, AuthResponseDto } from './dto'
import { User } from '../../db/schema'

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(registerDto.email)
    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    // Hash the password
    const hashedPassword = await this.passwordService.hash(registerDto.password)

    // Create the user
    const user = await this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    })

    // Generate JWT token
    return this.generateAuthResponse(user)
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      return null
    }

    const isPasswordValid = await this.passwordService.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive')
    }

    return user
  }

  async login(user: User): Promise<AuthResponseDto> {
    return this.generateAuthResponse(user)
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = { sub: user.id, email: user.email }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      tokenType: 'bearer',
      expiresIn: 3600, // 1 hour
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      },
    }
  }
}
