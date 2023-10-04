import "dotenv/config";
import Stripe from "stripe";

if (!process.env.STRIPE_SK) {
  throw "Set STRIPE_SK env variable";
}

const stripe = new Stripe(process.env.STRIPE_SK, {
  apiVersion: "2023-08-16",
  typescript: true,
});

export default stripe;
