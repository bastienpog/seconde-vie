<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260608120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add physical condition to items';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE item ADD `condition` VARCHAR(100) DEFAULT 'Bon état' NOT NULL");
        $this->addSql('ALTER TABLE item ALTER `condition` DROP DEFAULT');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE item DROP `condition`');
    }
}
