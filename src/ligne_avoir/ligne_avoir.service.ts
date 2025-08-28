import { Injectable } from '@nestjs/common';
import { CreateLigneAvoirDto } from './dto/create-ligne_avoir.dto';
import { UpdateLigneAvoirDto } from './dto/update-ligne_avoir.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LigneAvoir } from './entities/ligne_avoir.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LigneAvoirService {
  constructor(
    @InjectRepository(LigneAvoir)
    private ligneAvoirRepository: Repository<LigneAvoir>,
  ) {}
  async create(createLigneAvoirDto: CreateLigneAvoirDto): Promise<LigneAvoir> {
    const ligneAvoir = this.ligneAvoirRepository.create(createLigneAvoirDto);
    return this.ligneAvoirRepository.save(ligneAvoir);
  }

  async findAll(): Promise<LigneAvoir[]> {
    return this.ligneAvoirRepository.find({ relations: ['avoir', 'produit'] });
  }

  async findOne(id: number): Promise<LigneAvoir> {
    const ligneAvoir = await this.ligneAvoirRepository.findOne({
      where: { id_ligne_avoir: id },
      relations: ['avoir', 'produit'],
    });
    if (!ligneAvoir) {
      throw new Error(`LigneAvoir with ID ${id} not found`);
    }
    return ligneAvoir;
  }

  async update(
    id: number,
    updateLigneAvoirDto: UpdateLigneAvoirDto,
  ): Promise<LigneAvoir> {
    const ligneAvoir = await this.findOne(id);
    Object.assign(ligneAvoir, updateLigneAvoirDto);
    return this.ligneAvoirRepository.save(ligneAvoir);
  }

  async remove(id: number): Promise<void> {
    const ligneAvoir = await this.findOne(id);
    await this.ligneAvoirRepository.remove(ligneAvoir);
  }
}
