import dotenv from "dotenv";
dotenv.config();

// export interface EnvConfig {
//   PORT: number;
// }

export const config = {
  PORT: process.env.PORT,
};
