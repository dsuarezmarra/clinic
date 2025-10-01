/*
  Warnings:

  - A unique constraint covering the columns `[dni]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN "city" TEXT;
ALTER TABLE "patients" ADD COLUMN "cp" TEXT;
ALTER TABLE "patients" ADD COLUMN "dni" TEXT;
ALTER TABLE "patients" ADD COLUMN "province" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patient_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'otro',
    "description" TEXT,
    "checksum" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_files_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_patient_files" ("checksum", "createdAt", "id", "mimeType", "originalName", "patientId", "size", "storedPath") SELECT "checksum", "createdAt", "id", "mimeType", "originalName", "patientId", "size", "storedPath" FROM "patient_files";
DROP TABLE "patient_files";
ALTER TABLE "new_patient_files" RENAME TO "patient_files";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "patients_dni_key" ON "patients"("dni");
