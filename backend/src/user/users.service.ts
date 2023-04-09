import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { genSalt, hash, compare as comparePasswords } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async updateUser(user: User) {
    await this.usersRepository.save(user);
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.mems', 'mems')
      .leftJoinAndSelect('user.heartedMems', 'heartedMems')
      .where('user.id = :id', { id })
      .getOne();

    return user;
  }

  async getProfileInfoWithoutMems(id: number): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.usersRepository.findOneBy({ email });
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneBy({ username });
  }

  async loginUser(email: string, password: string): Promise<boolean> {
    const user = await this.findOneByEmail(email);
    if (!user) return false;
    // check user password with hashed password stored in the database
    const validPassword = await comparePasswords(password, user.password);
    return validPassword;
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async createUser(user: User): Promise<void> {
    // generate salt to hash password
    const salt = await genSalt(10);
    // now we set user password to hashed password
    user.password = await hash(user.password, salt);
    user.heartedMems = [];
    await this.usersRepository.insert(user);
  }
}
