<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260609120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create loan request table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE loan_request (id INT AUTO_INCREMENT NOT NULL, item_id INT NOT NULL, borrower_id INT NOT NULL, status VARCHAR(30) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', updated_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_15D801EB126F525E (item_id), INDEX IDX_15D801EB11CE312B (borrower_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE loan_request ADD CONSTRAINT FK_15D801EB126F525E FOREIGN KEY (item_id) REFERENCES item (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE loan_request ADD CONSTRAINT FK_15D801EB11CE312B FOREIGN KEY (borrower_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE loan_request DROP FOREIGN KEY FK_15D801EB126F525E');
        $this->addSql('ALTER TABLE loan_request DROP FOREIGN KEY FK_15D801EB11CE312B');
        $this->addSql('DROP TABLE loan_request');
    }
}
