import { Test, TestingModule } from '@nestjs/testing';
import { AvoirController } from './avoir.controller';
import { AvoirService } from './avoir.service';

describe('AvoirController', () => {
  let controller: AvoirController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvoirController],
      providers: [AvoirService],
    }).compile();

    controller = module.get<AvoirController>(AvoirController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
