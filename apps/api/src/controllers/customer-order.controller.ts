import type { Request, Response } from "express";
import { z } from "zod";
import {
  getCustomerOrder,
  listCustomerOrders,
  lookupGuestOrder,
} from "../services/customer-order.service";
import { sendSuccess } from "../utils/api-response";
import { AppError } from "../utils/app-error";

export async function listMyOrdersHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Sign in to view orders");
  }
  const orders = await listCustomerOrders(req.auth.userId);
  return sendSuccess(res, orders);
}

export async function getMyOrderHandler(req: Request, res: Response) {
  if (!req.auth?.userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Sign in to view orders");
  }
  const order = await getCustomerOrder(req.auth.userId, req.params.orderNumber);
  return sendSuccess(res, order);
}

export async function lookupGuestOrderHandler(req: Request, res: Response) {
  const body = z
    .object({
      orderNumber: z.string().trim().min(3),
      email: z.string().trim().email(),
    })
    .parse(req.body);

  const order = await lookupGuestOrder(body.orderNumber, body.email);
  return sendSuccess(res, order);
}
