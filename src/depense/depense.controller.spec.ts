import { Test, TestingModule } from '@nestjs/testing';
import { DepenseController } from './depense.controller';
import { DepenseService } from './depense.service';

describe('DepenseController', () => {
  let controller: DepenseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepenseController],
      providers: [DepenseService],
    }).compile();

    controller = module.get<DepenseController>(DepenseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
