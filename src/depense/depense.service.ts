import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { Depense } from './entities/depense.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { DataSource, Repository } from 'typeorm';
import { MouvementCaisse } from 'src/mouvement_caisse/entities/mouvement_caisse.entity';
import { MouvementCompte } from 'src/mouvement_compte/entities/mouvement_compte.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
import { Nita } from 'src/nita/entities/nita.entity';
import { MouvementNita } from 'src/mouvement_nita/entities/mouvement_nita.entity';

@Injectable()
export class DepenseService {
  constructor(
    @InjectRepository(Depense)
    private depenseRepository: Repository<Depense>,
    @InjectRepository(Compte)
    private compteRepository: Repository<Compte>,
    @InjectRepository(Caisse)
    private caisseRepository: Repository<Caisse>,

    @InjectRepository(Nita)
    private nitaRepository: Repository<Nita>,

    @InjectRepository(TypeReglement)
    private typeReglementRepository: Repository<TypeReglement>,
    private dataSource: DataSource,
  ) {}

  // async create(createDepenseDto: CreateDepenseDto): Promise<Depense> {
  //   const { montant, id_compte, id_caisse, description, id_type_reglement } =
  //     createDepenseDto;

  //   // Validations initiales
  //   if (!id_compte && !id_caisse) {
  //     throw new BadRequestException(
  //       'Vous devez fournir soit id_compte, soit id_caisse',
  //     );
  //   }
  //   if (id_compte && id_caisse) {
  //     throw new BadRequestException(
  //       'Vous ne pouvez pas fournir à la fois id_compte et id_caisse',
  //     );
  //   }
  //   if (montant <= 0) {
  //     throw new BadRequestException('Le montant doit être positif');
  //   }

  //   // Valider le type de règlement
  //   const typeReglement = await this.typeReglementRepository.findOne({
  //     where: { id_type_reglement },
  //   });
  //   if (!typeReglement) {
  //     throw new NotFoundException(
  //       `Type de règlement avec l'ID ${id_type_reglement} non trouvé`,
  //     );
  //   }

  //   // Vérifier la cohérence entre type de règlement et compte/caisse
  //   if (typeReglement.type_reglement === 'E' && !id_caisse) {
  //     throw new BadRequestException(
  //       'id_caisse est requis pour un règlement en espèces',
  //     );
  //   }
  //   if (['D', 'V'].includes(typeReglement.type_reglement) && !id_compte) {
  //     throw new BadRequestException(
  //       'id_compte est requis pour un règlement par chèque ou virement',
  //     );
  //   }

  //   // Transaction pour garantir l'intégrité
  //   try {
  //     return await this.dataSource.transaction(
  //       async (transactionalEntityManager) => {
  //         let compte: Compte | null = null;
  //         let caisse: Caisse | null = null;
  //         let mouvementCaisse: MouvementCaisse | null = null;
  //         let mouvementCompte: MouvementCompte | null = null;

  //         // Gérer le compte
  //         if (id_compte) {
  //           compte = await transactionalEntityManager.findOne(Compte, {
  //             where: { id_compte },
  //           });
  //           if (!compte) {
  //             throw new BadRequestException('Compte non trouvé');
  //           }
  //           if (compte.solde < montant) {
  //             throw new BadRequestException('Solde du compte insuffisant');
  //           }
  //           const soldeCompteAvant = compte.solde || 0;
  //           compte.solde = soldeCompteAvant - montant;

  //           // Créer le mouvement de compte
  //           mouvementCompte = new MouvementCompte();
  //           mouvementCompte.id_compte = id_compte;
  //           mouvementCompte.compte = compte;
  //           mouvementCompte.type_mouvement = 'DEBIT';
  //           mouvementCompte.montant = montant;
  //           mouvementCompte.date_mouvement = new Date();
  //           mouvementCompte.type_operation = 'DEPENSE';
  //           mouvementCompte.solde_avant = soldeCompteAvant;
  //           mouvementCompte.solde_apres = compte.solde;
  //           mouvementCompte.libelle = `Dépense - ${description || 'Dépense sans description'}`;
  //         }

  //         // Gérer la caisse
  //         if (id_caisse) {
  //           caisse = await transactionalEntityManager.findOne(Caisse, {
  //             where: { id_caisse },
  //           });
  //           if (!caisse) {
  //             throw new BadRequestException('Caisse non trouvée');
  //           }
  //           if (caisse.solde < montant) {
  //             throw new BadRequestException('Solde de la caisse insuffisant');
  //           }
  //           const soldeCaisseAvant = caisse.solde || 0;
  //           caisse.solde = soldeCaisseAvant - montant;

  //           // Créer le mouvement de caisse
  //           mouvementCaisse = new MouvementCaisse();
  //           mouvementCaisse.id_caisse = id_caisse;
  //           mouvementCaisse.caisse = caisse;
  //           mouvementCaisse.type_mouvement = 'SORTIE';
  //           mouvementCaisse.montant = montant;
  //           mouvementCaisse.date_mouvement = new Date();
  //           mouvementCaisse.type_operation = 'DEPENSE';
  //           mouvementCaisse.solde_avant = soldeCaisseAvant;
  //           mouvementCaisse.solde_apres = caisse.solde;
  //           mouvementCaisse.libelle = `Dépense - ${description || 'Dépense sans description'}`;
  //         }

  //         // Créer l'objet de données pour la dépense sans les null
  //         const depenseToCreate = transactionalEntityManager.create(Depense, {
  //           montant,
  //           date: createDepenseDto.date,
  //           description,
  //           id_type_reglement,
  //           ...(id_compte && { id_compte }),
  //           ...(id_caisse && { id_caisse }),
  //         });

  //         // Sauvegarder la dépense
  //         const savedDepense =
  //           await transactionalEntityManager.save(depenseToCreate);

  //         // Sauvegarder compte et mouvement
  //         if (compte && mouvementCompte) {
  //           mouvementCompte.id_depense = savedDepense.id_depense;
  //           await transactionalEntityManager.save(compte);
  //           await transactionalEntityManager.save(mouvementCompte);
  //         }

  //         // Sauvegarder caisse et mouvement
  //         if (caisse && mouvementCaisse) {
  //           mouvementCaisse.id_depense = savedDepense.id_depense;
  //           await transactionalEntityManager.save(caisse);
  //           await transactionalEntityManager.save(mouvementCaisse);
  //         }

  //         // Logs de confirmation
  //         if (caisse) {
  //           console.log(
  //             `✅ Caisse ${id_caisse} mise à jour: solde=${caisse.solde}`,
  //           );
  //         }
  //         if (compte) {
  //           console.log(
  //             `✅ Compte ${id_compte} mis à jour: solde=${compte.solde}`,
  //           );
  //         }
  //         console.log(`✅ Dépense enregistrée: ID=${savedDepense.id_depense}`);

  //         return savedDepense;
  //       },
  //     );
  //   } catch (error) {
  //     console.error('❌ Erreur lors de la création de la dépense:', error);

  //     if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
  //       throw new BadRequestException(
  //         'Erreur de validation: vous devez fournir soit un compte, soit une caisse',
  //       );
  //     }

  //     throw new BadRequestException(
  //       error.message || 'Erreur lors de la création de la dépense',
  //     );
  //   }
  // }

  async create(createDepenseDto: CreateDepenseDto): Promise<Depense> {
    const {
      montant,
      id_compte,
      id_caisse,
      id_nita,
      description,
      id_type_reglement,
    } = createDepenseDto;

    // Validations initiales - un seul mode de paiement à la fois
    const paymentMethods = [id_compte, id_caisse, id_nita].filter(Boolean);
    if (paymentMethods.length === 0) {
      throw new BadRequestException(
        'Vous devez fournir soit id_compte, soit id_caisse, soit id_nita',
      );
    }
    if (paymentMethods.length > 1) {
      throw new BadRequestException(
        "Vous ne pouvez fournir qu'un seul mode de paiement (compte, caisse ou nita)",
      );
    }
    if (montant <= 0) {
      throw new BadRequestException('Le montant doit être positif');
    }

    // Valider le type de règlement
    const typeReglement = await this.typeReglementRepository.findOne({
      where: { id_type_reglement },
    });
    if (!typeReglement) {
      throw new NotFoundException(
        `Type de règlement avec l'ID ${id_type_reglement} non trouvé`,
      );
    }

    // Vérifier la cohérence entre type de règlement et compte/caisse/nita
    if (typeReglement.type_reglement === 'E' && !id_caisse) {
      throw new BadRequestException(
        'id_caisse est requis pour un règlement en espèces',
      );
    }
    if (['D', 'V'].includes(typeReglement.type_reglement) && !id_compte) {
      throw new BadRequestException(
        'id_compte est requis pour un règlement par chèque ou virement',
      );
    }
    if (typeReglement.type_reglement === 'N' && !id_nita) {
      throw new BadRequestException(
        'id_nita est requis pour un règlement NITA',
      );
    }

    // Transaction pour garantir l'intégrité
    try {
      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          let compte: Compte | null = null;
          let caisse: Caisse | null = null;
          let nita: Nita | null = null;
          let mouvementCaisse: MouvementCaisse | null = null;
          let mouvementCompte: MouvementCompte | null = null;
          let mouvementNita: MouvementNita | null = null;

          // Gérer le compte
          if (id_compte) {
            compte = await transactionalEntityManager.findOne(Compte, {
              where: { id_compte },
            });
            if (!compte) {
              throw new BadRequestException('Compte non trouvé');
            }
            if (compte.solde < montant) {
              throw new BadRequestException('Solde du compte insuffisant');
            }
            const soldeCompteAvant = compte.solde || 0;
            compte.solde = soldeCompteAvant - montant;

            // Créer le mouvement de compte
            mouvementCompte = new MouvementCompte();
            mouvementCompte.id_compte = id_compte;
            mouvementCompte.compte = compte;
            mouvementCompte.type_mouvement = 'DEBIT';
            mouvementCompte.montant = montant;
            mouvementCompte.date_mouvement = new Date();
            mouvementCompte.type_operation = 'DEPENSE';
            mouvementCompte.solde_avant = soldeCompteAvant;
            mouvementCompte.solde_apres = compte.solde;
            mouvementCompte.libelle = `Dépense - ${description || 'Dépense sans description'}`;
          }

          // Gérer la caisse
          if (id_caisse) {
            caisse = await transactionalEntityManager.findOne(Caisse, {
              where: { id_caisse },
            });
            if (!caisse) {
              throw new BadRequestException('Caisse non trouvée');
            }
            if (caisse.solde < montant) {
              throw new BadRequestException('Solde de la caisse insuffisant');
            }
            const soldeCaisseAvant = caisse.solde || 0;
            caisse.solde = soldeCaisseAvant - montant;

            // Créer le mouvement de caisse
            mouvementCaisse = new MouvementCaisse();
            mouvementCaisse.id_caisse = id_caisse;
            mouvementCaisse.caisse = caisse;
            mouvementCaisse.type_mouvement = 'SORTIE';
            mouvementCaisse.montant = montant;
            mouvementCaisse.date_mouvement = new Date();
            mouvementCaisse.type_operation = 'DEPENSE';
            mouvementCaisse.solde_avant = soldeCaisseAvant;
            mouvementCaisse.solde_apres = caisse.solde;
            mouvementCaisse.libelle = `Dépense - ${description || 'Dépense sans description'}`;
          }

          // Gérer NITA
          if (id_nita) {
            nita = await transactionalEntityManager.findOne(Nita, {
              where: { id_nita },
            });
            if (!nita) {
              throw new BadRequestException('NITA non trouvé');
            }
            if (nita.solde < montant) {
              throw new BadRequestException('Solde NITA insuffisant');
            }
            const soldeNitaAvant = nita.solde || 0;
            nita.solde = soldeNitaAvant - montant;

            // Créer le mouvement NITA
            mouvementNita = new MouvementNita();
            mouvementNita.id_nita = id_nita;
            mouvementNita.nita = nita;
            mouvementNita.type_mouvement = 'DEBIT';
            mouvementNita.montant = montant;
            mouvementNita.date_mouvement = new Date();
            mouvementNita.type_operation = 'DEPENSE';
            mouvementNita.solde_avant = soldeNitaAvant;
            mouvementNita.solde_apres = nita.solde;
            mouvementNita.libelle = `Dépense NITA - ${description || 'Dépense sans description'}`;
            mouvementNita.type_operation = `DEPENSE-NITA-${Date.now()}`;
          }

          // Créer l'objet de données pour la dépense
          const depenseToCreate = transactionalEntityManager.create(Depense, {
            montant,
            date: createDepenseDto.date,
            description,
            id_type_reglement,
            ...(id_compte && { id_compte }),
            ...(id_caisse && { id_caisse }),
            ...(id_nita && { id_nita }),
          });

          // Sauvegarder la dépense
          const savedDepense =
            await transactionalEntityManager.save(depenseToCreate);

          // Sauvegarder compte et mouvement
          if (compte && mouvementCompte) {
            mouvementCompte.id_depense = savedDepense.id_depense;
            await transactionalEntityManager.save(compte);
            await transactionalEntityManager.save(mouvementCompte);
          }

          // Sauvegarder caisse et mouvement
          if (caisse && mouvementCaisse) {
            mouvementCaisse.id_depense = savedDepense.id_depense;
            await transactionalEntityManager.save(caisse);
            await transactionalEntityManager.save(mouvementCaisse);
          }

          // Sauvegarder NITA et mouvement
          if (nita && mouvementNita) {
            mouvementNita.id_depense = savedDepense.id_depense;
            await transactionalEntityManager.save(nita);
            await transactionalEntityManager.save(mouvementNita);
          }

          // Logs de confirmation
          if (caisse) {
            console.log(
              `✅ Caisse ${id_caisse} mise à jour: solde=${caisse.solde}`,
            );
          }
          if (compte) {
            console.log(
              `✅ Compte ${id_compte} mis à jour: solde=${compte.solde}`,
            );
          }
          if (nita) {
            console.log(`✅ NITA ${id_nita} mis à jour: solde=${nita.solde}`);
          }
          console.log(`✅ Dépense enregistrée: ID=${savedDepense.id_depense}`);

          return savedDepense;
        },
      );
    } catch (error) {
      console.error('❌ Erreur lors de la création de la dépense:', error);

      if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        throw new BadRequestException(
          'Erreur de validation: vous devez fournir soit un compte, soit une caisse, soit un NITA',
        );
      }

      throw new BadRequestException(
        error.message || 'Erreur lors de la création de la dépense',
      );
    }
  }

  async findAll(): Promise<Depense[]> {
    return this.depenseRepository.find({
      relations: ['compte', 'caisse', 'nita', 'typeReglement'],
    });
  }

  async findOne(id: number): Promise<Depense> {
    const depense = await this.depenseRepository.findOne({
      where: { id_depense: id },
      relations: ['compte', 'caisse', 'nita', 'typeReglement'],
    });
    if (!depense) {
      throw new NotFoundException(`Depense #${id} not found`);
    }
    return depense;
  }

  async update(
    id: number,
    updateDepenseDto: UpdateDepenseDto,
  ): Promise<Depense> {
    const depense = await this.findOne(id);
    const { montant, id_compte, id_caisse, id_nita } = updateDepenseDto;

    // Handle balance adjustments if montant, id_compte, id_caisse, or id_nita changes
    if (
      montant !== undefined ||
      id_compte !== undefined ||
      id_caisse !== undefined ||
      id_nita !== undefined
    ) {
      // Revert previous balance
      if (depense.compte) {
        const compte = await this.compteRepository.findOneBy({
          id_compte: depense.compte.id_compte,
        });
        compte.solde += depense.montant;
        await this.compteRepository.save(compte);
      } else if (depense.caisse) {
        const caisse = await this.caisseRepository.findOneBy({
          id_caisse: depense.caisse.id_caisse,
        });
        caisse.solde += depense.montant;
        await this.caisseRepository.save(caisse);
      } else if (depense.nita) {
        const nita = await this.nitaRepository.findOneBy({
          id_nita: depense.nita.id_nita,
        });
        nita.solde += depense.montant;
        await this.nitaRepository.save(nita);
      }

      // Apply new balance
      const newMontant = montant !== undefined ? montant : depense.montant;

      if (id_compte || (depense.compte && id_compte !== undefined)) {
        const compte = await this.compteRepository.findOneBy({
          id_compte: id_compte || depense.compte.id_compte,
        });
        if (!compte) {
          throw new BadRequestException('Compte not found');
        }
        if (compte.solde < newMontant) {
          throw new BadRequestException('Insufficient balance in compte');
        }
        compte.solde -= newMontant;
        await this.compteRepository.save(compte);
        depense.compte = compte;
        depense.caisse = null;
        depense.nita = null;
      } else if (id_caisse || (depense.caisse && id_caisse !== undefined)) {
        const caisse = await this.caisseRepository.findOneBy({
          id_caisse: id_caisse || depense.caisse.id_caisse,
        });
        if (!caisse) {
          throw new BadRequestException('Caisse not found');
        }
        if (caisse.solde < newMontant) {
          throw new BadRequestException('Insufficient balance in caisse');
        }
        caisse.solde -= newMontant;
        await this.caisseRepository.save(caisse);
        depense.caisse = caisse;
        depense.compte = null;
        depense.nita = null;
      } else if (id_nita || (depense.nita && id_nita !== undefined)) {
        const nita = await this.nitaRepository.findOneBy({
          id_nita: id_nita || depense.nita.id_nita,
        });
        if (!nita) {
          throw new BadRequestException('NITA not found');
        }
        if (nita.solde < newMontant) {
          throw new BadRequestException('Insufficient balance in NITA');
        }
        nita.solde -= newMontant;
        await this.nitaRepository.save(nita);
        depense.nita = nita;
        depense.compte = null;
        depense.caisse = null;
      } else {
        throw new BadRequestException(
          'Must provide either id_compte, id_caisse or id_nita',
        );
      }
    }

    Object.assign(depense, updateDepenseDto);
    return this.depenseRepository.save(depense);
  }

  async remove(id: number): Promise<void> {
    const depense = await this.findOne(id);

    // Revert balance before deletion
    if (depense.compte) {
      const compte = await this.compteRepository.findOneBy({
        id_compte: depense.compte.id_compte,
      });
      compte.solde += depense.montant;
      await this.compteRepository.save(compte);
    } else if (depense.caisse) {
      const caisse = await this.caisseRepository.findOneBy({
        id_caisse: depense.caisse.id_caisse,
      });
      caisse.solde += depense.montant;
      await this.caisseRepository.save(caisse);
    } else if (depense.nita) {
      const nita = await this.nitaRepository.findOneBy({
        id_nita: depense.nita.id_nita,
      });
      nita.solde += depense.montant;
      await this.nitaRepository.save(nita);
    }

    await this.depenseRepository.delete(id);
  }
}
