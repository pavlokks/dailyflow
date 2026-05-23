import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET невизначений');
  }

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: '7d',
  });
};

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  city: user.city,
  createdAt: user.createdAt,
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Ім'я, емейл і пароль необхідні",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'Такий користувач вже є у системі',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      city,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Реєстрація неуспішна',
      error: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Емейл і пароль необхідні',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: 'Невірний емейл або пароль',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Невірний емейл або пароль',
      });
    }

    const token = createToken(user._id);

    return res.json({
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Авторизація неуспішна',
      error: error.message,
    });
  }
};

export const getCurrentUser = (req, res) => {
  return res.json({
    user: toUserResponse(req.user),
  });
};

export const updateCurrentUser = async (req, res) => {
  try {
    const { city } = req.body;

    if (city === undefined) {
      return res.status(400).json({
        message: 'Місто необхідне',
      });
    }

    req.user.city = city.trim();
    const updatedUser = await req.user.save();

    return res.json({
      user: toUserResponse(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Оновлення профілю неуспішне',
      error: error.message,
    });
  }
};
