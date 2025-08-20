import { Test, TestingModule } from '@nestjs/testing';
import { ComptesController } from './comptes.controller';
import { ComptesService } from './comptes.service';

describe('ComptesController', () => {
  let controller: ComptesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComptesController],
      providers: [ComptesService],
    }).compile();

    controller = module.get<ComptesController>(ComptesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
