process.env.JWT_SECRET = "test-secret";

jest.mock("../dal/apiKeysDAL");
jest.mock("../dal/questsDAL");
jest.mock("../services/discordApi");

import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { apiRouter } from "./apiRoutes";
import * as apiKeysDAL from "../dal/apiKeysDAL";
import * as questsDAL from "../dal/questsDAL";
import * as discordApi from "../services/discordApi";

const mockFindApiKey = apiKeysDAL.findApiKey as jest.MockedFunction<
  typeof apiKeysDAL.findApiKey
>;
const mockGetGuildMember = discordApi.getGuildMember as jest.MockedFunction<
  typeof discordApi.getGuildMember
>;
const mockGetAllQuests = questsDAL.getAllQuests as jest.MockedFunction<
  typeof questsDAL.getAllQuests
>;

const TEST_USER_ID = "user-123";
const TEST_GUILD_ID = "guild-456";
const TEST_CHANNEL_ID = "channel-789";

// Bare Express app — no parent express.json(), mirroring src/app.ts.
const app = express();
app.use("/api", apiRouter);

beforeEach(() => {
  mockFindApiKey.mockReset();
  mockGetGuildMember.mockReset();
  mockGetAllQuests.mockReset();
});

describe("POST /api/token", () => {
  it("reproduces the reported bug: a valid JSON body must not crash the route", async () => {
    // Before the fix, express.json() was missing, so req.body was undefined
    // and destructuring threw a TypeError → 500.
    mockFindApiKey.mockResolvedValue({
      userId: TEST_USER_ID,
      guildId: TEST_GUILD_ID,
      channelId: TEST_CHANNEL_ID,
    });
    mockGetGuildMember.mockResolvedValue({ user: { id: TEST_USER_ID } });

    const res = await request(app)
      .post("/api/token")
      .set("Content-Type", "application/json")
      .send({ api_key: "valid-key" });

    expect(res.status).not.toBe(500);
    expect(res.status).toBe(200);
  });

  it("returns 400 when api_key is missing", async () => {
    const res = await request(app).post("/api/token").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/api_key/);
  });

  it("returns 401 for an unknown api_key", async () => {
    mockFindApiKey.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/token")
      .send({ api_key: "does-not-exist" });

    expect(res.status).toBe(401);
  });

  it("returns 403 when the user is no longer in the guild", async () => {
    mockFindApiKey.mockResolvedValue({
      userId: TEST_USER_ID,
      guildId: TEST_GUILD_ID,
      channelId: TEST_CHANNEL_ID,
    });
    mockGetGuildMember.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/token")
      .send({ api_key: "valid-key" });

    expect(res.status).toBe(403);
  });

  it("returns a signed JWT with the expected claims and ~15-min expiry", async () => {
    mockFindApiKey.mockResolvedValue({
      userId: TEST_USER_ID,
      guildId: TEST_GUILD_ID,
      channelId: TEST_CHANNEL_ID,
    });
    mockGetGuildMember.mockResolvedValue({ user: { id: TEST_USER_ID } });

    const res = await request(app)
      .post("/api/token")
      .send({ api_key: "valid-key" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");

    const payload = jwt.verify(
      res.body.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload & {
      userId: string;
      guildId: string;
      channelId: string;
    };
    expect(payload.userId).toBe(TEST_USER_ID);
    expect(payload.guildId).toBe(TEST_GUILD_ID);
    expect(payload.channelId).toBe(TEST_CHANNEL_ID);
    expect(payload.exp! - payload.iat!).toBe(15 * 60);
  });
});

describe("GET /api/quests", () => {
  function signValidToken(): string {
    return jwt.sign(
      {
        userId: TEST_USER_ID,
        guildId: TEST_GUILD_ID,
        channelId: TEST_CHANNEL_ID,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );
  }

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).get("/api/quests");
    expect(res.status).toBe(401);
  });

  it("returns 401 for a malformed bearer token", async () => {
    const res = await request(app)
      .get("/api/quests")
      .set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired JWT", async () => {
    const expired = jwt.sign(
      {
        userId: TEST_USER_ID,
        guildId: TEST_GUILD_ID,
        channelId: TEST_CHANNEL_ID,
      },
      process.env.JWT_SECRET!,
      { expiresIn: -10 },
    );
    const res = await request(app)
      .get("/api/quests")
      .set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it("returns quests for the token's channelId", async () => {
    mockGetAllQuests.mockResolvedValue([
      {
        id: "1",
        channelId: TEST_CHANNEL_ID,
        name: "Slay the dragon",
        progress: ["Found the lair"],
        completed: false,
        prepared: false,
      },
    ]);

    const res = await request(app)
      .get("/api/quests")
      .set("Authorization", `Bearer ${signValidToken()}`);

    expect(res.status).toBe(200);
    expect(mockGetAllQuests).toHaveBeenCalledWith(TEST_CHANNEL_ID);
    expect(res.body.quests).toHaveLength(1);
    expect(res.body.quests[0].name).toBe("Slay the dragon");
  });
});
