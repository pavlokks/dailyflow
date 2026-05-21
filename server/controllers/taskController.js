import Task from '../models/Task.js';

export const createTask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    const task = await Task.create({
      title,
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
    const { title, completed } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    if (title !== undefined) {
      task.title = title;
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
