import mongoose, { Schema, Document } from "mongoose";

export type PluginState = "not_started" | "in_progress" | "polishing" | "review" | "finished";
export type PluginStatus = "not_ready" | "ready" | "on_bbb_free" | "on_bbb_paid";
export type PluginAuthor = "Mystic" | "MacSig";

export interface IPlugin extends Document {
  name: string;
  pluginName: string;
  description: string;
  author: PluginAuthor;
  price: number;
  state: PluginState;
  licensed: boolean;
  obfuscated: boolean;
  status: PluginStatus;
  createdAt: Date;
}

const PluginSchema = new Schema<IPlugin>({
  name: { type: String, required: true },
  pluginName: { type: String, required: true },
  description: { type: String, default: "" },
  author: { type: String, enum: ["Mystic", "MacSig"], required: true },
  price: { type: Number, default: 0 },
  state: {
    type: String,
    enum: ["not_started", "in_progress", "polishing", "review", "finished"],
    default: "not_started",
  },
  licensed: { type: Boolean, default: false },
  obfuscated: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["not_ready", "ready", "on_bbb_free", "on_bbb_paid"],
    default: "not_ready",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Plugin || mongoose.model<IPlugin>("Plugin", PluginSchema);
