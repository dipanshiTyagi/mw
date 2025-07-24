/*
  Warnings:

  - You are about to drop the column `connectAccountId` on the `agency` table. All the data in the column will be lost.
  - The values [database,flag] on the enum `agencysidebaroption_icon` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `pathName` on the `funnelpage` table. All the data in the column will be lost.
  - You are about to drop the column `connectAccountId` on the `subaccount` table. All the data in the column will be lost.
  - The values [database,flag] on the enum `subaccountsidebaroption_icon` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `active` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `subscritiptionId` on the `subscription` table. All the data in the column will be lost.
  - The values [price_1P9fVlSA7lR52xKKtEXLr3Vt,price_1P9fVlSA7lR52xKKRZssWhKp] on the enum `subscription_plan` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[subscriptionId]` on the table `subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subscriptionId` to the `subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Subscription_subscritiptionId_key` ON `subscription`;

-- AlterTable
ALTER TABLE `agency` DROP COLUMN `connectAccountId`,
    ADD COLUMN `connectedAccountId` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `agencysidebaroption` MODIFY `icon` ENUM('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'DATABASE_URLflag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon') NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE `automation` ALTER COLUMN `published` DROP DEFAULT;

-- AlterTable
ALTER TABLE `classname` MODIFY `customData` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `funnelpage` DROP COLUMN `pathName`,
    ADD COLUMN `pathname` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY `content` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `subaccount` DROP COLUMN `connectAccountId`,
    ADD COLUMN `connectedAccountId` VARCHAR(191) NULL DEFAULT '';

-- AlterTable
ALTER TABLE `subaccountsidebaroption` MODIFY `icon` ENUM('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'DATABASE_URLflag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon') NOT NULL DEFAULT 'info';

-- AlterTable
ALTER TABLE `subscription` DROP COLUMN `active`,
    DROP COLUMN `subscritiptionId`,
    ADD COLUMN `subscriptionId` VARCHAR(191) NOT NULL,
    MODIFY `plan` ENUM('price_10Mhu0Ild5Bk5htqogRZXP2e', 'price_10MhtcIld5Bk5htqx5CvF5mj') NULL,
    MODIFY `price` LONGTEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Subscription_subscriptionId_key` ON `subscription`(`subscriptionId`);
