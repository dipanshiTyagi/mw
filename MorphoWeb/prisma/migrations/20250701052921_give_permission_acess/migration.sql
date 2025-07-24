-- AlterTable
ALTER TABLE `_userpermission` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `_userpermission_userId_idx` ON `_userpermission`(`userId`);
