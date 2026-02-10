import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { MosquesService } from "./mosques/mosques.service";
import { PointsService } from "./points/points.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pointsService = app.get(PointsService);
  const mosquesService = app.get(MosquesService);
  const logger = new Logger("SeedPointRules");

  try {
    const mosques = await mosquesService.findAll();
    logger.log(`Found ${mosques.length} mosques to seed.`);

    for (const mosque of mosques) {
      logger.log(`Seeding rules for mosque: ${mosque.name} (${mosque.id})`);
      // check if rules exist
      const existingRules = await pointsService.findAllRules(mosque.id);
      if (existingRules.length > 0) {
        logger.log(`Rules already exist for mosque ${mosque.name}, skipping.`);
        continue;
      }

      await pointsService.initializeDefaultRules(mosque.id);
      logger.log(`Seeded rules for mosque: ${mosque.name}`);
    }

    logger.log("Seeding complete!");
  } catch (error) {
    logger.error("Seeding failed", error);
  } finally {
    await app.close();
  }
}

bootstrap();
