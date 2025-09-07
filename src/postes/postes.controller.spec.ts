import { Test, TestingModule } from '@nestjs/testing';
import { PostesController } from './postes.controller';
import { PostesService } from './postes.service';

describe('PostesController', () => {
  let controller: PostesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostesController],
      providers: [PostesService],
    }).compile();

    controller = module.get<PostesController>(PostesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
