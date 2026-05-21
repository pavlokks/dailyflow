import Task from '../models/Task.js';

const allowedPriorities = ['low', 'medium', 'high'];

const normalizeTaskPayload = ({ deadline, description, priority, title }) => {
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

  if (deadline !== undefined) {
    payload.deadline = deadline ? new Date(deadline) : null;
  }

  return payload;
};

const validatePriority = (priority) => {
  return priority === undefined || allowedPriorities.includes(priority);
};

const validateDeadline = (deadline) => {
  return deadline === undefined || !deadline || !Number.isNaN(new Date(deadline).getTime());
};

export const createTask = async (req, res) => {
  try {
    const { deadline, description, priority = 'medium', title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({
        message: 'Priority must be low, medium or high'
      });
    }

    if (!validateDeadline(deadline)) {
      return res.status(400).json({
        message: 'Deadline must be a valid date'
      });
    }

    const task = await Task.create({
      ...normalizeTaskPayload({
        deadline,
        description,
        priority,
        title
      }),
      user: req.user._id
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create task',
      error: error.message
    });
  }
};

export const getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get tasks',
      error: error.message
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { completed, deadline, description, priority, title } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        message: 'Task title cannot be empty'
      });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({
        message: 'Priority must be low, medium or high'
      });
    }

    if (!validateDeadline(deadline)) {
      return res.status(400).json({
        message: 'Deadline must be a valid date'
      });
    }

    const taskPayload = normalizeTaskPayload({
      deadline,
      description,
      priority,
      title
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

    if (deadline !== undefined) {
      task.deadline = taskPayload.deadline;
    }

    if (completed !== undefined) {
      task.completed = completed;
    }

    const updatedTask = await task.save();

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update task',
      error: error.message
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    return res.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete task',
      error: error.message
    });
  }
};
