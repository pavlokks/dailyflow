import Event from '../models/Event.js';

export const createEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'Event title is required'
      });
    }

    if (!date) {
      return res.status(400).json({
        message: 'Event date is required'
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      user: req.user._id
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create event',
      error: error.message
    });
  }
};

export const getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({ date: 1 });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get events',
      error: error.message
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    if (title !== undefined) {
      event.title = title;
    }

    if (description !== undefined) {
      event.description = description;
    }

    if (date !== undefined) {
      event.date = date;
    }

    const updatedEvent = await event.save();

    return res.json(updatedEvent);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update event',
      error: error.message
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    return res.json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete event',
      error: error.message
    });
  }
};
