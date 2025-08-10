import type { Request, Response, NextFunction } from 'express';

export const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = process.env.REVIEW_BASIC_USER || "packity";
  const pass = process.env.REVIEW_BASIC_PASS || "lab";
  const header = req.headers.authorization || '';
  const encoded = header.split(' ')[1] || '';
  const [u, p] = Buffer.from(encoded, 'base64').toString().split(':');
  if (u === user && p === pass) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="PackityLab"');
  res.status(401).send('Auth required');
};
