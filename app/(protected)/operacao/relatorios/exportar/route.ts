import { exportReport } from "@/data/report-export";
export async function GET(request: Request) {
  return exportReport(request, true);
}
