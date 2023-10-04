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

  const invoices = await stripe.invoices.list({
    customer: customer_id,
    status: "open",
    limit: 1,
  });

  let refund_amount = 0;

  if (invoices.data.length) {
    const invoice = invoices.data[0];
    const invoice_outstanding_amount = invoice.amount_due;
    let payment_amount: number;
    if (available_balance <= invoice_outstanding_amount) {
      // under or equal to the outstanding
      payment_amount = available_balance;
    } else {
      // overpayment
      payment_amount = invoice_outstanding_amount;
      refund_amount = available_balance - invoice_outstanding_amount;
    }
    // create payment for whole balance available
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payment_amount,
      currency: "gbp",
      customer: customer_id,
      payment_method_types: ["customer_balance"],
      payment_method_data: {
        type: "customer_balance",
      },
      confirm: true,
    });

    const req = await fetch(
      `https://api.stripe.com/v1/invoices/${invoice.id}/attach_payment_intent`,
      {
        method: "POST",
        headers: {
          "Stripe-Version": "2022-08-01;invoice_partial_payments_beta=v1",
          Authorization: "Basic " + btoa(process.env.STRIPE_SK + ":"),
        },
        body: new URLSearchParams({ payment_intent: paymentIntent.id }),
      }
    );

    const resp = await req.json();
    console.log(resp);
    available_balance <= invoice_outstanding_amount;
  } else {
    // No invoice found for this payment, refund everything
    refund_amount = available_balance;
  }

  if (refund_amount > 0) {
    const refund = await stripe.refunds.create({
      amount: refund_amount,
      currency: 'gbp',
      customer: customer_id,
      origin: 'customer_balance'
    })
  }

  res.status(200).json({ message: "nice" });
}
