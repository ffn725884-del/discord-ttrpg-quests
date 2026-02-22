import {
  buildStatusResponse,
  type StatusData,
} from "./statusResponseBuilder";
import { InteractionResponseType } from "discord-api-types/v10";

describe("statusResponseBuilder", () => {
  describe("buildStatusResponse", () => {
    it("returns ephemeral Discord response with Up and Connected when healthy", () => {
      const status: StatusData = {
        appUp: true,
        databaseConnected: true,
      };

      const result = buildStatusResponse(status) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("**Internal Status**");
      expect(result.data.content).toContain("App: Up");
      expect(result.data.content).toContain("Database: Connected");
    });

    it("returns ephemeral Discord response with Up and Disconnected when DB fails", () => {
      const status: StatusData = {
        appUp: true,
        databaseConnected: false,
      };

      const result = buildStatusResponse(status) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("**Internal Status**");
      expect(result.data.content).toContain("App: Up");
      expect(result.data.content).toContain("Database: Disconnected");
    });

    it("returns App: Down when appUp is false", () => {
      const status: StatusData = {
        appUp: false,
        databaseConnected: false,
      };

      const result = buildStatusResponse(status) as {
        data: { content: string };
      };

      expect(result.data.content).toContain("App: Down");
    });
  });
});
