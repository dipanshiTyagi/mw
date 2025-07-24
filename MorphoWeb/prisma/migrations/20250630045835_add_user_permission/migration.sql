-- AlterTable
ALTER TABLE `agencysidebaroption` MODIFY `icon` ENUM('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'DATABASE_URLflag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon', 'media', 'database', 'flag') NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE `notification` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `subaccountsidebaroption` MODIFY `icon` ENUM('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'DATABASE_URLflag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon', 'database', 'flag') NOT NULL DEFAULT 'info';

-- CreateTable
CREATE TABLE `_userpermission` (
    `userId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    INDEX `_userpermission_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`userId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_funnelTofunnelpage` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_funnelTofunnelpage_AB_unique`(`A`, `B`),
    INDEX `_funnelTofunnelpage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_laneTopipeline` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_laneTopipeline_AB_unique`(`A`, `B`),
    INDEX `_laneTopipeline_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_subaccountTotag` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_subaccountTotag_AB_unique`(`A`, `B`),
    INDEX `_subaccountTotag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TicketTags` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_TicketTags_AB_unique`(`A`, `B`),
    INDEX `_TicketTags_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
