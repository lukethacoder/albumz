import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ENV } from '../../env'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserRepository } from './user.repository'
import { PasswordService } from './password.service'
import { LocalStrategy, JwtStrategy } from './strategies'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: ENV.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PasswordService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
