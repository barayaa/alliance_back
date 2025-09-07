import { Test, TestingModule } from '@nestjs/testing';
import { PostesService } from './postes.service';

describe('PostesService', () => {
  let service: PostesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostesService],
    }).compile();

    service = module.get<PostesService>(PostesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
