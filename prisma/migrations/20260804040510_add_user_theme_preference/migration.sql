-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'DEVICE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "themePreference" "ThemePreference" NOT NULL DEFAULT 'DEVICE';
