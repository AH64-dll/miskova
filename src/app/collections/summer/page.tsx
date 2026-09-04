import type { Metadata } from "next";
import SummerSection from "@/home/SummerSection";

export const metadata: Metadata = {
  title: "Summer Collection | Miskova Fragrances",
  description: "Summer Collection by Miskova Fragrances.",
};

export default function SummerCollectionPage() {
  return <SummerSection />;
}
