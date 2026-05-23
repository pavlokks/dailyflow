import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

const allowedPriorities = ['low', 'medium', 'high'];

const normalizeTaskPayload = ({ deadline, description, priority, project, title }) => {
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

const validateProject = async (projectId, userId) => {
  if (projectId === undefined || projectId === null || projectId === '') {
    return true;
  }

  if (!mongoose.isValidObjectId(projectId)) {
    return false;
  }

  const project = await Project.findOne({
    _id: projectId,
    user: userId
  });

  return Boolean(project);
};

export const createTask = async (req, res) => {
  try {
    const { deadline, description, priority = 'medium', project, title } = req.body;

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

    if (!(await validateProject(project, req.user._id))) {
      return res.status(400).json({
        message: 'Project is invalid'
      });
    }

    const task = await Task.create({
      ...normalizeTaskPayload({
        deadline,
        description,
        priority,
        project,
        title
      }),
      user: req.user._id
    });

    const populatedTask = await Task.findById(task._id).populate('project', 'name');

    return res.status(201).json(populatedTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create task',
      error: error.message
    });
  }
};

export const getUserTasks = async (req, res) => {
  try {
    const showTrash = req.query.trash === 'true';
    const tasks = await Task.find({
      user: req.user._id,
      deletedAt: showTrash ? { $ne: null } : null
    })
      .populate('project', 'name')
      .sort({ createdAt: -1 });

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
    const { completed, deadline, description, priority, project, title } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null
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

    if (!(await validateProject(project, req.user._id))) {
      return res.status(400).json({
        message: 'Project is invalid'
      });
    }

    const taskPayload = normalizeTaskPayload({
      deadline,
      description,
      priority,
      project,
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
      message: 'Failed to update task',
      error: error.message
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    task.deletedAt = new Date();
    await task.save();

    return res.json({
      message: 'Task moved to trash'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete task',
      error: error.message
    });
  }
};

export const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: { $ne: null }
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    task.deletedAt = null;
    await task.save();
    const restoredTask = await Task.findById(task._id).populate('project', 'name');

    return res.json(restoredTask);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to restore task',
      error: error.message
    });
  }
};

export const permanentlyDeleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: { $ne: null }
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    return res.json({
      message: 'Task permanently deleted'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to permanently delete task',
      error: error.message
    });
  }
};

export const emptyTaskTrash = async (req, res) => {
  try {
    await Task.deleteMany({
      user: req.user._id,
      deletedAt: { $ne: null }
    });

    return res.json({
      message: 'Task trash emptied'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to empty task trash',
      error: error.message
    });
  }
};
