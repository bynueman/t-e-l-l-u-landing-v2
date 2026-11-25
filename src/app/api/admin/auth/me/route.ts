import { adminJson, requireAdminApi } from "@/lib/cms/http";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  return adminJson({ user: auth.user });
}
