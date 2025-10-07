import { Test, TestingModule } from '@nestjs/testing';
import { MouvementNitaService } from './mouvement_nita.service';

describe('MouvementNitaService', () => {
  let service: MouvementNitaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MouvementNitaService],
    }).compile();

    service = module.get<MouvementNitaService>(MouvementNitaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
