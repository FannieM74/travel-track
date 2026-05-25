import { pgTable, uuid, text, integer, date, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  hashedPassword: text("hashed_password"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicleOdometerReadings = pgTable("vehicle_odometer_readings", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id).notNull(),
  taxYear: integer("tax_year").notNull(),
  openingOdometer: integer("opening_odometer"),
  openingDate: date("opening_date"),
  closingOdometer: integer("closing_odometer"),
  closingDate: date("closing_date"),
});

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id).notNull(),
  date: date("date").notNull(),
  taxYear: integer("tax_year").notNull(),
  startOdometer: integer("start_odometer").notNull(),
  endOdometer: integer("end_odometer").notNull(),
  totalKm: integer("total_km").notNull(),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  purpose: text("purpose").notNull(),
  routePolyline: text("route_polyline"),
  startOdometerPhoto: text("start_odometer_photo"),
  endOdometerPhoto: text("end_odometer_photo"),
  isBusiness: boolean("is_business").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
