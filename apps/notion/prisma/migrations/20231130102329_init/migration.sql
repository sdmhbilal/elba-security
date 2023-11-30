-- CreateTable
CREATE TABLE "Credential" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "accessToken" TEXT,
    "workspaceId" TEXT,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credential_organizationId_key" ON "Credential"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_sourceId_key" ON "Credential"("sourceId");
