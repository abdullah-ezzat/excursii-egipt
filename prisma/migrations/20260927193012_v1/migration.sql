-- AlterTable
ALTER TABLE `Tour` ADD COLUMN `excluded` LONGTEXT NULL,
    ADD COLUMN `included` LONGTEXT NULL,
    ADD COLUMN `itinerary` LONGTEXT NULL,
    ADD COLUMN `origin` VARCHAR(191) NOT NULL DEFAULT 'Hurghada';

-- CreateTable
CREATE TABLE `TripCategory` (
    `id` VARCHAR(191) NOT NULL,
    `routeId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TripCategory_routeId_key`(`routeId`),
    UNIQUE INDEX `TripCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
