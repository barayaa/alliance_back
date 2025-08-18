import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LignesCommandeAchat } from './lignes_commande_achat.entity';
import { CreateLignesCommandeAchatDto } from './dto/create-lignes_commande_achat.dto';
import { UpdateLignesCommandeAchatDto } from './dto/update-lignes_commande_achat.dto';
import { Produit } from '../produit/produit.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { CommandeAchat } from '../commande_achat/commande_achat.entity';
import { CaptureStockService } from 'src/capture_stock/capture_stock.service';
import { Log } from 'src/log/log.entity';

@Injectable()
export class LignesCommandeAchatService {
  constructor(
    @InjectRepository(LignesCommandeAchat)
    private lignesCommandeAchatRepository: Repository<LignesCommandeAchat>,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(CommandeAchat)
    private commandeAchatRepository: Repository<CommandeAchat>,

    private captureStockService: CaptureStockService,
  ) {}

  async create(
    dto: CreateLignesCommandeAchatDto,
    user: string,
    reference: any,
    id_destination: number,
    transactionalEntityManager?: EntityManager,
  ): Promise<LignesCommandeAchat> {
    const manager =
      transactionalEntityManager || this.lignesCommandeAchatRepository.manager;

    const commande = await manager.findOne(CommandeAchat, {
      where: { reference },
    });
    if (!commande) {
      throw new NotFoundException(
        `Commande avec la référence ${reference} non trouvée`,
      );
    }

    const produit = await manager.findOne(Produit, {
      where: { id_produit: dto.designation },
    });
    if (!produit) {
      throw new NotFoundException(
        `Produit avec l'ID ${dto.designation} non trouvé`,
      );
    }

    const stockAvant = produit.stock_courant || 0;
    const stockApres = stockAvant + dto.quantite;

    const ligne = manager.create(LignesCommandeAchat, {
      id_commande_achat: commande.id_commande_achat,
      designation: dto.designation,
      quantite: dto.quantite,
      qty_commandee: dto.qty_commandee || 0,
      numero_lot: dto.numero_lot || '',
      date_expiration: dto.date_expiration || '',
      conformite: dto.conformite || '',
      date: new Date(dto.date),
      pu: dto.pu || 0,
      remise: dto.remise || 0,
      montant: dto.pu
        ? dto.pu * dto.quantite * (1 - (dto.remise || 0) / 100)
        : 0,
      montant_tva: dto.montant_tva || 0,
      produit, // Set the relation
      commande_achat: commande, // Set the relation
    });

    const savedLigne = await manager.save(LignesCommandeAchat, ligne);

    const mvtStock = manager.create(MMvtStock, {
      id_produit: dto.designation,
      quantite: dto.quantite,
      cout: dto.pu ? Math.round(dto.pu * dto.quantite) : 0,
      date: new Date(),
      user,
      type: 3,
      magasin: id_destination,
      commentaire: `Entrée via commande ${reference}`,
      stock_avant: stockAvant,
      stock_apres: stockApres,
      id_commande_vente: reference,
      annule: 'NON',
      quantite_commandee: dto.qty_commandee || 0,
      num_lot: dto.numero_lot || '',
      date_expiration: dto.date_expiration
        ? new Date(dto.date_expiration)
        : null,
      conformite: dto.conformite || '',
    });

    await manager.save(MMvtStock, mvtStock);

    produit.stock_courant = stockApres;
    await manager.save(Produit, produit);

    await this.captureStockService.updateStockCapture(
      dto.designation,
      stockApres,
    );

    const logEntry = manager.create(Log, {
      log: `Entrée en stock référence ${reference}`,
      date: new Date(),
      user,
      archive: 1,
    });

    await manager.save(Log, logEntry);

    return savedLigne;
  }

  async findAll(): Promise<LignesCommandeAchat[]> {
    return this.lignesCommandeAchatRepository.find({
      relations: ['produit', 'commande_achat'],
    });
  }

  async findOne(id: number): Promise<LignesCommandeAchat> {
    const entity = await this.lignesCommandeAchatRepository.findOne({
      where: { id_ligne_commande_achat: id },
      relations: ['produit', 'commande_achat'],
    });
    if (!entity) {
      throw new NotFoundException(
        `LigneCommandeAchat avec l'ID ${id} non trouvée`,
      );
    }
    return entity;
  }

  async update(
    id: number,
    dto: UpdateLignesCommandeAchatDto,
  ): Promise<LignesCommandeAchat> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.lignesCommandeAchatRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.lignesCommandeAchatRepository.remove(entity);
  }
}
