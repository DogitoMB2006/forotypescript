import type { Category } from '../types/category';
import { CATEGORIES } from '../types/category';

export const getCategoryById = (categoryId: string): Category | null => {
  return CATEGORIES.find(category => category.id === categoryId) || null;
};

export const getAllCategories = (): Category[] => {
  return CATEGORIES;
};