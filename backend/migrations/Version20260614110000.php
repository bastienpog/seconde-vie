<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create initial administrator account';
    }

    public function up(Schema $schema): void
    {
        $passwordHash = '$2y$13$PS9SjFci4Uyk9K4vJsPpz.uE8dfRt36nGj1Vn8bf/ctiwCx6zsEhe';

        $this->addSql(sprintf(
            "INSERT INTO `user` (email, name, roles, password, created_at) VALUES ('admin@mail.com', 'Administrateur', '[\"ROLE_ADMIN\"]', '%s', NOW()) ON DUPLICATE KEY UPDATE name = 'Administrateur', roles = '[\"ROLE_ADMIN\"]', password = '%s'",
            $passwordHash,
            $passwordHash,
        ));
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DELETE FROM `user` WHERE email = 'admin@mail.com'");
    }
}
