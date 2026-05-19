import mongoose, { Schema, Document } from "mongoose";

export interface INote {
  _id?: string;
  content: string;
  type: "good" | "bad";
  weight: 1 | 2 | 3;
  createdAt: Date;
  createdBy: string;
}

export interface IStaff extends Document {
  username: string;
  role: string;
  score: number;
  notes: INote[];
  rankHistory: { action: "rankup" | "derank"; role: string; date: Date }[];
  createdAt: Date;
}

const NoteSchema = new Schema<INote>({
  content: { type: String, required: true },
  type: { type: String, enum: ["good", "bad"], required: true },
  weight: { type: Number, enum: [1, 2, 3], required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
});

const StaffSchema = new Schema<IStaff>({
  username: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  score: { type: Number, default: 0 },
  notes: [NoteSchema],
  rankHistory: [
    {
      action: { type: String, enum: ["rankup", "derank"] },
      role: String,
      date: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
