import { z } from "zod";
import { UNIVERSITY_ID_REGEX } from "@/lib/student/types";

export const universityIdSchema = z.string().regex(UNIVERSITY_ID_REGEX, "University ID must be exactly 9 digits");
export const studentAdminIdsSchema = z.strictObject({
  ids: z.string().trim().min(1).max(1000).transform((value, ctx) => {
    const ids = [...new Set(value.split(/[,\r\n]+/).map((id) => id.trim()).filter(Boolean))];
    if (!ids.length || ids.length > 100 || ids.some((id) => !UNIVERSITY_ID_REGEX.test(id))) {
      ctx.addIssue({ code: "custom", message: "Enter up to 100 university IDs, each exactly 9 digits" });
      return z.NEVER;
    }
    return ids;
  }),
});
