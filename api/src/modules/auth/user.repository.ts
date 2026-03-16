import { Inject, Injectable } from '@nestjs/common'
import { DRIZZLE_CLIENT } from '../../db/database.constants'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as schema from '../../db/schema'
import { eq } from 'drizzle-orm'
import { NewUser, User } from '../../db/schema'

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    return user
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    return user
  }

  async create(userData: NewUser): Promise<User> {
    const [user] = await this.db
      .insert(schema.users)
      .values(userData)
      .returning()

    return user
  }

  async update(
    id: string,
    userData: Partial<NewUser>,
  ): Promise<User | undefined> {
    const [user] = await this.db
      .update(schema.users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning()

    return user
  }
}
