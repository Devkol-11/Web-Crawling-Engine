import Express from "express";
import helmet from "helmet";
import { Request, Response } from "express";

let ExpressApplication: Express.Application;
ExpressApplication = Express();

ExpressApplication.use(Express.json());
ExpressApplication.use(helmet());

ExpressApplication.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "up",
  });
});

export default ExpressApplication;
