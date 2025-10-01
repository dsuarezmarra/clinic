/*
  Warnings:

  - Made the column `dni` on table `patients` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_credit_packs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unitsTotal" INTEGER NOT NULL,
    "unitMinutes" INTEGER NOT NULL DEFAULT 30,
    "unitsRemaining" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_packs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_credit_packs" ("createdAt", "id", "label", "notes", "paid", "patientId", "unitsRemaining", "unitsTotal") SELECT "createdAt", "id", "label", "notes", "paid", "patientId", "unitsRemaining", "unitsTotal" FROM "credit_packs";
DROP TABLE "credit_packs";
ALTER TABLE "new_credit_packs" RENAME TO "credit_packs";
CREATE TABLE "new_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dni" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "cp" TEXT,
    "city" TEXT,
    "province" TEXT,
    "birthDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_patients" ("address", "birthDate", "city", "cp", "createdAt", "dni", "email", "firstName", "id", "lastName", "notes", "phone", "province", "updatedAt") SELECT "address", "birthDate", "city", "cp", "createdAt", "dni", "email", "firstName", "id", "lastName", "notes", "phone", "province", "updatedAt" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
CREATE UNIQUE INDEX "patients_dni_key" ON "patients"("dni");
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
