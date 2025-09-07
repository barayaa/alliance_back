import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { Poste } from '../postes/entities/poste.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Poste)
    private posteRepository: Repository<Poste>,
  ) {}

  // Créer un nouveau menu
  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const { parentId, ...menuData } = createMenuDto;

    // Créer une nouvelle instance de Menu
    const menu = this.menuRepository.create(menuData);

    // Si un parentId est fourni, associer le menu à son parent
    if (parentId) {
      const parent = await this.menuRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent menu with ID ${parentId} not found`,
        );
      }
      menu.parent = parent;
    }

    return this.menuRepository.save(menu);
  }

  // Récupérer tous les menus (avec leurs sous-menus)
  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: ['submenus'],
      where: { parent: null }, // Retourne uniquement les menus racine
    });
  }

  // Récupérer un menu par ID (avec ses sous-menus)
  async findOne(id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['submenus', 'parent'],
    });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
    return menu;
  }

  // Mettre à jour un menu
  async update(id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const { parentId, ...menuData } = updateMenuDto;

    const menu = await this.findOne(id); // Vérifie si le menu existe

    // Mettre à jour les propriétés du menu
    Object.assign(menu, menuData);

    // Si parentId est fourni, mettre à jour la relation parent
    if (parentId !== undefined) {
      if (parentId === null) {
        menu.parent = null;
      } else {
        const parent = await this.menuRepository.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new NotFoundException(
            `Parent menu with ID ${parentId} not found`,
          );
        }
        menu.parent = parent;
      }
    }

    return this.menuRepository.save(menu);
  }

  // Supprimer un menu
  async remove(id: number): Promise<void> {
    const menu = await this.findOne(id); // Vérifie si le menu existe
    await this.menuRepository.remove(menu);
  }

  // Récupérer les menus associés à un poste (seulement les menus racine)
  async getMenusByPoste(posteId: number): Promise<Menu[]> {
    const poste = await this.posteRepository.findOne({
      where: { id: posteId },
      relations: ['menus', 'menus.submenus'],
    });
    if (!poste) {
      throw new NotFoundException(`Poste with ID ${posteId} not found`);
    }
    return poste.menus.filter((menu) => !menu.parent);
  }

  // Associer un menu à un poste
  async assignMenuToPoste(menuId: number, posteId: number): Promise<void> {
    const menu = await this.menuRepository.findOne({ where: { id: menuId } });
    const poste = await this.posteRepository.findOne({
      where: { id: posteId },
      relations: ['menus'],
    });

    if (!menu || !poste) {
      throw new NotFoundException('Menu or Poste not found');
    }

    // Ajouter le menu à la liste des menus du poste
    poste.menus = poste.menus ? [...poste.menus, menu] : [menu];
    await this.posteRepository.save(poste);
  }

  // Dissocier un menu d’un poste
  async removeMenuFromPoste(menuId: number, posteId: number): Promise<void> {
    const poste = await this.posteRepository.findOne({
      where: { id: posteId },
      relations: ['menus'],
    });
    if (!poste) {
      throw new NotFoundException(`Poste with ID ${posteId} not found`);
    }

    poste.menus = poste.menus.filter((menu) => menu.id !== menuId);
    await this.posteRepository.save(poste);
  }
}
