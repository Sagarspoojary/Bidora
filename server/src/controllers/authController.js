import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { pgPool } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { sendResetEmail } from '../services/emailService.js';

const SALT_ROUNDS = 12;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register new user
export async function register(req, res) {
  const { name, email, password } = req.body;

  // Validation
  const errors = {};
  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email address';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if email already exists
    const checkUser = await pgPool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Registration failed',
        errors: { email: 'Email is already registered' },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const insertResult = await pgPool.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status, created_at',
      [name.trim(), normalizedEmail, hashedPassword, 'USER', 'ACTIVE']
    );

    const newUser = insertResult.rows[0];

    // Generate JWT for immediate login
    const token = generateToken({ id: newUser.id, role: newUser.role });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
}

// Login user
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Find user
    const result = await pgPool.query(
      'SELECT id, name, email, password_hash, role, status, avatar_url, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      // Safe generic message to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended',
      });
    }
    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is disabled',
      });
    }

    // Update lastLoginAt
    await pgPool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Generate JWT
    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          role: user.role,
          status: user.status,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
}

// Logout user
export async function logout(req, res) {
  // Stateless JWT logout is primarily handled by the client discarding the token.
  // We return a simple success confirmation.
  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

// Get current user profile
export async function me(req, res) {
  // req.user is attached by requireAuth middleware
  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatar_url,
        role: req.user.role,
        status: req.user.status,
      },
    },
  });
}

// Update profile details
export async function updateProfile(req, res) {
  const { name, avatarUrl } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: { name: 'Name must be at least 2 characters long' },
    });
  }

  try {
    const result = await pgPool.query(
      'UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, avatar_url, role, status',
      [name.trim(), avatarUrl || null, req.user.id]
    );

    const updatedUser = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatar_url,
          role: updatedUser.role,
          status: updatedUser.status,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during profile update',
    });
  }
}

// Change password
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: { newPassword: 'New password must be at least 6 characters long' },
    });
  }

  try {
    // Fetch user's current password hash
    const result = await pgPool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await pgPool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newHashedPassword,
      req.user.id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during password update',
    });
  }
}

// Request password reset link
export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required',
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user
    const result = await pgPool.query('SELECT id, name FROM users WHERE email = $1', [normalizedEmail]);
    
    if (result.rows.length === 0) {
      // Return 200 success for enumeration security
      return res.status(200).json({
        success: true,
        message: 'If the email is registered, a password reset link has been dispatched.',
      });
    }

    const user = result.rows[0];
    
    // Generate secure token
    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpires = new Date(Date.now() + 3600000); // 1 hour validity

    // Save token to DB
    await pgPool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, tokenExpires, user.id]
    );

    // Logging link to console (simulating mail delivery fallback)
    console.log(`\n==========================================`);
    console.log(`PASSWORD RESET REQUEST FOR: ${normalizedEmail}`);
    console.log(`RESET URL: http://localhost:5173/#/reset-password?token=${token}`);
    console.log(`==========================================\n`);

    // Dispatch real email via Nodemailer if configured
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendResetEmail(normalizedEmail, token);
      } else {
        console.log('Nodemailer info: EMAIL_USER and EMAIL_PASS not configured in server/.env. Running in log-simulation mode.');
      }
    } catch (emailErr) {
      console.error('Nodemailer failed, running in log-simulation mode:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'If the email is registered, a password reset link has been dispatched.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during forgot password process',
    });
  }
}

// Process actual password reset using token
export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  try {
    // Verify token validity
    const result = await pgPool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
    }

    const user = result.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear token fields
    await pgPool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during password reset',
    });
  }
}

// Google Login Token Verification handler
export async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: 'Google credential token is required',
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('Google OAuth error: GOOGLE_CLIENT_ID is not configured in environment.');
    return res.status(500).json({
      success: false,
      message: 'Google Sign-In is temporarily misconfigured. Please check environment variables.',
    });
  }

  try {
    // Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let result = await pgPool.query(
      'SELECT id, name, email, avatar_url, role, status, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    let user;

    if (result.rows.length === 0) {
      // Create user with random password since it is social login
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, SALT_ROUNDS);

      const insertResult = await pgPool.query(
        'INSERT INTO users (name, email, password_hash, avatar_url, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, avatar_url, role, status, created_at',
        [name, normalizedEmail, hashedPassword, picture || null, 'USER', 'ACTIVE']
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
      
      // Update avatar if changed or missing
      if (picture && user.avatar_url !== picture) {
        await pgPool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [picture, user.id]);
        user.avatar_url = picture;
      }
    }

    // Check status
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended',
      });
    }
    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is disabled',
      });
    }

    // Update lastLoginAt
    await pgPool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Generate Bidora session JWT
    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          role: user.role,
          status: user.status,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Google login verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid Google credential ID token',
    });
  }
}
