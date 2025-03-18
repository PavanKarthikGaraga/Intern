import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

if (!ACCESS_TOKEN || !REFRESH_TOKEN) {
  throw new Error("Access token or refresh token not found");
}

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_TOKEN, { expiresIn: "5m" });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_TOKEN, { expiresIn: "15m" });
};

export const verifyAccessToken = (token, isMiddleware = false) => {
  if (isMiddleware) {
    return jwtDecode(token); 
  }
  return jwt.verify(token, ACCESS_TOKEN); 
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN);
};

export const generateAuthTokens = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
