import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { ENV } from '../../../env'
import { AuthService } from '../auth.service'
import { User } from '../../../db/schema'

export interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ENV.JWT_SECRET,
    })
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.authService.getUserById(payload.sub)
  }
}
