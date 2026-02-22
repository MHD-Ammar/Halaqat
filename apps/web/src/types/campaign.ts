export interface QuestionBase {
  id: string;
  type: "BOOLEAN" | "NUMBER" | "GRID";
  title: string;
}

export interface BooleanQuestion extends QuestionBase {
  type: "BOOLEAN";
  xpYes: number;
  xpNo: number;
}

export interface NumberQuestion extends QuestionBase {
  type: "NUMBER";
  multiplier: number;
  max: number;
}

export interface GridRow {
  id: string;
  label: string;
}

export interface GridColumn {
  id: string;
  label: string;
  xp: number;
}

export interface GridQuestion extends QuestionBase {
  type: "GRID";
  rows: GridRow[];
  columns: GridColumn[];
}

export type CampaignQuestion = BooleanQuestion | NumberQuestion | GridQuestion;

export interface Campaign {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  formConfig: CampaignQuestion[];
  createdAt: string;
  updatedAt: string;
}

export type CreateCampaignDto = Omit<Campaign, "id" | "createdAt" | "updatedAt">;
export type UpdateCampaignDto = Partial<CreateCampaignDto>;
