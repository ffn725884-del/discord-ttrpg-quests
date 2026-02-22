import { getStatus, getStatusForDiscord } from "./statusController";
import { InteractionResponseType } from "discord-api-types/v10";
import { db } from "../db/index";

jest.mock("../db/index", () => ({
  db: { raw: jest.fn() },
  initSchema: jest.fn(),
}));

const mockDbRaw = (db as unknown as { raw: jest.Mock }).raw;

describe("statusController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getStatus", () => {
    it("returns appUp true and databaseConnected true when DB responds", async () => {
      mockDbRaw.mockResolvedValue(undefined);

      const result = await getStatus();

      expect(result).toEqual({
        appUp: true,
        databaseConnected: true,
      });
      expect(mockDbRaw).toHaveBeenCalledWith("SELECT 1");
    });

    it("returns appUp true and databaseConnected false when DB fails", async () => {
      mockDbRaw.mockRejectedValue(new Error("Connection refused"));

      const result = await getStatus();

      expect(result).toEqual({
        appUp: true,
        databaseConnected: false,
      });
      expect(mockDbRaw).toHaveBeenCalledWith("SELECT 1");
    });
  });

  describe("getStatusForDiscord", () => {
    it("returns Discord response with Up and Connected when DB is healthy", async () => {
      mockDbRaw.mockResolvedValue(undefined);

      const result = (await getStatusForDiscord()) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(result.data.content).toContain("**Internal Status**");
      expect(result.data.content).toContain("App: Up");
      expect(result.data.content).toContain("Database: Connected");
    });

    it("returns Discord response with Up and Disconnected when DB fails", async () => {
      mockDbRaw.mockRejectedValue(new Error("Connection refused"));

      const result = (await getStatusForDiscord()) as {
        type: number;
        data: { content: string };
      };

      expect(result.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(result.data.content).toContain("**Internal Status**");
      expect(result.data.content).toContain("App: Up");
      expect(result.data.content).toContain("Database: Disconnected");
    });
  });
});
