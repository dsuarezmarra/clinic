-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "priceCents" INTEGER;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN "family_contact" TEXT;
ALTER TABLE "patients" ADD COLUMN "phone2" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_credit_packs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unitsTotal" INTEGER NOT NULL,
    "unitMinutes" INTEGER NOT NULL DEFAULT 30,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "unitsRemaining" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_packs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_credit_packs" ("createdAt", "id", "label", "notes", "paid", "patientId", "unitMinutes", "unitsRemaining", "unitsTotal") SELECT "createdAt", "id", "label", "notes", "paid", "patientId", "unitMinutes", "unitsRemaining", "unitsTotal" FROM "credit_packs";
DROP TABLE "credit_packs";
ALTER TABLE "new_credit_packs" RENAME TO "credit_packs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
