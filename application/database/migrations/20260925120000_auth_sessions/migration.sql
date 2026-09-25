-- Rename the old (misspelled, nullable) column instead of dropping it.
-- Rows without a hash get '' and can't sign in until a password is set.
UPDATE `users` SET `hasedPassword` = '' WHERE `hasedPassword` IS NULL;
ALTER TABLE `users` RENAME COLUMN `hasedPassword` TO `passwordHash`;
ALTER TABLE `users` MODIFY `passwordHash` VARCHAR(191) NOT NULL;

-- Existing rows need a value; the default is dropped to match @updatedAt.
ALTER TABLE `users`
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `users` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(64) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
