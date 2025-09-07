export class CreateMenuDto {
  path: string;
  title: string;
  iconType: string;
  iconTheme: string;
  icon: string;
  parentId?: number; // Optionnel, pour associer à un menu parent
}
