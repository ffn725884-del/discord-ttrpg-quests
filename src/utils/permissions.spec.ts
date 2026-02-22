import { memberHasRole, hasAdminPermission } from "./permissions";
import { PermissionFlagsBits } from "discord-api-types/v10";

describe("permissions", () => {
  describe("memberHasRole", () => {
    it("returns false when roleId is null", () => {
      const interaction = {
        member: { roles: ["role-1", "role-2"] },
      } as unknown as Parameters<typeof memberHasRole>[0];
      expect(memberHasRole(interaction, null)).toBe(false);
    });

    it("returns false when member is undefined", () => {
      const interaction = { member: undefined } as unknown as Parameters<
        typeof memberHasRole
      >[0];
      expect(memberHasRole(interaction, "role-1")).toBe(false);
    });

    it("returns false when member has no roles property", () => {
      const interaction = { member: {} } as unknown as Parameters<
        typeof memberHasRole
      >[0];
      expect(memberHasRole(interaction, "role-1")).toBe(false);
    });

    it("returns true when member has the role", () => {
      const interaction = {
        member: { roles: ["role-1", "role-2"] },
      } as unknown as Parameters<typeof memberHasRole>[0];
      expect(memberHasRole(interaction, "role-1")).toBe(true);
      expect(memberHasRole(interaction, "role-2")).toBe(true);
    });

    it("returns false when member does not have the role", () => {
      const interaction = {
        member: { roles: ["role-1", "role-2"] },
      } as unknown as Parameters<typeof memberHasRole>[0];
      expect(memberHasRole(interaction, "role-3")).toBe(false);
    });

    it("returns false when roles is empty array", () => {
      const interaction = {
        member: { roles: [] },
      } as unknown as Parameters<typeof memberHasRole>[0];
      expect(memberHasRole(interaction, "role-1")).toBe(false);
    });
  });

  describe("hasAdminPermission", () => {
    it("returns true when member has Administrator permission", () => {
      const interaction = {
        member: {
          permissions: String(PermissionFlagsBits.Administrator),
        },
      } as unknown as Parameters<typeof hasAdminPermission>[0];
      expect(hasAdminPermission(interaction)).toBe(true);
    });

    it("returns false when member lacks Administrator permission", () => {
      const interaction = {
        member: { permissions: "0" },
      } as unknown as Parameters<typeof hasAdminPermission>[0];
      expect(hasAdminPermission(interaction)).toBe(false);
    });

    it("returns true when member is undefined (non-guild context)", () => {
      const interaction = { member: undefined } as unknown as Parameters<
        typeof hasAdminPermission
      >[0];
      expect(hasAdminPermission(interaction)).toBe(true);
    });
  });
});
