import type { Metadata } from "next";
import { FitFinder } from "@/components/FitFinder";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Find your fit", description: "Match your stated preferences to BLOCview demo agents with transparent, deterministic reasoning." };
export default function FindYourFitPage() { return <main><Header /><FitFinder /><Footer /></main>; }
