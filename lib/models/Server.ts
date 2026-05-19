import mongoose, { Schema, Document } from "mongoose";

export interface ITodoItem {
  _id?: string;
  text: string;
  done: boolean;
  createdAt: Date;
}

export interface IServer extends Document {
  name: string;
  description?: string;
  todoList: ITodoItem[];
  createdAt: Date;
}

const TodoItemSchema = new Schema<ITodoItem>({
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const ServerSchema = new Schema<IServer>({
  name: { type: String, required: true },
  description: { type: String },
  todoList: [TodoItemSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Server || mongoose.model<IServer>("Server", ServerSchema);
