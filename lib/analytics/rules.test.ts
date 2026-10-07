import { describe,it,expect } from "vitest";
import { dateRange,autoGranularity,cairoBucket,changePercent,isAtRisk,canManageCashier,rangeSchema } from "./rules";
import { csvCell,csvDocument } from "./csv";
describe("analytics rules",()=>{
 it("uses inclusive Cairo dates and same-length previous period",()=>{expect(dateRange({from:"2026-04-25",to:"2026-05-04"})).toMatchObject({from:"2026-04-25",to:"2026-05-04",previousFrom:"2026-04-15",previousTo:"2026-04-24",days:10});expect(()=>dateRange({from:"2026-05-05",to:"2026-05-04"})).toThrow();expect(rangeSchema.safeParse({from:"2026-02-30"}).success).toBe(false);});
 it("chooses granularity",()=>{expect([autoGranularity(31),autoGranularity(32),autoGranularity(180),autoGranularity(181)]).toEqual(["day","week","week","month"]);});
 it("buckets across Cairo midnight and Sunday week start",()=>{const instant=new Date("2026-05-01T21:30:00Z");expect(cairoBucket(instant,"day")).toBe("2026-05-02");expect(cairoBucket(instant,"month")).toBe("2026-05");expect(cairoBucket(instant,"week")).toBe("2026-04-26");});
 it("handles zero previous values and at risk threshold",()=>{expect(changePercent(1,0)).toBeNull();expect(changePercent(0,0)).toBe(0);expect(changePercent(15,10)).toBe(50);expect(isAtRisk(9,10)).toBe(true);expect(isAtRisk(10,10)).toBe(false);});
 it("scopes cashier management",()=>{expect(canManageCashier("a",{vendorId:"a",role:"cashier"})).toBe(true);expect(canManageCashier("a",{vendorId:"b",role:"cashier"})).toBe(false);expect(canManageCashier("a",{vendorId:"a",role:"vendor_manager"})).toBe(false);});
});
describe("CSV",()=>{it("quotes RFC 4180 cells, guards formulas, and emits BOM",()=>{expect(csvCell('a,"b"\r\nc')).toBe('"a,""b""\r\nc"');for(const sign of ["=","+","-","@"])expect(csvCell(sign+"SUM(1)")).toBe(`"'${sign}SUM(1)"`);expect(csvDocument(["name"],[["علي"]])).toBe('\uFEFF"name"\r\n"علي"\r\n');});});
