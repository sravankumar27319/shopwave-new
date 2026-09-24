-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "colors" TEXT[],
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "originalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "rating" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sizes" TEXT[];
