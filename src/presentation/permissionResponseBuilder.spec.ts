import {
  buildPermissionDeniedResponse,
  buildGmPermissionDeniedResponse,
} from "./permissionResponseBuilder";
import {
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

describe("permissionResponseBuilder", () => {
  describe("buildPermissionDeniedResponse", () => {
    it("returns ephemeral message with default text when no message given", () => {
      const result = buildPermissionDeniedResponse() as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe(
        "You need the Administrator permission to do that.",
      );
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
    });

    it("returns ephemeral message with custom text when message given", () => {
      const result = buildPermissionDeniedResponse("Custom denial") as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.data.content).toBe("Custom denial");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
    });
  });

  describe("buildGmPermissionDeniedResponse", () => {
    it("returns use /gm assign message when role is not configured", () => {
      const result = buildGmPermissionDeniedResponse(false) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("/gm assign");
      expect(result.data.content).toContain("not set up");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
    });

    it("returns GM-only message when role is configured", () => {
      const result = buildGmPermissionDeniedResponse(true) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("This command is for GMs only.");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
    });
  });
});
