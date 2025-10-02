import { Test, TestingModule } from '@nestjs/testing';
import { MouvementCaisseService } from './mouvement_caisse.service';

describe('MouvementCaisseService', () => {
  let service: MouvementCaisseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MouvementCaisseService],
    }).compile();

    service = module.get<MouvementCaisseService>(MouvementCaisseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
