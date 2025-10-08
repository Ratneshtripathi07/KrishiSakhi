// server/src/api/routes/auth.ts
// Authentication routes: request OTP and login.

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

router.post('/signup', AuthController.signup);
router.post('/otp', AuthController.requestOtp);
router.post('/login', AuthController.login);
router.post('/login/password', AuthController.loginWithPassword);

export { router as authRouter };