-- CreateTable
CREATE TABLE "ProjectAllowedOrigin" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAllowedOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectAllowedOrigin_origin_idx" ON "ProjectAllowedOrigin"("origin");

-- CreateIndex
CREATE INDEX "ProjectAllowedOrigin_projectId_idx" ON "ProjectAllowedOrigin"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAllowedOrigin_projectId_origin_key" ON "ProjectAllowedOrigin"("projectId", "origin");

-- AddForeignKey
ALTER TABLE "ProjectAllowedOrigin" ADD CONSTRAINT "ProjectAllowedOrigin_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
