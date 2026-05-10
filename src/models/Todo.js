import mongoose from 'mongoose';

const { Schema } = mongoose;

const todoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, '할일 제목은 필수입니다.'],
      trim: true,
      minlength: [1, '할일 제목은 1자 이상이어야 합니다.'],
      maxlength: [200, '할일 제목은 200자 이하여야 합니다.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, '상세 설명은 2000자 이하여야 합니다.'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '우선순위는 low, medium, high 중 하나여야 합니다.',
      },
      default: 'medium',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every((t) => typeof t === 'string' && t.length <= 30),
        message: '각 태그는 30자 이하의 문자열이어야 합니다.',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

todoSchema.index({ createdAt: -1 });
todoSchema.index({ dueDate: 1 });

todoSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  return this.dueDate.getTime() < Date.now();
});

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;
