import { Test, TestingModule } from '@nestjs/testing';
import { MouvementCompteController } from './mouvement_compte.controller';
import { MouvementCompteService } from './mouvement_compte.service';

describe('MouvementCompteController', () => {
  let controller: MouvementCompteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MouvementCompteController],
      providers: [MouvementCompteService],
    }).compile();

    controller = module.get<MouvementCompteController>(MouvementCompteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
