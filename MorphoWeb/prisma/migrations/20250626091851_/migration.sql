/*
  Warnings:

  - You are about to drop the column `connectedAccountId` on the `agency` table. All the data in the column will be lost.
  - The values [DATABASE_URLflag] on the enum `SubAccountSidebarOption_icon` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `pathname` on the `funnelpage` table. All the data in the column will be lost.
  - You are about to drop the column `connectedAccountId` on the `subaccount` table. All the data in the column will be lost.
  - The values [DATABASE_URLflag] on the enum `SubAccountSidebarOption_icon` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `subscriptionId` on the `subscription` table. All the data in the column will be lost.
  - The values [price_10Mhu0Ild5Bk5htqogRZXP2e,price_10MhtcIld5Bk5htqx5CvF5mj] on the enum `Subscription_plan` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[subscritiptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subscritiptionId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Subscription_subscriptionId_key` ON `subscription`;

-- AlterTable
ALTER TABLE `agency` DROP COLUMN `connectedAccountId`,
    ADD COLUMN `connectAccountId` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `agencysidebaroption` MODIFY `icon` ENUM('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'database', 'flag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon') NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE `automation` MODIFY `published` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `classname` MODIFY `customData` TEXT NULL;

-- AlterTable
ALTER TABLE `funnelpage` DROP COLUMN `pathname`,
    ADD COLUMN `pathName` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `content` TEXT NULL;

-- AlterTable
ALTER TABLE `subaccount` DROP COLUMN `connectedAccountId`,
    ADD COLUMN `connectAccountId` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `subaccountsidebaroption` MODIFY `icon` ENUM('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'database', 'flag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon') NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE `subscription` DROP COLUMN `subscriptionId`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `subscritiptionId` VARCHAR(191) NOT NULL,
    MODIFY `plan` ENUM('price_1P9fVlSA7lR52xKKtEXLr3Vt', 'price_1P9fVlSA7lR52xKKRZssWhKp') NULL,
    MODIFY `price` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Subscription_subscritiptionId_key` ON `Subscription`(`subscritiptionId`);
