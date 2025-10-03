import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ReglementModule } from './reglement/reglement.module';
import { TypeReglementModule } from './type_reglement/type_reglement.module';
import { UserModule } from './user/user.module';
import { LignesProformatModule } from './lignes_proformat/lignes_proformat.module';
import { FicheVisiteModule } from './fiche_visite/fiche_visite.module';
import { FormeModule } from './forme/forme.module';
import { FournisseurModule } from './fournisseur/fournisseur.module';
import { TitulaireAmm } from './titulaire_amm/titulaire_amm.entity';
import { LignesCommandeAchatModule } from './lignes_commande_achat/lignes_commande_achat.module';
import { LignesCommandeVenteModule } from './lignes_commande_vente/lignes_commande_vente.module';
import { ClasseTherapeutiqueModule } from './classe_therapeutique/classe_therapeutique.module';
import { ProduitModule } from './produit/produit.module';
import { ClientModule } from './client/client.module';
import { ConformiteModule } from './conformite/conformite.module';
import { StatutProduitModule } from './statut_produit/statut_produit.module';
import { LogModule } from './log/log.module';
import { LogsFacturationModule } from './logs_facturation/logs_facturation.module';
import { CommandeAchat } from './commande_achat/commande_achat.entity';
import { CommandeVenteModule } from './commande_vente/commande_vente.module';
import { NatureReclamationModule } from './nature_reclamation/nature_reclamation.module';
import { ReclamationModule } from './reclamation/reclamation.module';
import { MMvtStockModule } from './m_mvt_stock/m_mvt_stock.module';
import { CaptureStockModule } from './capture_stock/capture_stock.module';
import { IsbModule } from './isb/isb.module';
import { MarqueModule } from './marque/marque.module';
import { FabricantModule } from './fabricant/fabricant.module';
import { TypeMvtModule } from './type_mvt/type_mvt.module';
import { RemiseModule } from './remise/remise.module';
import { StatutModule } from './statut/statut.module';
import { DestinationModule } from './destination/destination.module';
import { DemandeAchatModule } from './demande_achat/demande_achat.module';
import { EntreesDeletedModule } from './entrees_deleted/entrees_deleted.module';
import { InvoicesDeletedModule } from './invoices_deleted/invoices_deleted.module';
import { LignesDemandeAchatModule } from './lignes_demande_achat/lignes_demande_achat.module';
import { MoyenReglementModule } from './moyen_reglement/moyen_reglement.module';
import { ReceiptTypeModule } from './receipt_type/receipt_type.module';
import { ReleveFacturesModule } from './releve_factures/releve_factures.module';
import { RepMcfModule } from './rep_mcf/rep_mcf.module';
import { TaxGroupModule } from './tax_group/tax_group.module';
import { TaxableModule } from './taxable/taxable.module';
import { TypeStatModule } from './type_stat/type_stat.module';
import { VoieAdministrationModule } from './voie_administration/voie_administration.module';
import { ProformatModule } from './proformat/proformat.module';
import { TitulaireAmmModule } from './titulaire_amm/titulaire_amm.module';
import { CommandeAchatModule } from './commande_achat/commande_achat.module';
import { SuiviStockModule } from './suivi_stock/suivi_stock.module';
import { BanquesModule } from './banques/banques.module';
import { ComptesModule } from './comptes/comptes.module';
import { CaisseModule } from './caisse/caisse.module';
import { AvoirModule } from './avoir/avoir.module';
import { LigneAvoirModule } from './ligne_avoir/ligne_avoir.module';
import { DirectionModule } from './direction/direction.module';
import { PostesModule } from './postes/postes.module';
import { MenuModule } from './menu/menu.module';
import { DataSource } from 'typeorm';
import { DepenseModule } from './depense/depense.module';
import { parseJawsDbUrl } from './utils/db_url-parser';
import { AuditModule } from './audit/audit.module';
import { MouvementCaisseModule } from './mouvement_caisse/mouvement_caisse.module';
import { MouvementCompteModule } from './mouvement_compte/mouvement_compte.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ConfigModule.forRoot({}),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'y2w3wxldca8enczv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
      port: 3306,
      username: 'eue0kgjy0g754e2c',
      password: 'j1lx54lu8ep9bszb',
      database: 'w14j56cmvoln8hwx',
      // type: 'mariadb',
      // host: 'localhost',
      // port: 3306,
      // username: 'root',
      // password: 'root',
      // database: 'mercredi_db',
      migrations: ['src/migrations/*.ts'],
      autoLoadEntities: true,
      synchronize: false,
      // ssl: {
      //   rejectUnauthorized: false,
      // },
      poolSize: 3,
      extra: {
        connectionLimit: 3,
      },
      // entities: [__dirname + '/**/*.entity{.ts,.js}'],
      //  synchronize: true,
      // logging: true,
    }),

    AuthModule,
    ReglementModule,
    TypeReglementModule,
    UserModule,
    LignesCommandeAchatModule,
    LignesCommandeVenteModule,
    LignesProformatModule,
    FicheVisiteModule,
    FormeModule,
    FournisseurModule,
    TitulaireAmmModule,
    ClasseTherapeutiqueModule,
    ProduitModule,
    ClientModule,
    ConformiteModule,
    StatutProduitModule,
    LogModule,
    LogsFacturationModule,
    CommandeAchatModule,
    CommandeVenteModule,
    ReclamationModule,
    NatureReclamationModule,
    MMvtStockModule,
    CaptureStockModule,
    IsbModule,
    MarqueModule,
    FabricantModule,
    TypeMvtModule,
    RemiseModule,
    StatutModule,
    DestinationModule,
    DemandeAchatModule,
    EntreesDeletedModule,
    InvoicesDeletedModule,
    LignesDemandeAchatModule,
    MoyenReglementModule,
    ReceiptTypeModule,
    ReleveFacturesModule,
    RepMcfModule,
    TaxGroupModule,
    TaxableModule,
    TypeStatModule,
    VoieAdministrationModule,
    ProformatModule,
    SuiviStockModule,
    BanquesModule,
    ComptesModule,
    CaisseModule,
    AvoirModule,
    LigneAvoirModule,
    DirectionModule,
    PostesModule,
    MenuModule,
    DepenseModule,
    AuditModule,
    MouvementCaisseModule,
    MouvementCompteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
