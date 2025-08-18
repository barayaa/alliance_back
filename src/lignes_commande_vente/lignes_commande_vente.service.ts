import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LignesCommandeVente } from './lignes_commande_vente.entity';
import { CreateLignesCommandeVenteDto } from './dto/create-lignes_commande_vente.dto';
import { UpdateLignesCommandeVenteDto } from './dto/update-lignes_commande_vente.dto';
import { Produit } from '../produit/produit.entity';
// import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { Isb } from '../isb/isb.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { CaptureStockService } from '../capture_stock/capture_stock.service';
import { MMvtStock } from 'src/m_mvt_stock/m_mvt_stock.entity';
import { Log } from 'src/log/log.entity';

@Injectable()
export class LignesCommandeVenteService {
  constructor(
    @InjectRepository(LignesCommandeVente)
    private lignes_commande_venteRepository: Repository<LignesCommandeVente>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,

    private captureStockService: CaptureStockService, // Injecte le service
    // @InjectRepository(Isb)
    // private isbRepository: Repository<Isb>,
  ) {}

  async findAll(): Promise<LignesCommandeVente[]> {
    return this.lignes_commande_venteRepository.find();
  }

  async findOne(id: number): Promise<LignesCommandeVente> {
    const entity = await this.lignes_commande_venteRepository.findOne({
      where: { id_ligne_commande_vente: id },
      relations: ['produit', 'commandeVente'],
    });
    if (!entity) throw new NotFoundException('LignesCommandeVente not found');
    return entity;
  }

  async create(
    dto: CreateLignesCommandeVenteDto,
    id_commande_vente: number,
    login: string,
  ): Promise<LignesCommandeVente> {
    return this.lignes_commande_venteRepository.manager.transaction(
      async (manager) => {
        console.log(
          `Appel à create avec id_commande_vente: ${id_commande_vente}, login: ${login}, stack: ${new Error().stack}`,
        );

        if (!id_commande_vente) {
          throw new BadRequestException('id_commande_vente est requis');
        }

        const produit = await manager.findOne(Produit, {
          where: { id_produit: dto.id_produit },
        });
        if (!produit) {
          throw new NotFoundException(
            `Produit avec id ${dto.id_produit} non trouvé`,
          );
        }

        const stockActuel = produit.stock_courant || 0;
        if (stockActuel < dto.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour le produit ${produit.produit}. Disponible: ${stockActuel}, demandé: ${dto.quantite}`,
          );
        }

        const prix_vente = produit.prix_unitaire || 0;
        const remise = 0;
        const taux_tva = produit.taux_tva || 0;
        const isb_ligne = 0;
        const group_tva = produit.group_tva || 'A';
        const etiquette_tva = produit.etiquette_tva || 'TVA1';
        const date = new Date().toISOString().split('T')[0];

        const prix_vente_avant_remise = prix_vente.toString();
        const montant = prix_vente * dto.quantite;
        const montant_tva = montant * (taux_tva / 100);

        const ligne = manager.create(LignesCommandeVente, {
          id_commande_vente,
          designation: dto.id_produit,
          produit,
          prix_vente,
          remise,
          description_remise: dto.description_remise || '',
          prix_vente_avant_remise,
          quantite: dto.quantite,
          montant,
          group_tva,
          etiquette_tva,
          taux_tva,
          montant_tva,
          isb_ligne,
          date,
          stock_avant: stockActuel,
          stock_apres: stockActuel - dto.quantite,
          retour: 0,
        });

        const savedLigne = await manager.save(ligne);

        await manager.update(
          Produit,
          { id_produit: dto.id_produit },
          { stock_courant: stockActuel - dto.quantite },
        );

        const mvtStock = manager.create(MMvtStock, {
          id_produit: dto.id_produit,
          quantite: -dto.quantite,
          quantite_commandee: 0,
          cout: produit.prix_unitaire || 0,
          date: new Date(),
          user: login,
          type: 2,
          magasin: 1,
          commentaire: `Vente via commande ${id_commande_vente}`,
          stock_avant: stockActuel,
          stock_apres: stockActuel - dto.quantite,
          id_commande_vente, // Assure-toi que cette valeur est valide
          annule: 'N',
          num_lot: '',
          date_expiration: null,
          conformite: 'O',
        });

        await manager.save(mvtStock);

        await this.captureStockService.updateStockCapture(
          dto.id_produit,
          stockActuel - dto.quantite,
        );

        const logEntry = manager.create(Log, {
          log: `Enregistrement d’une vente N° ${id_commande_vente}`,
          date: new Date(),
          user: login,
          archive: 1,
        });

        await manager.save(Log, logEntry);

        return savedLigne;
      },
    );
  }

  async update(
    id: number,
    dto: UpdateLignesCommandeVenteDto,
  ): Promise<LignesCommandeVente> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.lignes_commande_venteRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.lignes_commande_venteRepository.remove(entity);
  }
}
