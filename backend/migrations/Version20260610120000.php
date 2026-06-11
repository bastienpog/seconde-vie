<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260610120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add reservation dates to loan requests';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE loan_request ADD start_date DATE DEFAULT NULL, ADD end_date DATE DEFAULT NULL');
        $this->addSql('UPDATE loan_request SET start_date = DATE(created_at), end_date = DATE(created_at)');
        $this->addSql('ALTER TABLE loan_request CHANGE start_date start_date DATE NOT NULL, CHANGE end_date end_date DATE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE loan_request DROP start_date, DROP end_date');
    }
}
