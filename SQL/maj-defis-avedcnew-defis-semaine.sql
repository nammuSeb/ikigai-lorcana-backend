-- Modification de la table defis existante
ALTER TABLE `defis`
  -- Ajouter un nouveau type 'pool_defis_semaine' à l'énumération
  MODIFY COLUMN `type` enum('arene','quete','defi_semaine','pool_defis_semaine') NOT NULL,
  -- Ajouter un champ pour référencer le défi original
  ADD COLUMN `id_origine` int DEFAULT NULL COMMENT 'Référence au défi original dans le pool';

-- Création de la table defis_semaine pour suivre les défis sélectionnés chaque semaine
CREATE TABLE IF NOT EXISTS `defis_semaine` (
  `id` int NOT NULL AUTO_INCREMENT,
  `defi_id` int NOT NULL COMMENT 'Référence au défi dans le pool',
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `defi_semaine_unique` (`defi_id`,`date_debut`,`date_fin`),
  KEY `date_index` (`date_debut`,`date_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Ajouter des défis existants au pool initial
INSERT INTO `defis` (`nom`, `description`, `points`, `type`, `max_points`, `points_type`)
SELECT `nom`, `description`, `points`, 'pool_defis_semaine', `max_points`, `points_type`
FROM `defis`
WHERE `type` = 'defi_semaine';

-- Mettre à jour la colonne points_gagnes dans defis_valides
ALTER TABLE `defis_valides`
ADD COLUMN `points_gagnes` int NOT NULL DEFAULT '0' AFTER `date_validation`;
