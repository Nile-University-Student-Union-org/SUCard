import { z } from "zod";
import { UNIVERSITY_ID_REGEX } from "./types";
export const profileBody = z.strictObject({ universityId: z.string().regex(UNIVERSITY_ID_REGEX), acceptPrivacy: z.literal(true) });
