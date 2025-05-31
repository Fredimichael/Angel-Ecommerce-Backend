import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto = { username: 'testuser', password: 'testpass' };
    const user = await service.create(createUserDto);
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('password');
  });

  it('should find a user by username', async () => {
    const createUserDto = { username: 'testuser', password: 'testpass' };
    await service.create(createUserDto);
    const user = await service.findOne('testuser');
    expect(user).toHaveProperty('username', 'testuser');
  });
});