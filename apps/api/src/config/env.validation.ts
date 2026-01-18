/**
 * Environment Variables Validation Schema
 *
 * Uses Joi to validate all required environment variables on application startup.
 * The app will fail to start if any required database variables are missing.
 */

import Joi from "joi";

export const envValidationSchema = Joi.object({
  // Database Configuration (Required)
  DB_HOST: Joi.string().required().description("Database host address"),
  DB_PORT: Joi.number().port().default(5432).description("Database port"),
  DB_USER: Joi.string().required().description("Database username"),
  DB_PASSWORD: Joi.string().required().description("Database password"),
  DB_NAME: Joi.string().required().description("Database name"),

  // Application Configuration
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(3001),

  // JWT Authentication (Required)
  JWT_SECRET: Joi.string().required().min(32).description("JWT signing secret"),
  JWT_EXPIRATION: Joi.string().default("1d").description("JWT expiration time"),
});
