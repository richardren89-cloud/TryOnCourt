-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `termsVersion` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsentRecord` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `termsVersion` VARCHAR(191) NOT NULL,
    `privacyVersion` VARCHAR(191) NOT NULL,
    `ageConfirmed` BOOLEAN NOT NULL,
    `guardianConsent` BOOLEAN NOT NULL DEFAULT false,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipHash` VARCHAR(191) NULL,

    INDEX `ConsentRecord_userId_acceptedAt_idx`(`userId`, `acceptedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `Session_expiresAt_revokedAt_idx`(`expiresAt`, `revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Player` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `tour` ENUM('ATP', 'WTA') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Player_slug_key`(`slug`),
    INDEX `Player_tour_displayName_idx`(`tour`, `displayName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RankingSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `verifiedAt` DATETIME(3) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RankingSnapshot_playerId_rank_idx`(`playerId`, `rank`),
    UNIQUE INDEX `RankingSnapshot_playerId_verifiedAt_key`(`playerId`, `verifiedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Collection_slug_key`(`slug`),
    INDEX `Collection_published_displayOrder_idx`(`published`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Outfit` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('PLAYER_INSPIRED', 'OWN_BRAND') NOT NULL,
    `season` VARCHAR(191) NOT NULL,
    `rankingVerifiedAt` DATETIME(3) NULL,
    `coverImageUrl` TEXT NULL,
    `promptDescription` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `playerId` VARCHAR(191) NULL,
    `collectionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Outfit_slug_key`(`slug`),
    INDEX `Outfit_published_displayOrder_idx`(`published`, `displayOrder`),
    INDEX `Outfit_type_published_idx`(`type`, `published`),
    INDEX `Outfit_playerId_idx`(`playerId`),
    INDEX `Outfit_collectionId_idx`(`collectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OutfitItem` (
    `id` VARCHAR(191) NOT NULL,
    `outfitId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `colorDescription` VARCHAR(191) NULL,
    `promptDescription` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OutfitItem_outfitId_displayOrder_idx`(`outfitId`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SourceReference` (
    `id` VARCHAR(191) NOT NULL,
    `sourceKey` VARCHAR(191) NOT NULL,
    `outfitId` VARCHAR(191) NOT NULL,
    `outfitItemId` VARCHAR(191) NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `verifiedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SourceReference_sourceKey_key`(`sourceKey`),
    INDEX `SourceReference_outfitId_verificationStatus_idx`(`outfitId`, `verificationStatus`),
    INDEX `SourceReference_outfitItemId_idx`(`outfitItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditLedgerEntry` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('SIGNUP_BONUS', 'GENERATION_SPEND', 'GENERATION_REFUND', 'ADJUSTMENT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `businessKey` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CreditLedgerEntry_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `CreditLedgerEntry_userId_type_idx`(`userId`, `type`),
    UNIQUE INDEX `CreditLedgerEntry_userId_businessKey_key`(`userId`, `businessKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadedPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `kind` ENUM('FULL_BODY', 'HEADSHOT') NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `byteSize` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `checksumSha256` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `UploadedPhoto_storageKey_key`(`storageKey`),
    INDEX `UploadedPhoto_userId_kind_deletedAt_idx`(`userId`, `kind`, `deletedAt`),
    UNIQUE INDEX `UploadedPhoto_id_userId_key`(`id`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GenerationJob` (
    `id` VARCHAR(191) NOT NULL,
    `clientKey` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `outfitId` VARCHAR(191) NOT NULL,
    `fullBodyPhotoId` VARCHAR(191) NOT NULL,
    `headshotPhotoId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED_REFUNDED') NOT NULL DEFAULT 'PENDING',
    `saveSource` BOOLEAN NOT NULL DEFAULT false,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `failureCode` VARCHAR(191) NULL,
    `leaseExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GenerationJob_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `GenerationJob_status_leaseExpiresAt_idx`(`status`, `leaseExpiresAt`),
    INDEX `GenerationJob_outfitId_idx`(`outfitId`),
    INDEX `GenerationJob_fullBodyPhotoId_userId_idx`(`fullBodyPhotoId`, `userId`),
    INDEX `GenerationJob_headshotPhotoId_userId_idx`(`headshotPhotoId`, `userId`),
    UNIQUE INDEX `GenerationJob_userId_clientKey_key`(`userId`, `clientKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedAsset` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `byteSize` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `GeneratedAsset_storageKey_key`(`storageKey`),
    INDEX `GeneratedAsset_jobId_deletedAt_idx`(`jobId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QueueOutbox` (
    `id` VARCHAR(191) NOT NULL,
    `generationJobId` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QueueOutbox_generationJobId_key`(`generationJobId`),
    INDEX `QueueOutbox_publishedAt_createdAt_idx`(`publishedAt`, `createdAt`),
    INDEX `QueueOutbox_attemptCount_publishedAt_idx`(`attemptCount`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsentRecord` ADD CONSTRAINT `ConsentRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RankingSnapshot` ADD CONSTRAINT `RankingSnapshot_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Outfit` ADD CONSTRAINT `Outfit_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Outfit` ADD CONSTRAINT `Outfit_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OutfitItem` ADD CONSTRAINT `OutfitItem_outfitId_fkey` FOREIGN KEY (`outfitId`) REFERENCES `Outfit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SourceReference` ADD CONSTRAINT `SourceReference_outfitId_fkey` FOREIGN KEY (`outfitId`) REFERENCES `Outfit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SourceReference` ADD CONSTRAINT `SourceReference_outfitItemId_fkey` FOREIGN KEY (`outfitItemId`) REFERENCES `OutfitItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditLedgerEntry` ADD CONSTRAINT `CreditLedgerEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UploadedPhoto` ADD CONSTRAINT `UploadedPhoto_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_outfitId_fkey` FOREIGN KEY (`outfitId`) REFERENCES `Outfit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_fullBodyPhotoId_userId_fkey` FOREIGN KEY (`fullBodyPhotoId`, `userId`) REFERENCES `UploadedPhoto`(`id`, `userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_headshotPhotoId_userId_fkey` FOREIGN KEY (`headshotPhotoId`, `userId`) REFERENCES `UploadedPhoto`(`id`, `userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedAsset` ADD CONSTRAINT `GeneratedAsset_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `GenerationJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueueOutbox` ADD CONSTRAINT `QueueOutbox_generationJobId_fkey` FOREIGN KEY (`generationJobId`) REFERENCES `GenerationJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
