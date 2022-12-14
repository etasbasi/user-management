require("dotenv").config();
const supertest = require("supertest");
const firebase = require("firebase/database");
const uuid = require("uuid");

const axiosConfig = require("../config/axiosConfig");

jest.mock("uuid");
jest.mock("../config/axiosConfig");
jest.mock("firebase/database");

firebase.ref = jest.fn();
firebase.getDatabase = jest.fn();
firebase.set = jest.fn();
firebase.get = jest.fn();
firebase.child = jest.fn();
firebase.remove = jest.fn();

uuid.v4.mockReturnValue("abc-123");

const app = require("../server");

const request = supertest(app);

describe("users", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("POST /", () => {
    it("should create a new user", async () => {
      axiosConfig.apiInstance.mockReturnValue({
        data: {
          timezone: 1200,
          coord: {
            lat: 34.0901,
            lon: -118.4065,
          },
        },
      });

      const { body } = await request
        .post("/users")
        .send({ name: "John Doe", zip: 90210 });

      const expectedUser = {
        id: "abc-123",
        name: "John Doe",
        zip: 90210,
        timezone: 1200,
        lat: 34.0901,
        lon: -118.4065,
      };

      expect(body).toStrictEqual(expectedUser);
    });
  });

  describe("GET /", () => {
    it("should return all the users", async () => {
      const users = [
        {
          id: "4dd69a2c-666a-41f4-895f-5ac9339f62de",
          lat: 42.8142,
          lon: -73.9396,
          name: "john doe",
          zip: 12345,
        },
      ];

      firebase.get.mockResolvedValue({
        exists: () => true,
        val: () => users,
      });

      const { body } = await request.get("/users");

      expect(body).toStrictEqual(users);
    });
  });

  describe("PATCH /", () => {
    it("should update user", async () => {
      const user = {
        id: "4dd69a2c-666a-41f4-895f-5ac9339f62de",
        lat: 42.8142,
        lon: -73.9396,
        name: "john doe",
        zip: 12345,
      };

      const newLocation = {
        data: {
          coord: {
            lat: 52.0901,
            lon: -13.4065,
          },
          timezone: 9000,
        },
      };

      axiosConfig.apiInstance.mockReturnValue(newLocation);

      firebase.get.mockResolvedValue({
        exists: () => true,
        val: () => user,
      });

      const { body } = await request
        .patch(`/users/${user.id}`)
        .send({ name: "Updated John Doe", zip: 54321 });

      expect(firebase.set).toHaveBeenCalled();

      const want = {
        id: user.id,
        name: "Updated John Doe",
        zip: 54321,
        lat: newLocation.data.coord.lat,
        lon: newLocation.data.coord.lon,
        timezone: newLocation.data.timezone,
      };
      expect(body).toStrictEqual(want);
    });
  });

  describe("DELETE /", () => {
    it("should delete a user", async () => {
      await request
        .delete("/users/4dd69a2c-666a-41f4-895f-5ac9339f62de")
        .expect(200);
    });
  });
});
