import { Test, TestingModule } from '@nestjs/testing';
import { LigneAvoirController } from './ligne_avoir.controller';
import { LigneAvoirService } from './ligne_avoir.service';

describe('LigneAvoirController', () => {
  let controller: LigneAvoirController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LigneAvoirController],
      providers: [LigneAvoirService],
    }).compile();

    controller = module.get<LigneAvoirController>(LigneAvoirController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
