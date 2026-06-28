import { redirect } from "next/navigation";

/** 旧URL → 新しい onboarding へ */
export default function RegisterPage() {
  redirect("/onboarding");
}
