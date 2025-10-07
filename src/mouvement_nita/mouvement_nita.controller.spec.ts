import { Test, TestingModule } from '@nestjs/testing';
import { MouvementNitaController } from './mouvement_nita.controller';
import { MouvementNitaService } from './mouvement_nita.service';

describe('MouvementNitaController', () => {
  let controller: MouvementNitaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MouvementNitaController],
      providers: [MouvementNitaService],
    }).compile();

    controller = module.get<MouvementNitaController>(MouvementNitaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
