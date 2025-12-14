import * as jose from 'jose';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

if (!ACCESS_TOKEN || !REFRESH_TOKEN) {
  throw new Error("Access token or refresh token not found");
}

// Convert secret keys to Uint8Array for jose
const accessSecret = new TextEncoder().encode(ACCESS_TOKEN);
const refreshSecret = new TextEncoder().encode(REFRESH_TOKEN);

export const generateAccessToken = async (payload) => {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(accessSecret);
};

export const generateRefreshToken = async (payload) => {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('40m')
    .sign(refreshSecret);
};

export const verifyAccessToken = async (token, isMiddleware = false) => {
  if (isMiddleware) {
    return jose.decodeJwt(token);
  }
  try {
    const { payload } = await jose.jwtVerify(token, accessSecret);
    return payload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = async (token) => {
  try {
    const { payload } = await jose.jwtVerify(token, refreshSecret);
    return payload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const generateAuthTokens = async (payload) => {
  return {
    accessToken: await generateAccessToken(payload),
    refreshToken: await generateRefreshToken(payload),
  };
};