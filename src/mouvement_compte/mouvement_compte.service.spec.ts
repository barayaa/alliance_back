import { Test, TestingModule } from '@nestjs/testing';
import { MouvementCompteService } from './mouvement_compte.service';

describe('MouvementCompteService', () => {
  let service: MouvementCompteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MouvementCompteService],
    }).compile();

    service = module.get<MouvementCompteService>(MouvementCompteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
