const taskTemplates = [
  {
    description: 'Clarify the goal, success criteria and available materials.',
    offsetDays: 1,
    priority: 'high',
    title: 'Define the outcome'
  },
  {
    description: 'Break the goal into smaller work blocks and estimate effort.',
    offsetDays: 2,
    priority: 'high',
    title: 'Create a step-by-step plan'
  },
  {
    description: 'Collect notes, links, files or references needed to move forward.',
    offsetDays: 3,
    priority: 'medium',
    title: 'Gather useful resources'
  },
  {
    description: 'Complete the first focused work session and capture blockers.',
    offsetDays: 5,
    priority: 'medium',
    title: 'Finish the first work block'
  },
  {
    description: 'Review progress, adjust the plan and prepare the next action.',
    offsetDays: 7,
    priority: 'low',
    title: 'Review and refine'
  }
];

const toDateInputValue = (offsetDays) => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + offsetDays);

  return deadline.toISOString().slice(0, 10);
};

const normalizeGoal = (goal) => goal.trim().replace(/\s+/g, ' ');

const generateFallbackTasks = (goal) => {
  const normalizedGoal = normalizeGoal(goal);

  return taskTemplates.map((template) => ({
    deadline: toDateInputValue(template.offsetDays),
    description: `${template.description} Goal: ${normalizedGoal}.`,
    priority: template.priority,
    title: `${template.title}: ${normalizedGoal}`
  }));
};

export const generateTasks = async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal?.trim()) {
      return res.status(400).json({
        message: 'Goal is required'
      });
    }

    const tasks = generateFallbackTasks(goal);

    return res.json({
      apiConfigured: Boolean(process.env.OPENAI_API_KEY),
      source: 'fallback-template',
      tasks
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to generate tasks',
      error: error.message
    });
  }
};
