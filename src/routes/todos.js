import { Router } from 'express';
import mongoose from 'mongoose';
import Todo from '../models/Todo.js';

const router = Router();

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'dueDate',
  'priority',
  'title',
]);

const UPDATABLE_FIELDS = ['title', 'description', 'priority', 'dueDate', 'tags'];

function handleValidationError(err, res) {
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    res.status(400).json({
      error: 'ValidationError',
      message: '입력값이 올바르지 않습니다.',
      details,
    });
    return true;
  }
  return false;
}

function ensureValidId(id, res) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      error: 'InvalidId',
      message: '유효하지 않은 할일 ID 입니다.',
    });
    return false;
  }
  return true;
}

router.get('/', async (req, res, next) => {
  try {
    const {
      priority,
      tag,
      search,
      sort = '-createdAt',
      page = '1',
      limit = '20',
    } = req.query;

    const filter = {};
    if (priority) filter.priority = priority;
    if (tag) filter.tags = tag;
    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const sortField = String(sort).startsWith('-') ? String(sort).slice(1) : String(sort);
    const sortOption = ALLOWED_SORT_FIELDS.has(sortField)
      ? { [sortField]: String(sort).startsWith('-') ? -1 : 1 }
      : { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Todo.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Todo.countDocuments(filter),
    ]);

    res.json({
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ensureValidId(id, res)) return;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({
        error: 'NotFound',
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    res.json({ data: todo });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, tags } = req.body ?? {};

    const payload = { title };
    if (description !== undefined) payload.description = description;
    if (priority !== undefined) payload.priority = priority;
    if (dueDate !== undefined) payload.dueDate = dueDate;
    if (tags !== undefined) payload.tags = tags;

    const todo = await Todo.create(payload);

    res.status(201).json({
      message: '할일이 생성되었습니다.',
      data: todo,
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ensureValidId(id, res)) return;

    const body = req.body ?? {};
    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'NoUpdatableFields',
        message: '수정할 값이 없습니다.',
      });
    }

    const todo = await Todo.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      context: 'query',
    });

    if (!todo) {
      return res.status(404).json({
        error: 'NotFound',
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    res.json({
      message: '할일이 수정되었습니다.',
      data: todo,
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ensureValidId(id, res)) return;

    const todo = await Todo.findByIdAndDelete(id);
    if (!todo) {
      return res.status(404).json({
        error: 'NotFound',
        message: '해당 할일을 찾을 수 없습니다.',
      });
    }

    res.json({
      message: '할일이 삭제되었습니다.',
      data: todo,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
