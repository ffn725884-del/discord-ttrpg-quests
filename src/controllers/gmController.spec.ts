import {
  getGmAssignUserSelect,
  assignGmRoleToUser,
} from "./gmController";
import {
  ComponentType,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";
import * as discordApi from "../services/discordApi";
import * as gmDAL from "../dal/gmDAL";
import { GM_ASSIGN_USER_SELECT_CUSTOM_ID } from "../interactions/gmComponentIds";

jest.mock("../services/discordApi");
jest.mock("../dal/gmDAL");

const mockGetCurrentApplication = discordApi.getCurrentApplication as jest.MockedFunction<
  typeof discordApi.getCurrentApplication
>;
const mockGetGuildRoles = discordApi.getGuildRoles as jest.MockedFunction<
  typeof discordApi.getGuildRoles
>;
const mockCreateGuildRole = discordApi.createGuildRole as jest.MockedFunction<
  typeof discordApi.createGuildRole
>;
const mockAddGuildMemberRole =
  discordApi.addGuildMemberRole as jest.MockedFunction<
    typeof discordApi.addGuildMemberRole
  >;
const mockGetGmRoleId = gmDAL.getGmRoleId as jest.MockedFunction<
  typeof gmDAL.getGmRoleId
>;
const mockSaveGmRoleMapping = gmDAL.saveGmRoleMapping as jest.MockedFunction<
  typeof gmDAL.saveGmRoleMapping
>;

const TEST_GUILD_ID = "guild-123";
const TEST_ROLE_ID = "role-456";
const TEST_USER_ID = "user-789";

describe("gmController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getGmAssignUserSelect", () => {
    it("uses existing role from DAL and returns User Select when already configured", async () => {
      mockGetCurrentApplication.mockResolvedValue({
        id: "app-1",
        name: "TTRPG Quests",
      });
      mockGetGmRoleId.mockResolvedValue(TEST_ROLE_ID);

      const result = (await getGmAssignUserSelect(TEST_GUILD_ID)) as {
        type: number;
        data: {
          content: string;
          flags: number;
          components: Array<{
            type: number;
            components: Array<{
              type: number;
              custom_id: string;
              placeholder: string;
              min_values: number;
              max_values: number;
            }>;
          }>;
        };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("TTRPG Quests-GM");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
      expect(result.data.components).toHaveLength(1);
      expect(result.data.components[0].type).toBe(ComponentType.ActionRow);
      expect(result.data.components[0].components[0]).toMatchObject({
        type: ComponentType.UserSelect,
        custom_id: GM_ASSIGN_USER_SELECT_CUSTOM_ID,
        placeholder: "Select GM user",
        min_values: 1,
        max_values: 1,
      });

      expect(mockGetCurrentApplication).toHaveBeenCalledTimes(1);
      expect(mockGetGmRoleId).toHaveBeenCalledWith(TEST_GUILD_ID);
      expect(mockGetGuildRoles).not.toHaveBeenCalled();
      expect(mockCreateGuildRole).not.toHaveBeenCalled();
      expect(mockSaveGmRoleMapping).not.toHaveBeenCalled();
    });

    it("finds existing role in guild, saves mapping, and returns User Select when not in DAL", async () => {
      mockGetCurrentApplication.mockResolvedValue({
        id: "app-1",
        name: "TTRPG Quests",
      });
      mockGetGmRoleId.mockResolvedValue(null);
      mockGetGuildRoles.mockResolvedValue([
        { id: "other-role", name: "Member" },
        { id: TEST_ROLE_ID, name: "TTRPG Quests-GM" },
      ]);

      const result = (await getGmAssignUserSelect(TEST_GUILD_ID)) as {
        data: { content: string };
      };

      expect(result.data.content).toContain("TTRPG Quests-GM");
      expect(mockGetGuildRoles).toHaveBeenCalledWith(TEST_GUILD_ID);
      expect(mockCreateGuildRole).not.toHaveBeenCalled();
      expect(mockSaveGmRoleMapping).toHaveBeenCalledWith(
        TEST_GUILD_ID,
        TEST_ROLE_ID,
      );
    });

    it("creates new role, saves mapping, and returns User Select when role does not exist", async () => {
      mockGetCurrentApplication.mockResolvedValue({
        id: "app-1",
        name: "TTRPG Quests",
      });
      mockGetGmRoleId.mockResolvedValue(null);
      mockGetGuildRoles.mockResolvedValue([{ id: "other-role", name: "Member" }]);
      mockCreateGuildRole.mockResolvedValue({
        id: TEST_ROLE_ID,
        name: "TTRPG Quests-GM",
      });

      const result = (await getGmAssignUserSelect(TEST_GUILD_ID)) as {
        data: { content: string };
      };

      expect(result.data.content).toContain("TTRPG Quests-GM");
      expect(mockCreateGuildRole).toHaveBeenCalledWith(
        TEST_GUILD_ID,
        "TTRPG Quests-GM",
      );
      expect(mockSaveGmRoleMapping).toHaveBeenCalledWith(
        TEST_GUILD_ID,
        TEST_ROLE_ID,
      );
    });

    it("finds existing role case-insensitively", async () => {
      mockGetCurrentApplication.mockResolvedValue({
        id: "app-1",
        name: "MyApp",
      });
      mockGetGmRoleId.mockResolvedValue(null);
      mockGetGuildRoles.mockResolvedValue([
        { id: TEST_ROLE_ID, name: "myapp-gm" },
      ]);

      const result = (await getGmAssignUserSelect(TEST_GUILD_ID)) as {
        data: { content: string };
      };

      expect(result.data.content).toContain("MyApp-GM");
      expect(mockSaveGmRoleMapping).toHaveBeenCalledWith(
        TEST_GUILD_ID,
        TEST_ROLE_ID,
      );
      expect(mockCreateGuildRole).not.toHaveBeenCalled();
    });
  });

  describe("assignGmRoleToUser", () => {
    it("returns error when GM role is not configured", async () => {
      mockGetGmRoleId.mockResolvedValue(null);

      const result = (await assignGmRoleToUser(TEST_GUILD_ID, TEST_USER_ID)) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toContain("GM role is not configured");
      expect(result.data.content).toContain("/gm assign");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
      expect(mockAddGuildMemberRole).not.toHaveBeenCalled();
    });

    it("returns success when role is assigned", async () => {
      mockGetGmRoleId.mockResolvedValue(TEST_ROLE_ID);
      mockAddGuildMemberRole.mockResolvedValue();

      const result = (await assignGmRoleToUser(TEST_GUILD_ID, TEST_USER_ID)) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("GM role assigned successfully.");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
      expect(mockAddGuildMemberRole).toHaveBeenCalledWith(
        TEST_GUILD_ID,
        TEST_USER_ID,
        TEST_ROLE_ID,
      );
    });

    it("returns error message when addGuildMemberRole throws", async () => {
      mockGetGmRoleId.mockResolvedValue(TEST_ROLE_ID);
      mockAddGuildMemberRole.mockRejectedValue(
        new Error("Missing Permissions"),
      );

      const result = (await assignGmRoleToUser(TEST_GUILD_ID, TEST_USER_ID)) as {
        type: number;
        data: { content: string; flags: number };
      };

      expect(result.type).toBe(
        InteractionResponseType.ChannelMessageWithSource,
      );
      expect(result.data.content).toBe("Error: Missing Permissions");
      expect(result.data.flags).toBe(MessageFlags.Ephemeral);
    });

    it("returns generic error when addGuildMemberRole throws non-Error", async () => {
      mockGetGmRoleId.mockResolvedValue(TEST_ROLE_ID);
      mockAddGuildMemberRole.mockRejectedValue("string error");

      const result = (await assignGmRoleToUser(TEST_GUILD_ID, TEST_USER_ID)) as {
        type: number;
        data: { content: string };
      };

      expect(result.data.content).toBe("Error: Failed to assign GM role.");
    });
  });
});
