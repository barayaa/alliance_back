import { Test, TestingModule } from '@nestjs/testing';
import { CaisseService } from './caisse.service';

describe('CaisseService', () => {
  let service: CaisseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaisseService],
    }).compile();

    service = module.get<CaisseService>(CaisseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
