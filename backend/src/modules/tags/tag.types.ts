export interface TagJson {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTagInput = {
  name: string;
  color: string;
};

export type UpdateTagInput = Partial<CreateTagInput>;

