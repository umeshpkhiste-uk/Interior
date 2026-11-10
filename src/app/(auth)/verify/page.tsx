"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resendVerificationEmail } from "@/lib/actions/auth";
import { z } from "zod";

const resendSchema = z.object({ email: z.string().email("Enter a valid email address") });
type ResendInput = z.infer<typeof resendSchema>;

export default function VerifyPage() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendInput>({ resolver: zodResolver(resendSchema) });

  async function onSubmit(values: ResendInput) {
    setServerError(null);
    const result = await resendVerificationEmail(values.email);
    if (result.error) {
      setServerError(result.error);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a verification link. Click it to activate your account and
          finish setting up your studio.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="flex flex-col gap-4">
          {status === "sent" && (
            <p className="text-sm text-muted-foreground" role="status">
              Verification email resent — check your inbox.
            </p>
          )}
          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Didn&apos;t get it? Resend to:</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" variant="outline" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Resend verification email"}
          </Button>
          <Link href="/login" className="text-sm font-medium hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
