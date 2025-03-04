import jwt from 'jsonwebtoken';
import { configDotenv } from 'dotenv';

configDotenv();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

if(!ACCESS_TOKEN || !REFRESH_TOKEN) {
    throw new Error('Access token or refresh token not found');
}

export const generateAccessToken = (payload) => {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN, { expiresIn: '15s' });
}

export const generateRefreshToken = (payload) => {
    const accessToken = jwt.sign(payload, REFRESH_TOKEN, { expiresIn: '45s' });
}

export const verifyAccessToken = (token) => {  
    return jwt.verify(token, ACCESS_TOKEN);
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_TOKEN);
}

export const generateAuthTokens = (payload) => {    
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return { accessToken, refreshToken };
}