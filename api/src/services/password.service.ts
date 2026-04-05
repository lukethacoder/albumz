import * as bcrypt from 'bcrypt'

export class PasswordService {
  private readonly saltRounds = 10

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds)
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }
}

// Export singleton instance
export const passwordService = new PasswordService()
