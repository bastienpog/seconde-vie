<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260609130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Cascade item deletion when deleting a user account';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE item DROP FOREIGN KEY FK_1F1B251E7E3C61F9');
        $this->addSql('ALTER TABLE item ADD CONSTRAINT FK_1F1B251E7E3C61F9 FOREIGN KEY (owner_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE item DROP FOREIGN KEY FK_1F1B251E7E3C61F9');
        $this->addSql('ALTER TABLE item ADD CONSTRAINT FK_1F1B251E7E3C61F9 FOREIGN KEY (owner_id) REFERENCES `user` (id)');
    }
}
