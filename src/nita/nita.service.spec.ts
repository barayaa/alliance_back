import { Test, TestingModule } from '@nestjs/testing';
import { NitaService } from './nita.service';

describe('NitaService', () => {
  let service: NitaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NitaService],
    }).compile();

    service = module.get<NitaService>(NitaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
