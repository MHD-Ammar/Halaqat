import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { LeagueService } from "./league.service";

@Injectable()
export class LeagueScheduler {
  private readonly logger = new Logger(LeagueScheduler.name);

  constructor(private readonly leagueService: LeagueService) {}

  @Cron("5 0 * * 0", { timeZone: "UTC" })
  async handleWeeklyLeagueReset(): Promise<void> {
    try {
      const result = await this.leagueService.processWeeklyReset();
      this.logger.log(
        `Weekly league reset completed. weekStart=${result.weekStart}, nextWeekStart=${result.nextWeekStart}, processed=${result.processed}`,
      );
    } catch (error) {
      this.logger.error(`Weekly league reset failed: ${String(error)}`);
    }
  }
}
