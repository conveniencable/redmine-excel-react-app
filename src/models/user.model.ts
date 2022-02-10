import { QueryData } from "./query.model";

export interface User {
  id: number;
  name: string;
  email: string;
  projects: Project[];
  default_query: QueryData;
}

export interface LoginData {
  login: string;
  password: string;
}

export interface Project {
  id: number;
  name: string;
  level: number;
  permission_add_issues: boolean;
  permission_edit_issues: boolean;
  permission_edit_own_issues: boolean;
  permission_delete_issues: boolean;
  index: number;
  disabled: boolean;
}
