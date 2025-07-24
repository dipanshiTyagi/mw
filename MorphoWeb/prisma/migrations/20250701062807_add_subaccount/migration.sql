/*
  Warnings:

  - A unique constraint covering the columns `[email,subAccountId]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `permissions_email_subAccountId_key` ON `permissions`(`email`, `subAccountId`);
