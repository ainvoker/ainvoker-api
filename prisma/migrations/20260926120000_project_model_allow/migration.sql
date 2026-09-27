-- CreateTable
CREATE TABLE "ProjectModelAllow" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "modelId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectModelAllow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectModelAllow_projectId_idx" ON "ProjectModelAllow"("projectId");

-- CreateIndex
CREATE INDEX "ProjectModelAllow_modelId_idx" ON "ProjectModelAllow"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectModelAllow_projectId_modelId_key" ON "ProjectModelAllow"("projectId", "modelId");

-- AddForeignKey
ALTER TABLE "ProjectModelAllow" ADD CONSTRAINT "ProjectModelAllow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectModelAllow" ADD CONSTRAINT "ProjectModelAllow_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
