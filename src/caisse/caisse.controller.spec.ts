import { Test, TestingModule } from '@nestjs/testing';
import { CaisseController } from './caisse.controller';
import { CaisseService } from './caisse.service';

describe('CaisseController', () => {
  let controller: CaisseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaisseController],
      providers: [CaisseService],
    }).compile();

    controller = module.get<CaisseController>(CaisseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
