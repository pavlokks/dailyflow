import Project from '../models/Project.js';

export const createProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Назва проєкту необхідна',
      });
    }

    const project = await Project.create({
      name: name.trim(),
      user: req.user._id,
    });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({
      message: 'Створення проєкту неуспішне',
      error: error.message,
    });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({
      message: 'Отримання проєктів неуспішне',
      error: error.message,
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Назва проєкту порожня',
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        message: 'Проєкт незнайдений',
      });
    }

    project.name = name.trim();
    const updatedProject = await project.save();

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({
      message: 'Оновлення проєкту неуспішне',
      error: error.message,
    });
  }
};
