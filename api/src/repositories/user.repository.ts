import { eq } from 'drizzle-orm'
import type { Database } from '../db/database'
import { users } from '../db/schema'
import type { NewUser, User } from '../db/schema'

export class UserRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user
  }

  async create(userData: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(userData).returning()

    return user
  }

  async hasUsers(): Promise<boolean> {
    const [user] = await this.db.select({ id: users.id }).from(users).limit(1)
    return user !== undefined
  }

  async update(
    id: string,
    userData: Partial<NewUser>,
  ): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()

    return user
  }
}
