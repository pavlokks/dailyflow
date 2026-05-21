import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: '7d'
  });
};

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  city: user.city,
  createdAt: user.createdAt
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      city
    });

    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: toUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = createToken(user._id);

    return res.json({
      token,
      user: toUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};
