import { Test, TestingModule } from '@nestjs/testing';
import { MouvementCaisseController } from './mouvement_caisse.controller';
import { MouvementCaisseService } from './mouvement_caisse.service';

describe('MouvementCaisseController', () => {
  let controller: MouvementCaisseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MouvementCaisseController],
      providers: [MouvementCaisseService],
    }).compile();

    controller = module.get<MouvementCaisseController>(MouvementCaisseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
