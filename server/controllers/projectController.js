import Project from '../models/Project.js';

export const createProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Project name is required'
      });
    }

    const project = await Project.create({
      name: name.trim(),
      user: req.user._id
    });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create project',
      error: error.message
    });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get projects',
      error: error.message
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Project name cannot be empty'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    project.name = name.trim();
    const updatedProject = await project.save();

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update project',
      error: error.message
    });
  }
};
