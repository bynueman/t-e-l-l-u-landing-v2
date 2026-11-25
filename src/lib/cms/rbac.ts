export type AdminRole = "owner" | "editor" | "author";
export type UserStatus = "active" | "inactive";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: UserStatus;
}

export function canAccessAdmin(user: AdminUser | null | undefined): user is AdminUser {
  return Boolean(user && user.status === "active");
}

export function canPublishPost(role: AdminRole): boolean {
  return role === "owner" || role === "editor";
}

export function canEditPost(user: AdminUser, postAuthorId: string): boolean {
  if (user.role === "owner" || user.role === "editor") return true;
  return user.role === "author" && postAuthorId === user.id;
}

export function canChangePostStatus(
  user: AdminUser,
  postAuthorId: string,
  nextStatus: string
): boolean {
  if (user.role === "owner" || user.role === "editor") return true;
  if (user.role === "author" && postAuthorId === user.id) {
    return nextStatus === "draft" || nextStatus === "in_review";
  }
  return false;
}

export function canDeletePost(user: AdminUser, postAuthorId: string, status: string): boolean {
  if (user.role === "owner" || user.role === "editor") return true;
  return user.role === "author" && postAuthorId === user.id && (status === "draft" || status === "in_review");
}

export function canAssignAuthor(role: AdminRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManageCategories(role: AdminRole): boolean {
  return role === "owner" || role === "editor";
}

export function canUploadMedia(role: AdminRole): boolean {
  return role === "owner" || role === "editor" || role === "author";
}

export function canDeleteMedia(role: AdminRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManageUsers(role: AdminRole): boolean {
  return role === "owner";
}

export function canManageSettings(role: AdminRole): boolean {
  return role === "owner";
}

export function canViewActivity(role: AdminRole): boolean {
  return role === "owner" || role === "editor";
}
