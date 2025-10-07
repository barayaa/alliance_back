import { Test, TestingModule } from '@nestjs/testing';
import { NitaController } from './nita.controller';
import { NitaService } from './nita.service';

describe('NitaController', () => {
  let controller: NitaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NitaController],
      providers: [NitaService],
    }).compile();

    controller = module.get<NitaController>(NitaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
