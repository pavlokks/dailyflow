import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

const allowedPriorities = ['low', 'medium', 'high'];

const normalizeTaskPayload = ({ deadline, description, position, priority, project, title }) => {
  const payload = {};

  if (title !== undefined) {
    payload.title = title.trim();
  }

  if (description !== undefined) {
    payload.description = description.trim();
  }

  if (priority !== undefined) {
    payload.priority = priority;
  }

  if (position !== undefined) {
    payload.position = Number(position);
  }

  if (deadline !== undefined) {
    payload.deadline = deadline ? new Date(deadline) : null;
  }

  if (project !== undefined) {
    payload.project = project || null;
  }

  return payload;
};

const validatePriority = (priority) => {
  return priority === undefined || allowedPriorities.includes(priority);
};

const validateDeadline = (deadline) => {
  return deadline === undefined || !deadline || !Number.isNaN(new Date(deadline).getTime());
};

const validatePosition = (position) => {
  return position === undefined || Number.isFinite(Number(position));
};

const validateProject = async (projectId, userId) => {
  if (projectId === undefined || projectId === null || projectId === '') {
    return true;
  }

  if (!mongoose.isValidObjectId(projectId)) {
    return false;
  }

  const project = await Project.findOne({
    _id: projectId,
    user: userId,
  });

  return Boolean(project);
};

export const createTask = async (req, res) => {
  try {
    const { deadline, description, position, priority = 'medium', project, title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: 'Назва задачі необхідна',
      });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({
        message: 'Пріоритет повинен бути низьким, середнім або високим',
      });
    }

    if (!validateDeadline(deadline)) {
      return res.status(400).json({
        message: 'Дата терміну некоректна',
      });
    }

    if (!validatePosition(position)) {
      return res.status(400).json({
        message: 'Позиція задачі некоректна',
      });
    }

    if (!(await validateProject(project, req.user._id))) {
      return res.status(400).json({
        message: 'Проєкт некоректний',
      });
    }

    const lastTask = await Task.findOne({
      user: req.user._id,
      deletedAt: null,
    }).sort({ position: -1, createdAt: -1 });

    const task = await Task.create({
      ...normalizeTaskPayload({
        deadline,
        description,
        position: position ?? (lastTask?.position || 0) + 1,
        priority,
        project,
        title,
      }),
      user: req.user._id,
    });

    const populatedTask = await Task.findById(task._id).populate('project', 'name');

    return res.status(201).json(populatedTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Створення задачі неуспішне',
      error: error.message,
    });
  }
};

export const getUserTasks = async (req, res) => {
  try {
    const showTrash = req.query.trash === 'true';
    const tasks = await Task.find({
      user: req.user._id,
      deletedAt: showTrash ? { $ne: null } : null,
    })
      .populate('project', 'name')
      .sort({ position: 1, createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: 'Отримання задач неуспішне',
      error: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { completed, deadline, description, position, priority, project, title } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });

    if (!task) {
      return res.status(404).json({
        message: 'Задача незнайдена',
      });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        message: 'Назва задачі порожня',
      });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({
        message: 'Пріоритет повинен бути низьким, середнім або високим',
      });
    }

    if (!validateDeadline(deadline)) {
      return res.status(400).json({
        message: 'Дата терміну некоректна',
      });
    }

    if (!validatePosition(position)) {
      return res.status(400).json({
        message: 'Позиція задачі некоректна',
      });
    }

    if (!(await validateProject(project, req.user._id))) {
      return res.status(400).json({
        message: 'Проєкт некоректний',
      });
    }

    const taskPayload = normalizeTaskPayload({
      deadline,
      description,
      position,
      priority,
      project,
      title,
    });

    if (title !== undefined) {
      task.title = taskPayload.title;
    }

    if (description !== undefined) {
      task.description = taskPayload.description;
    }

    if (priority !== undefined) {
      task.priority = taskPayload.priority;
    }

    if (position !== undefined) {
      task.position = taskPayload.position;
    }

    if (deadline !== undefined) {
      task.deadline = taskPayload.deadline;
    }

    if (project !== undefined) {
      task.project = taskPayload.project;
    }

    if (completed !== undefined) {
      task.completed = completed;
    }

    await task.save();
    const updatedTask = await Task.findById(task._id).populate('project', 'name');

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Оновлення задачі неуспішне',
      error: error.message,
    });
  }
};

export const reorderTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        message: 'Потрібен список задач для сортування',
      });
    }

    const uniqueTaskIds = [...new Set(taskIds.map((taskId) => String(taskId)))];

    if (!uniqueTaskIds.every((taskId) => mongoose.isValidObjectId(taskId))) {
      return res.status(400).json({
        message: 'Список задач некоректний',
      });
    }

    const tasksCount = await Task.countDocuments({
      _id: { $in: uniqueTaskIds },
      user: req.user._id,
      deletedAt: null,
    });

    if (tasksCount !== uniqueTaskIds.length) {
      return res.status(400).json({
        message: 'Не всі задачі доступні для сортування',
      });
    }

    await Promise.all(
      uniqueTaskIds.map((taskId, index) =>
        Task.updateOne(
          {
            _id: taskId,
            user: req.user._id,
            deletedAt: null,
          },
          {
            position: index + 1,
          },
        ),
      ),
    );

    const tasks = await Task.find({
      user: req.user._id,
      deletedAt: null,
    })
      .populate('project', 'name')
      .sort({ position: 1, createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: 'Сортування задач неуспішне',
      error: error.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });

    if (!task) {
      return res.status(404).json({
        message: 'Задача некоректна',
      });
    }

    task.deletedAt = new Date();
    await task.save();

    return res.json({
      message: 'Задача переміщена у кошик',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Видалення задачі неуспішне',
      error: error.message,
    });
  }
};

export const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: { $ne: null },
    });

    if (!task) {
      return res.status(404).json({
        message: 'Задача незнайдена',
      });
    }

    task.deletedAt = null;
    await task.save();
    const restoredTask = await Task.findById(task._id).populate('project', 'name');

    return res.json(restoredTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Відновлення задачі неуспішне',
      error: error.message,
    });
  }
};

export const permanentlyDeleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: { $ne: null },
    });

    if (!task) {
      return res.status(404).json({
        message: 'Задача незнайдена',
      });
    }

    return res.json({
      message: 'Задача остаточно видалена',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Видалення остаточно неуспішне',
      error: error.message,
    });
  }
};

export const emptyTaskTrash = async (req, res) => {
  try {
    await Task.deleteMany({
      user: req.user._id,
      deletedAt: { $ne: null },
    });

    return res.json({
      message: 'Кошик задач порожній',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Видалення задач з кошика неуспішне',
      error: error.message,
    });
  }
};
