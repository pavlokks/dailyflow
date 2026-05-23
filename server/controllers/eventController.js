import Event from '../models/Event.js';

export const createEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'Назва події необхідна',
      });
    }

    if (!date) {
      return res.status(400).json({
        message: 'Дата події необхідна',
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      user: req.user._id,
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({
      message: 'Неуспішне створення події',
      error: error.message,
    });
  }
};

export const getUserEvents = async (req, res) => {
  try {
    const showTrash = req.query.trash === 'true';
    const events = await Event.find({
      user: req.user._id,
      deletedAt: showTrash ? { $ne: null } : null,
    }).sort({ date: 1 });

    return res.json(events);
  } catch (error) {
    return res.status(500).json({
      message: 'Неуспішне отримання подій',
      error: error.message,
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });

    if (!event) {
      return res.status(404).json({
        message: 'Подія незнайдена',
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
      message: 'Оновлення події неуспішне',
      error: error.message,
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: null,
    });

    if (!event) {
      return res.status(404).json({
        message: 'Подія незнайдена',
      });
    }

    event.deletedAt = new Date();
    await event.save();

    return res.json({
      message: 'Подія переміщена у кошик',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Видалення події неуспішне',
      error: error.message,
    });
  }
};

export const restoreEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: { $ne: null },
    });

    if (!event) {
      return res.status(404).json({
        message: 'Подія незнайдена',
      });
    }

    event.deletedAt = null;
    const restoredEvent = await event.save();

    return res.json(restoredEvent);
  } catch (error) {
    return res.status(500).json({
      message: 'Відновлення події неуспішне',
      error: error.message,
    });
  }
};

export const permanentlyDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      deletedAt: { $ne: null },
    });

    if (!event) {
      return res.status(404).json({
        message: 'Подія незнайдена',
      });
    }

    return res.json({
      message: 'Подія видалена остаточно',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Видалення остаточно неуспішне',
      error: error.message,
    });
  }
};

export const emptyEventTrash = async (req, res) => {
  try {
    await Event.deleteMany({
      user: req.user._id,
      deletedAt: { $ne: null },
    });

    return res.json({
      message: 'Кошик подій порожній',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Видалення подій з кошика неуспішне',
      error: error.message,
    });
  }
};
