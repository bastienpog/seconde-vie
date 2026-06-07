<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260607120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add name to user accounts';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE `user` ADD name VARCHAR(100) DEFAULT 'Utilisateur' NOT NULL");
        $this->addSql('ALTER TABLE `user` ALTER name DROP DEFAULT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE `user` DROP name');
    }
}
