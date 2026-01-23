-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettingsSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "version" INTEGER NOT NULL,
    "settingsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "SettingsSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SettingsSnapshot_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastUsedAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "replacedByTokenId" TEXT,
    "deletedAt" DATETIME,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefreshToken_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchaseToken" TEXT NOT NULL,
    "orderId" TEXT,
    "purchaseTime" DATETIME,
    "rawResponse" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "PurchaseToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "deletedAt" DATETIME,
    CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SettingsSnapshot_userId_version_key" ON "SettingsSnapshot"("userId", "version");

-- CreateIndex
CREATE INDEX "SettingsSnapshot_userId_idx" ON "SettingsSnapshot"("userId");

-- CreateIndex
CREATE INDEX "SettingsSnapshot_deviceId_idx" ON "SettingsSnapshot"("deviceId");

-- CreateIndex
CREATE INDEX "LoginToken_email_idx" ON "LoginToken"("email");

-- CreateIndex
CREATE INDEX "LoginToken_tokenHash_idx" ON "LoginToken"("tokenHash");

-- CreateIndex
CREATE INDEX "LoginToken_expiresAt_idx" ON "LoginToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_deviceId_idx" ON "RefreshToken"("deviceId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_replacedByTokenId_idx" ON "RefreshToken"("replacedByTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseToken_purchaseToken_key" ON "PurchaseToken"("purchaseToken");

-- CreateIndex
CREATE INDEX "PurchaseToken_userId_idx" ON "PurchaseToken"("userId");

-- CreateIndex
CREATE INDEX "PurchaseToken_productId_idx" ON "PurchaseToken"("productId");

-- CreateIndex
CREATE INDEX "Entitlement_userId_idx" ON "Entitlement"("userId");

-- CreateIndex
CREATE INDEX "Entitlement_key_idx" ON "Entitlement"("key");

-- CreateIndex
CREATE INDEX "Entitlement_status_idx" ON "Entitlement"("status");
