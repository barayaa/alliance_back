import { Test, TestingModule } from '@nestjs/testing';
import { DepenseService } from './depense.service';

describe('DepenseService', () => {
  let service: DepenseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepenseService],
    }).compile();

    service = module.get<DepenseService>(DepenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
