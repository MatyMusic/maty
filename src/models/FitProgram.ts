// src/models/FitProgram.ts
import mongoose, { Schema, type Document, type Model } from "mongoose";

export type FitLevel = "beginner" | "intermediate" | "advanced";
export type FitGoal = "fat_loss" | "muscle_gain" | "endurance" | "general";

export type FitExercise = {
  name: string;
  sets: number;
  reps?: number;
  timeSec?: number;
  restSec?: number;
};

export type FitDay = {
  dayIndex: number; // 1-7
  title: string;
  notes?: string;
  exercises: FitExercise[];
};

export interface FitProgramDoc extends Document {
  userId: string;
  goal: FitGoal;
  level: FitLevel;
  daysPerWeek: number;
  equipment: string[];
  createdAt: Date;
  updatedAt: Date;
  plan: FitDay[];
}

const ExerciseSchema = new Schema<FitExercise>(
  {
    name: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number },
    timeSec: { type: Number },
    restSec: { type: Number },
  },
  { _id: false }
);

const DaySchema = new Schema<FitDay>(
  {
    dayIndex: { type: Number, required: true },
    title: { type: String, required: true },
    notes: { type: String },
    exercises: { type: [ExerciseSchema], default: [] },
  },
  { _id: false }
);

const FitProgramSchema = new Schema<FitProgramDoc>(
  {
    userId: { type: String, required: true, index: true },
    goal: { type: String, required: true },
    level: { type: String, required: true },
    daysPerWeek: { type: Number, required: true },
    equipment: { type: [String], default: [] },
    plan: { type: [DaySchema], default: [] },
  },
  { timestamps: true }
);

export default (mongoose.models.FitProgram as Model<FitProgramDoc>) ||
  mongoose.model<FitProgramDoc>("FitProgram", FitProgramSchema);

