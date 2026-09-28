-- AlterTable
ALTER TABLE `Tour` MODIFY `excerpt` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `TranslationCache` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(20) NOT NULL,
    `target` VARCHAR(20) NOT NULL,
    `textHash` CHAR(64) NOT NULL,
    `originalText` TEXT NOT NULL,
    `translatedText` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TranslationCache_source_target_idx`(`source`, `target`),
    UNIQUE INDEX `TranslationCache_source_target_textHash_key`(`source`, `target`, `textHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
