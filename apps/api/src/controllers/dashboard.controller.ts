import type { Request, Response } from "express";
import {
  getBestSellingProducts,
  getCategorySales,
  getDashboardSummary,
  getOrderStatusBreakdown,
  getRevenueSeries,
  type RevenueRange,
} from "../services/dashboard.service";
import { AppError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";

const REVENUE_RANGES = new Set<RevenueRange>(["7d", "30d", "90d", "ytd"]);

export async function dashboardSummaryHandler(_req: Request, res: Response) {
  const data = await getDashboardSummary();
  return sendSuccess(res, data);
}

export async function dashboardRevenueHandler(req: Request, res: Response) {
  const rangeParam = String(req.query.range ?? "30d") as RevenueRange;
  if (!REVENUE_RANGES.has(rangeParam)) {
    throw new AppError(
      400,
      "INVALID_RANGE",
      "range must be one of 7d, 30d, 90d, ytd"
    );
  }
  const data = await getRevenueSeries(rangeParam);
  return sendSuccess(res, data);
}

export async function dashboardOrdersChartHandler(_req: Request, res: Response) {
  const data = await getOrderStatusBreakdown();
  return sendSuccess(res, data);
}

export async function dashboardBestSellersHandler(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 8);
  const data = await getBestSellingProducts(
    Number.isFinite(limit) ? limit : 8
  );
  return sendSuccess(res, data);
}

export async function dashboardCategorySalesHandler(
  _req: Request,
  res: Response
) {
  const data = await getCategorySales();
  return sendSuccess(res, data);
}
