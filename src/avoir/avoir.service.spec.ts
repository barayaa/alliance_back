import { Test, TestingModule } from '@nestjs/testing';
import { AvoirService } from './avoir.service';

describe('AvoirService', () => {
  let service: AvoirService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvoirService],
    }).compile();

    service = module.get<AvoirService>(AvoirService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
