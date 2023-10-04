import stripe from "@/app/stripe";
import type { NextApiRequest, NextApiResponse } from "next";

interface ResponseData {
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log(req.body);

  const available_balance = req.body.data.object.available.gbp;
  const customer_id = req.body.data.object.customer;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: available_balance,
    currency: "gbp",
    customer: customer_id,
    payment_method_types: ["customer_balance"],
    payment_method_data: {
      type: "customer_balance",
    },
    confirm: true,
  });

  console.log(paymentIntent.id);
  res.status(200).json({ message: "nice" });
}
