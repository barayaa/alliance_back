import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Poste } from './entities/poste.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { Direction } from 'src/direction/entities/direction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostesService {
  constructor(
    @InjectRepository(Poste)
    private posteRepository: Repository<Poste>,
    @InjectRepository(Direction)
    private directionRepository: Repository<Direction>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async create(createPosteDto: CreatePosteDto): Promise<Poste> {
    const { directionId, menuIds, ...posteData } = createPosteDto;

    const direction = await this.directionRepository.findOne({
      where: { id: directionId },
    });
    if (!direction) {
      throw new NotFoundException(`Direction with ID ${directionId} not found`);
    }

    const poste = this.posteRepository.create({
      ...posteData,
      direction,
    });

    // Associer les menus si fournis
    if (menuIds && menuIds.length > 0) {
      const menus = await this.menuRepository.findByIds(menuIds);
      if (menus.length !== menuIds.length) {
        throw new NotFoundException('One or more menus not found');
      }
      poste.menus = menus;
    }

    return this.posteRepository.save(poste);
  }

  // Récupérer tous les postes (avec leurs directions et menus)
  async findAll(): Promise<Poste[]> {
    return this.posteRepository.find({
      relations: ['direction', 'menus'],
    });
  }

  // Récupérer un poste par ID (avec sa direction et ses menus)
  async findOne(id: number): Promise<Poste> {
    const poste = await this.posteRepository.findOne({
      where: { id },
      relations: ['direction', 'menus', 'menus.submenus'],
    });
    if (!poste) {
      throw new NotFoundException(`Poste with ID ${id} not found`);
    }
    return poste;
  }

  // Mettre à jour un poste
  async update(id: number, updatePosteDto: UpdatePosteDto): Promise<Poste> {
    const { directionId, menuIds, ...posteData } = updatePosteDto;
    const poste = await this.findOne(id); // Vérifie si le poste existe

    // Mettre à jour les propriétés du poste
    Object.assign(poste, posteData);

    // Mettre à jour la direction si fournie
    if (directionId !== undefined) {
      const direction = await this.directionRepository.findOne({
        where: { id: directionId },
      });
      if (!direction) {
        throw new NotFoundException(
          `Direction with ID ${directionId} not found`,
        );
      }
      poste.direction = direction;
    }

    // Mettre à jour les menus si fournis
    if (menuIds !== undefined) {
      const menus =
        menuIds.length > 0 ? await this.menuRepository.findByIds(menuIds) : [];
      if (menuIds.length > 0 && menus.length !== menuIds.length) {
        throw new NotFoundException('One or more menus not found');
      }
      poste.menus = menus;
    }

    return this.posteRepository.save(poste);
  }

  // Supprimer un poste
  async remove(id: number): Promise<void> {
    const poste = await this.findOne(id); // Vérifie si le poste existe
    await this.posteRepository.remove(poste);
  }

  // Associer un menu à un poste
  async assignMenuToPoste(posteId: number, menuId: number): Promise<void> {
    const poste = await this.findOne(posteId);
    const menu = await this.menuRepository.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }
    poste.menus = poste.menus ? [...poste.menus, menu] : [menu];
    await this.posteRepository.save(poste);
  }

  // Dissocier un menu d’un poste
  async removeMenuFromPoste(posteId: number, menuId: number): Promise<void> {
    const poste = await this.findOne(posteId);
    poste.menus = poste.menus.filter((menu) => menu.id !== menuId);
    await this.posteRepository.save(poste);
  }
}
