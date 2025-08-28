import { Test, TestingModule } from '@nestjs/testing';
import { LigneAvoirService } from './ligne_avoir.service';

describe('LigneAvoirService', () => {
  let service: LigneAvoirService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LigneAvoirService],
    }).compile();

    service = module.get<LigneAvoirService>(LigneAvoirService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
